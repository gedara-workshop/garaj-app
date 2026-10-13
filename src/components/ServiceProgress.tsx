import { View } from "react-native";
import { formatNumber } from "@/data/format";
import { serviceProgress } from "@/data/rules";
import type { ServiceItem } from "@/data/types";
import { Txt } from "./Txt";

const fill = { ok: "bg-ok", soon: "bg-soon", due: "bg-due" } as const;

/** Bars that fill as the vehicle drives toward its next km-based service. */
export function ServiceProgress({ items, odometerKm }: { items: ServiceItem[]; odometerKm: number }) {
  return (
    <View className="gap-4 rounded-md border border-line bg-surface-200 p-4">
      {items.slice(0, 4).map((item) => {
        const { remainingKm, share, status } = serviceProgress(item, odometerKm);
        const over = remainingKm < 0;
        return (
          <View key={item.id} className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Txt>{item.name}</Txt>
              <Txt variant="number" className={over ? "text-due" : "text-ink-muted"}>
                {over ? `${formatNumber(-remainingKm)} km over` : `${formatNumber(remainingKm)} km left`}
              </Txt>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-surface-300">
              <View className={`h-full rounded-full ${fill[status]}`} style={{ width: `${Math.max(4, share * 100)}%` }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
