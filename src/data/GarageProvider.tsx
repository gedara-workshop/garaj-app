import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { sampleRecords, sampleRenewals, sampleServiceItems, sampleVehicles } from "./sample";
import type { LogRecord, Renewal, ServiceItem, Vehicle } from "./types";

// In-memory garage for the first build. The screens only talk to this hook, so swapping
// it for Supabase + TanStack Query later doesn't touch the UI.
type Garage = {
  vehicles: Vehicle[];
  renewals: Renewal[];
  serviceItems: ServiceItem[];
  records: LogRecord[];
  addVehicle: (v: Omit<Vehicle, "id">, renewals?: Omit<Renewal, "id" | "vehicleId">[]) => Vehicle;
  markRenewed: (renewalId: string) => void;
};

const GarageContext = createContext<Garage | null>(null);

const newId = () => Math.random().toString(36).slice(2, 10);

export function GarageProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [renewals, setRenewals] = useState(sampleRenewals);
  const [serviceItems] = useState(sampleServiceItems);
  const [records] = useState(sampleRecords);

  const addVehicle = useCallback<Garage["addVehicle"]>((v, newRenewals = []) => {
    const vehicle = { ...v, id: newId() };
    setVehicles((list) => [...list, vehicle]);
    setRenewals((list) => [
      ...list,
      ...newRenewals.map((r) => ({ ...r, id: newId(), vehicleId: vehicle.id })),
    ]);
    return vehicle;
  }, []);

  const markRenewed = useCallback((renewalId: string) => {
    // Rolls the expiry forward a year from whichever is later: today or the old expiry.
    setRenewals((list) =>
      list.map((r) => {
        if (r.id !== renewalId) return r;
        const base = new Date(Math.max(Date.now(), new Date(r.expiresOn).getTime()));
        base.setFullYear(base.getFullYear() + 1);
        return { ...r, expiresOn: base.toISOString().slice(0, 10) };
      })
    );
  }, []);

  const value = useMemo(
    () => ({ vehicles, renewals, serviceItems, records, addVehicle, markRenewed }),
    [vehicles, renewals, serviceItems, records, addVehicle, markRenewed]
  );

  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

export function useGarage() {
  const ctx = useContext(GarageContext);
  if (!ctx) throw new Error("useGarage must be used inside GarageProvider");
  return ctx;
}
