import { Text, View } from "react-native";
import { formatDate } from "@/data/format";
import { daysUntil, renewalLabel, renewalStatus } from "@/data/rules";
import type { Renewal, Vehicle } from "@/data/types";
import { Button } from "./Button";
import { Plate } from "./Plate";
import { Txt } from "./Txt";

const dayColor = { ok: "text-ok", soon: "text-soon", due: "text-due" } as const;

/** Ticket-shaped card for anything that expires. The shape itself means "document". */
export function RenewalTicket({
  renewal,
  vehicle,
  onRenewed,
}: {
  renewal: Renewal;
  vehicle?: Vehicle;
  onRenewed?: () => void;
}) {
  const status = renewalStatus(renewal);
  const days = daysUntil(renewal.expiresOn);
  const kind = renewalLabel[renewal.kind] + (renewal.provider ? ` (${renewal.provider})` : "");
  const date =
    status === "due"
      ? `Expired ${formatDate(renewal.expiresOn)}`
      : `${renewal.kind === "insurance" ? "Renews" : "Expires"} ${formatDate(renewal.expiresOn)}`;

  return (
    <View
      accessible
      accessibilityLabel={`${kind}, ${date}`}
      className="flex-row rounded-md border border-line bg-surface-200"
    >
      <View className="flex-1 gap-1 p-4">
        <Txt variant="label" className="text-ink-muted">
          {kind}
        </Txt>
        <Txt variant="heading">{date}</Txt>
        {vehicle ? (
          <View className="mt-1">
            <Plate province={vehicle.province} plate={vehicle.plate} />
          </View>
        ) : null}
        {onRenewed && status !== "ok" ? (
          <Button title="Mark renewed" kind="secondary" onPress={onRenewed} className="mt-2 min-h-[38px] self-start px-3" />
        ) : null}
      </View>
      {/* Perforation: a column of dots instead of a dashed border, which renders unevenly on iOS. */}
      <View className="w-[2px] justify-between py-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} className="h-[3px] w-[2px] rounded-full bg-line" />
        ))}
      </View>
      <View className="w-[88px] items-center justify-center px-2 py-3">
        <Text className={`font-mono text-[26px] leading-[30px] ${dayColor[status]}`}>{Math.abs(days)}</Text>
        <Txt variant="caption">{status === "due" ? "days over" : days === 1 ? "day left" : "days left"}</Txt>
      </View>
    </View>
  );
}
