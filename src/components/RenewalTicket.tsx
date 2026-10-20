import { Text, View } from "react-native";
import { formatDate } from "@/data/format";
import { daysUntil, renewalLabel, renewalStatus } from "@/data/rules";
import { translate } from "@/i18n";
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
  onEdit,
}: {
  renewal: Renewal;
  vehicle?: Vehicle;
  onRenewed?: () => void;
  onEdit?: () => void;
}) {
  const status = renewalStatus(renewal);
  const days = daysUntil(renewal.expiresOn);
  const kind = renewalLabel[renewal.kind] + (renewal.provider ? ` (${renewal.provider})` : "");
  const date =
    status === "due"
      ? translate("ticket.expired", { date: formatDate(renewal.expiresOn) })
      : translate(renewal.kind === "insurance" ? "ticket.renews" : "ticket.expires", { date: formatDate(renewal.expiresOn) });

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
        {(onRenewed && status !== "ok") || onEdit ? (
          <View className="mt-2 flex-row gap-2">
            {onRenewed && status !== "ok" ? (
              <Button title={translate("ticket.markRenewed")} kind="secondary" onPress={onRenewed} className="min-h-[44px] px-3" />
            ) : null}
            {onEdit ? (
              <Button
                title={translate("ticket.edit")}
                kind="ghost"
                onPress={onEdit}
                accessibilityLabel={translate("ticket.editLabel", { kind })}
                className="min-h-[44px] px-3"
              />
            ) : null}
          </View>
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
        <Txt variant="caption">{translate(status === "due" ? "ticket.daysOver" : days === 1 ? "ticket.dayLeft" : "ticket.daysLeft")}</Txt>
      </View>
    </View>
  );
}
