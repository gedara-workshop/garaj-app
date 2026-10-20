import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { formatNumber, formatShortLkr } from "@/data/format";
import { translate, translatePlural } from "@/i18n";
import { daysUntil, renewalLabel, renewalStatus, serviceProgress, sortRenewals } from "@/data/rules";
import type { LogRecord, Renewal, ServiceItem, Vehicle } from "@/data/types";
import { Plate } from "./Plate";
import { PhotoScrim } from "./PhotoScrim";
import { StatusChip } from "./StatusChip";
import { Txt } from "./Txt";
import { VehicleTypeIcon } from "./VehicleTypeIcon";

export const vehicleName = (v: Vehicle) => `${v.make} ${v.model}`;

/** Hero card for one vehicle: photo (or body-type icon), the one most urgent item, three stats. */
export function VehicleCard({
  vehicle,
  renewals,
  serviceItems,
  records,
  width,
  onPress,
}: {
  vehicle: Vehicle;
  renewals: Renewal[];
  serviceItems: ServiceItem[];
  records: LogRecord[];
  width?: number;
  onPress?: () => void;
}) {
  const next = sortRenewals(renewals)[0];
  const nextStatus = next ? renewalStatus(next) : undefined;
  const nextDays = next ? daysUntil(next.expiresOn) : 0;

  const nextService = serviceItems
    .map((s) => serviceProgress(s, vehicle.odometerKm).remainingKm)
    .sort((a, b) => a - b)[0];

  const year = new Date().getFullYear();
  const spentThisYear = records
    .filter((r) => new Date(r.date).getFullYear() === year)
    .reduce((sum, r) => sum + r.amountLkr, 0);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${vehicleName(vehicle)}, ${vehicle.plate}`}
      style={width ? { width } : undefined}
      className="overflow-hidden rounded-lg border border-line bg-surface-200 active:opacity-90"
    >
      {vehicle.photo ? (
        <View className="h-[172px] bg-surface-300">
          <Image source={vehicle.photo} contentFit="cover" style={{ position: "absolute", inset: 0 }} />
          <PhotoScrim />
          <View className="absolute bottom-0 left-0 right-0 gap-1.5 px-4 pb-3">
            <Txt variant="title" className="text-white">
              {vehicleName(vehicle)}
            </Txt>
            <Plate province={vehicle.province} plate={vehicle.plate} />
          </View>
        </View>
      ) : (
        <View className="h-[172px] flex-row items-center justify-between bg-brand-tint p-4">
          <View className="gap-2">
            <Txt variant="title">{vehicleName(vehicle)}</Txt>
            <Plate province={vehicle.province} plate={vehicle.plate} />
          </View>
          <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-200">
            <VehicleTypeIcon type={vehicle.type} size={32} />
          </View>
        </View>
      )}

      <View className="min-h-[48px] flex-row items-center justify-between border-b border-line px-4 py-2.5">
        {next && nextStatus ? (
          <>
            <Txt>{renewalLabel[next.kind]}</Txt>
            <StatusChip
              status={nextStatus}
              label={nextStatus === "due" ? translatePlural("status.daysOver", -nextDays) : translatePlural("status.days", nextDays)}
            />
          </>
        ) : (
          <Txt className="text-ink-muted">{translate("card.noRenewals")}</Txt>
        )}
      </View>

      <View className="flex-row">
        <Stat value={formatNumber(vehicle.odometerKm)} label={translate("card.kmOnClock")} />
        <Stat
          value={nextService === undefined ? "-" : formatNumber(Math.max(0, nextService))}
          label={translate(nextService !== undefined && nextService < 0 ? "card.kmOverdue" : "card.kmToService")}
          divider
        />
        <Stat value={formatShortLkr(spentThisYear)} label={translate("card.lkrThisYear")} divider />
      </View>
    </Pressable>
  );
}

function Stat({ value, label, divider = false }: { value: string; label: string; divider?: boolean }) {
  return (
    <View className={`flex-1 px-4 py-3 ${divider ? "border-l border-line" : ""}`}>
      <Txt variant="stat">{value}</Txt>
      <Txt variant="caption">{label}</Txt>
    </View>
  );
}
