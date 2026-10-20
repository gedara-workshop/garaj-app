import { router, useLocalSearchParams } from "expo-router";
import { Camera, Gauge, Handshake, Pencil, Trash2, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Plate } from "@/components/Plate";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { useGarage } from "@/data/GarageProvider";
import { formatDate, formatNumber } from "@/data/format";
import { useTheme } from "@/theme/ThemeProvider";

type Confirm = "sold" | "delete" | null;

/** Vehicle options sheet: edit, change photo, update odometer, sold, delete. */
export default function VehicleOptions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vehicles, markSold, deleteVehicle } = useGarage();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) return null;

  const go = (pathname: "/vehicle/new" | "/vehicle/odometer") => router.replace({ pathname, params: { id: vehicle.id } });

  // Two taps instead of a dialog: confirm dialogs don't work on the web build.
  async function finish(action: Exclude<Confirm, null>) {
    if (confirm !== action) return setConfirm(action);
    setBusy(true);
    try {
      await (action === "sold" ? markSold(vehicle!.id) : deleteVehicle(vehicle!.id));
      router.dismissTo("/");
    } catch {
      setError("Couldn't save. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <ScrollView className="bg-surface-200" contentContainerClassName="gap-1 px-4 pb-8 pt-5">
      <View className="mb-3 flex-row items-center gap-2">
        <Plate province={vehicle.province} plate={vehicle.plate} />
        <Txt variant="heading">{vehicleName(vehicle)}</Txt>
      </View>

      <Row icon={Pencil} label="Edit details" onPress={() => go("/vehicle/new")} />
      <Row icon={Camera} label={vehicle.photo ? "Change photo" : "Add a photo"} onPress={() => go("/vehicle/new")} />
      <Row
        icon={Gauge}
        label="Update odometer"
        hint={`${formatNumber(vehicle.odometerKm)} km on ${formatDate(vehicle.odometerUpdatedAt, false)}`}
        onPress={() => go("/vehicle/odometer")}
      />
      <Row
        icon={Handshake}
        label={confirm === "sold" ? "Tap again to mark as sold" : "Sold this vehicle"}
        hint="Keeps its history, stops reminders, hides it from your garage"
        onPress={() => finish("sold")}
        disabled={busy}
      />
      <Row
        icon={Trash2}
        label={confirm === "delete" ? "Tap again to delete for good" : "Delete vehicle"}
        hint="Removes its renewals, services and history. This can't be undone."
        onPress={() => finish("delete")}
        disabled={busy}
      />

      {error ? (
        <Txt accessibilityRole="alert" className="mt-2 font-inter-medium text-[13px] text-due">
          {error}
        </Txt>
      ) : null}
    </ScrollView>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  onPress,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={hint}
      onPress={onPress}
      disabled={disabled}
      className="min-h-[56px] flex-row items-center gap-3 rounded-md px-1 py-2 active:bg-surface-300"
    >
      <View className="h-10 w-10 items-center justify-center rounded-sm bg-surface-300">
        <Icon size={20} color={colors.ink} />
      </View>
      <View className="flex-1">
        <Txt className="font-inter-semibold">{label}</Txt>
        {hint ? <Txt variant="caption">{hint}</Txt> : null}
      </View>
    </Pressable>
  );
}
