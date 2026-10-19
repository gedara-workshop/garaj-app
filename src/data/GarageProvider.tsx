import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Alert } from "react-native";
import { useAuth } from "./AuthProvider";
import { signPhotoPaths, uploadVehiclePhoto } from "./photos";
import { renewedExpiry } from "./rules";
import { supabase } from "./supabase";
import type { FuelType, LogRecord, RecordKind, Renewal, RenewalKind, ServiceItem, Vehicle, VehicleType } from "./types";

// The garage the signed-in person belongs to, loaded from Supabase through TanStack Query.
// Screens only talk to useGarage(), so the storage behind it can change without touching the UI.
type Garage = {
  vehicles: Vehicle[];
  renewals: Renewal[];
  serviceItems: ServiceItem[];
  records: LogRecord[];
  /** True only on the first load, before there is anything to show. */
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  addVehicle: (
    v: Omit<Vehicle, "id" | "photo">,
    renewals?: Omit<Renewal, "id" | "vehicleId">[],
    photoUri?: string | null
  ) => Promise<Vehicle>;
  markRenewed: (renewalId: string) => void;
};

type GarageData = Pick<Garage, "vehicles" | "renewals" | "serviceItems" | "records"> & { garageId: string };

// Database rows as PostgREST returns them (snake_case).
type VehicleRow = {
  id: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number | null;
  fuel: FuelType | null;
  color: string | null;
  province: string | null;
  plate: string;
  odometer_km: number;
  odometer_updated_at: string;
  photo_path: string | null;
};
type RenewalRow = { id: string; vehicle_id: string; kind: RenewalKind; provider: string | null; expires_on: string };
type ServiceItemRow = { id: string; vehicle_id: string; name: string; interval_km: number; last_done_km: number };
type RecordRow = {
  id: string;
  vehicle_id: string;
  kind: RecordKind;
  title: string;
  place: string | null;
  odometer_km: number | null;
  happened_on: string;
  amount_lkr: number | string;
};

const toVehicle = (r: VehicleRow, photoUrl?: string): Vehicle => ({
  id: r.id,
  type: r.type,
  make: r.make,
  model: r.model,
  year: r.year ?? undefined,
  fuel: r.fuel ?? undefined,
  color: r.color ?? undefined,
  province: r.province ?? undefined,
  plate: r.plate,
  odometerKm: r.odometer_km,
  odometerUpdatedAt: r.odometer_updated_at,
  // cacheKey is the object path, so a fresh signed link doesn't download the same photo again.
  photo: r.photo_path && photoUrl ? { uri: photoUrl, cacheKey: r.photo_path } : null,
});

const toRenewal = (r: RenewalRow): Renewal => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  kind: r.kind,
  provider: r.provider ?? undefined,
  expiresOn: r.expires_on,
});

const toServiceItem = (r: ServiceItemRow): ServiceItem => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  name: r.name,
  intervalKm: r.interval_km,
  lastDoneKm: r.last_done_km,
});

const toRecord = (r: RecordRow): LogRecord => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  kind: r.kind,
  title: r.title,
  place: r.place ?? undefined,
  odometerKm: r.odometer_km ?? undefined,
  date: r.happened_on,
  amountLkr: Number(r.amount_lkr), // numeric(12,2) can come back as a string
});

async function fetchGarage(userId: string): Promise<GarageData> {
  // A trigger gives every new user a garage, so there is always one. Row level security
  // already limits every table below to the garages this person belongs to.
  const member = await supabase
    .from("garage_members")
    .select("garage_id")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .single();
  if (member.error) throw member.error;
  const garageId: string = member.data.garage_id;

  const [vehicles, renewals, serviceItems, records] = await Promise.all([
    supabase.from("vehicles").select("*").eq("garage_id", garageId).is("sold_at", null).order("created_at"),
    supabase.from("renewals").select("*").eq("garage_id", garageId),
    supabase.from("service_items").select("*").eq("garage_id", garageId),
    supabase.from("records").select("*").eq("garage_id", garageId).order("happened_on", { ascending: false }),
  ]);
  const failed = [vehicles, renewals, serviceItems, records].find((r) => r.error);
  if (failed?.error) throw failed.error;

  const vehicleRows = vehicles.data as VehicleRow[];
  const photoUrls = await signPhotoPaths(vehicleRows.flatMap((v) => (v.photo_path ? [v.photo_path] : [])));

  return {
    garageId,
    vehicles: vehicleRows.map((v) => toVehicle(v, v.photo_path ? photoUrls.get(v.photo_path) : undefined)),
    renewals: (renewals.data as RenewalRow[]).map(toRenewal),
    serviceItems: (serviceItems.data as ServiceItemRow[]).map(toServiceItem),
    records: (records.data as RecordRow[]).map(toRecord),
  };
}

const GarageContext = createContext<Garage | null>(null);

export function GarageProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["garage", userId], [userId]);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchGarage(userId!),
    enabled: !!userId,
  });

  // Signing out drops the cached garage so the next person never sees it.
  useEffect(() => {
    if (!userId) queryClient.removeQueries({ queryKey: ["garage"] });
  }, [userId, queryClient]);

  const addVehicle = useCallback<Garage["addVehicle"]>(
    async (v, newRenewals = [], photoUri) => {
      const garageId = query.data?.garageId;
      if (!garageId) throw new Error("Your garage hasn't loaded yet.");

      const inserted = await supabase
        .from("vehicles")
        .insert({
          garage_id: garageId,
          type: v.type,
          make: v.make,
          model: v.model,
          year: v.year ?? null,
          fuel: v.fuel ?? null,
          color: v.color ?? null,
          province: v.province ?? null,
          plate: v.plate,
          odometer_km: v.odometerKm,
          odometer_updated_at: v.odometerUpdatedAt,
        })
        .select()
        .single();
      if (inserted.error) throw inserted.error;
      const vehicle = toVehicle(inserted.data as VehicleRow);

      if (newRenewals.length) {
        const { error } = await supabase.from("renewals").insert(
          newRenewals.map((r) => ({
            garage_id: garageId,
            vehicle_id: vehicle.id,
            kind: r.kind,
            provider: r.provider ?? null,
            expires_on: r.expiresOn,
          }))
        );
        if (error) {
          // Don't leave a vehicle behind without the dates the person typed in.
          await supabase.from("vehicles").delete().eq("id", vehicle.id);
          throw error;
        }
      }

      if (photoUri) {
        // The vehicle is saved either way; a failed photo only costs the photo.
        try {
          const path = await uploadVehiclePhoto(garageId, vehicle.id, photoUri);
          const { error } = await supabase.from("vehicles").update({ photo_path: path }).eq("id", vehicle.id);
          if (error) throw error;
        } catch {
          Alert.alert("Saved without the photo", "The photo didn't upload. Check your connection and add it again later.");
        }
      }

      // Wait for the refetch so the detail screen finds the new vehicle straight away.
      await queryClient.invalidateQueries({ queryKey });
      return vehicle;
    },
    [query.data?.garageId, queryClient, queryKey]
  );

  const renew = useMutation({
    mutationFn: async ({ id, expiresOn }: { id: string; expiresOn: string }) => {
      const { error } = await supabase.from("renewals").update({ expires_on: expiresOn }).eq("id", id);
      if (error) throw error;
    },
    // Show the new date at once and roll back if the save fails.
    onMutate: async ({ id, expiresOn }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GarageData>(queryKey);
      queryClient.setQueryData<GarageData>(
        queryKey,
        (d) => d && { ...d, renewals: d.renewals.map((r) => (r.id === id ? { ...r, expiresOn } : r)) }
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      Alert.alert("Couldn't save", "Check your connection and try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const markRenewed = useCallback(
    (renewalId: string) => {
      const renewal = query.data?.renewals.find((r) => r.id === renewalId);
      if (renewal) renew.mutate({ id: renewalId, expiresOn: renewedExpiry(renewal) });
    },
    [query.data?.renewals, renew]
  );

  const value = useMemo<Garage>(
    () => ({
      vehicles: query.data?.vehicles ?? [],
      renewals: query.data?.renewals ?? [],
      serviceItems: query.data?.serviceItems ?? [],
      records: query.data?.records ?? [],
      isLoading: query.isPending && !!userId,
      error: query.error,
      refetch: () => void query.refetch(),
      addVehicle,
      markRenewed,
    }),
    [query.data, query.isPending, query.error, query.refetch, userId, addVehicle, markRenewed]
  );

  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

export function useGarage() {
  const ctx = useContext(GarageContext);
  if (!ctx) throw new Error("useGarage must be used inside GarageProvider");
  return ctx;
}
