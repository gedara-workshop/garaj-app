import { router, useLocalSearchParams } from "expo-router";
import { Camera, FileDown, Gauge, Handshake, Pencil, Trash2, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Plate } from "@/components/Plate";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { useGarage } from "@/data/GarageProvider";
import { shareVehicleReport } from "@/data/report";
import { formatDate, formatNumber } from "@/data/format";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

type Confirm = "sold" | "delete" | null;

/** Vehicle options sheet: edit, change photo, update odometer, sold, delete. */
export default function VehicleOptions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vehicles, renewals, serviceItems, records, markSold, deleteVehicle } = useGarage();
  const { t } = useT();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) return null;

  const go = (pathname: "/vehicle/new" | "/vehicle/odometer") => router.replace({ pathname, params: { id: vehicle.id } });

  async function exportHistory() {
    setExporting(true);
    setError("");
    try {
      const mine = <T extends { vehicleId: string }>(list: T[]) => list.filter((x) => x.vehicleId === vehicle!.id);
      await shareVehicleReport(vehicle!, mine(renewals), mine(serviceItems), mine(records).filter((r) => !r.pending));
    } catch (e) {
      console.warn("Export failed", e);
      setError(t("options.exportFailed"));
    } finally {
      setExporting(false);
    }
  }

  // Two taps instead of a dialog: confirm dialogs don't work on the web build.
  async function finish(action: Exclude<Confirm, null>) {
    if (confirm !== action) return setConfirm(action);
    setBusy(true);
    try {
      await (action === "sold" ? markSold(vehicle!.id) : deleteVehicle(vehicle!.id));
      router.dismissTo("/");
    } catch {
      setError(t("common.couldntSave"));
      setBusy(false);
    }
  }

  return (
    <ScrollView className="bg-surface-200" contentContainerClassName="gap-1 px-4 pb-8 pt-5">
      <View className="mb-3 flex-row items-center gap-2">
        <Plate province={vehicle.province} plate={vehicle.plate} />
        <Txt variant="heading">{vehicleName(vehicle)}</Txt>
      </View>

      <Row icon={Pencil} label={t("options.edit")} onPress={() => go("/vehicle/new")} />
      <Row icon={Camera} label={vehicle.photo ? t("vehicleForm.changePhoto") : t("options.addPhoto")} onPress={() => go("/vehicle/new")} />
      <Row
        icon={Gauge}
        label={t("odometer.title")}
        hint={t("options.odometerHint", { km: formatNumber(vehicle.odometerKm), date: formatDate(vehicle.odometerUpdatedAt, false) })}
        onPress={() => go("/vehicle/odometer")}
      />
      <Row
        icon={FileDown}
        label={exporting ? t("options.exporting") : t("options.export")}
        hint={t("options.exportHint")}
        onPress={exportHistory}
        disabled={exporting}
      />
      <Row
        icon={Handshake}
        label={confirm === "sold" ? t("options.soldConfirm") : t("options.sold")}
        hint={t("options.soldHint")}
        onPress={() => finish("sold")}
        disabled={busy}
      />
      <Row
        icon={Trash2}
        label={confirm === "delete" ? t("options.deleteConfirm") : t("options.delete")}
        hint={t("options.deleteHint")}
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
