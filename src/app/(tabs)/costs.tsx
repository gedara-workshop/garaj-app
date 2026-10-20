import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { useGarage } from "@/data/GarageProvider";
import { formatNumber } from "@/data/format";
import { costPerKm } from "@/data/rules";
import type { RecordKind } from "@/data/types";

const kindLabel: Record<RecordKind, string> = { fuel: "Fuel", service: "Service", repair: "Repairs", other: "Other" };
const kindShade: Record<RecordKind, string> = {
  fuel: "bg-brand",
  service: "bg-brand/70",
  repair: "bg-brand/40",
  other: "bg-surface-300",
};

export default function Costs() {
  const { vehicles, records } = useGarage();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recent = records.filter((r) => new Date(r.date) >= since);
  const total = recent.reduce((s, r) => s + r.amountLkr, 0);

  const byKind = (Object.keys(kindLabel) as RecordKind[])
    .map((k) => ({ kind: k, amount: recent.filter((r) => r.kind === k).reduce((s, r) => s + r.amountLkr, 0) }))
    .filter((k) => k.amount > 0);

  const byVehicle = vehicles
    .map((v) => {
      const mine = records.filter((r) => r.vehicleId === v.id);
      return {
        v,
        amount: recent.filter((r) => r.vehicleId === v.id).reduce((s, r) => s + r.amountLkr, 0),
        perKm: costPerKm(mine),
      };
    })
    .sort((a, b) => b.amount - a.amount);
  const max = Math.max(1, ...byVehicle.map((x) => x.amount));

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-100">
      <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2">
        <Txt variant="display">Costs</Txt>

        <View className="gap-3 rounded-md border border-line bg-surface-200 p-4">
          <Txt variant="label" className="text-ink-muted">
            Spent in the last 30 days
          </Txt>
          <View className="flex-row items-baseline gap-2">
            <Txt variant="label" className="text-ink-muted">
              LKR
            </Txt>
            <Txt className="font-mono text-[34px] leading-[40px]">{formatNumber(total)}</Txt>
          </View>
          {total > 0 ? (
            <View className="h-3.5 flex-row gap-0.5 overflow-hidden rounded-full">
              {byKind.map((k) => (
                <View key={k.kind} className={kindShade[k.kind]} style={{ flex: k.amount }} />
              ))}
            </View>
          ) : null}
          <View className="flex-row flex-wrap gap-y-2">
            {byKind.map((k) => (
              <View key={k.kind} className="w-1/2 flex-row items-center gap-2 pr-3">
                <View className={`h-2.5 w-2.5 rounded-[3px] ${kindShade[k.kind]}`} />
                <Txt className="flex-1 text-[14px]">{kindLabel[k.kind]}</Txt>
                <Txt variant="number">{formatNumber(k.amount)}</Txt>
              </View>
            ))}
          </View>
        </View>

        <Txt variant="heading">By vehicle</Txt>
        <View className="overflow-hidden rounded-md border border-line bg-surface-200">
          {byVehicle.map(({ v, amount, perKm }, i) => (
            <View key={v.id} className={`gap-2 px-4 py-3.5 ${i < byVehicle.length - 1 ? "border-b border-line" : ""}`}>
              <View className="flex-row items-baseline justify-between">
                <Txt className="font-inter-semibold">{vehicleName(v)}</Txt>
                <Txt variant="number">{formatNumber(amount)}</Txt>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-surface-300">
                <View className="h-full rounded-full bg-brand" style={{ width: `${Math.max(3, (amount / max) * 100)}%` }} />
              </View>
              <Txt variant="caption">
                {perKm === null ? "Log two km readings to see cost per km" : `${perKm.toFixed(1)} per km overall`}
              </Txt>
            </View>
          ))}
        </View>
        <Txt variant="caption">
          Amounts in LKR. Bars show the last 30 days. Cost per km covers everything logged between the first and latest km readings.
        </Txt>
      </ScrollView>
    </SafeAreaView>
  );
}
