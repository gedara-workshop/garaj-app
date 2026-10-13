import { CircleDot, Fuel, Receipt, Wrench } from "lucide-react-native";
import { View } from "react-native";
import { formatDate, formatNumber } from "@/data/format";
import type { LogRecord } from "@/data/types";
import { useTheme } from "@/theme/ThemeProvider";
import { Txt } from "./Txt";

const icons = { service: Wrench, repair: CircleDot, fuel: Fuel, other: Receipt };

/** One history entry. Meta order is always place, km, date. Amounts are LKR. */
export function TimelineRow({ record, last = false }: { record: LogRecord; last?: boolean }) {
  const { colors } = useTheme();
  const Icon = icons[record.kind];
  const isService = record.kind === "service" || record.kind === "repair";
  const meta = [
    record.place,
    record.odometerKm ? `${formatNumber(record.odometerKm)} km` : undefined,
    formatDate(record.date, false),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View className={`min-h-[56px] flex-row items-center gap-3 py-2 ${last ? "" : "border-b border-line"}`}>
      <View className={`h-9 w-9 items-center justify-center rounded-sm ${isService ? "bg-brand-tint" : "bg-surface-300"}`}>
        <Icon size={18} color={isService ? colors.brand : colors.ink} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Txt className="font-inter-semibold">{record.title}</Txt>
        <Txt variant="caption">{meta}</Txt>
      </View>
      <Txt variant="number">{formatNumber(record.amountLkr)}</Txt>
    </View>
  );
}
