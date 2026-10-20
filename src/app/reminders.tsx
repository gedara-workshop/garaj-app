import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { RenewalTicket } from "@/components/RenewalTicket";
import { Txt } from "@/components/Txt";
import { useGarage } from "@/data/GarageProvider";
import { useReminders } from "@/data/RemindersProvider";
import { sortRenewals } from "@/data/rules";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

/** Turn on reminders: explains why first, then shows the system prompt. */
export default function TurnOnReminders() {
  const { vehicles, renewals } = useGarage();
  const { settings, turnOn, dismissPrompt } = useReminders();
  const { colors } = useTheme();
  const { t } = useT();
  const next = sortRenewals(renewals)[0];

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const when: string[] = [
    t("reminders.daysBefore", { n: settings.leadDays }),
    ...(settings.weekBefore && settings.leadDays !== 7 ? [t("reminders.weekBefore")] : []),
    ...(settings.onTheDay ? [t("reminders.onTheDay")] : []),
  ];
  const whenText =
    when.length > 1 ? `${when.slice(0, -1).join(", ")} ${t("reminders.and")} ${when[when.length - 1]}` : when[0];

  return (
    <SafeAreaView className="flex-1 justify-between bg-surface-100 px-4 pb-4">
      <View className="gap-5 pt-10">
        <View className="h-16 w-16 items-center justify-center rounded-lg bg-brand-tint">
          <Bell size={30} color={colors.brand} />
        </View>
        <View className="gap-2">
          <Txt variant="display">{t("welcome.renewalTitle")}</Txt>
          <Txt className="text-ink-muted">
            {t("reminders.body", { when: whenText })}
          </Txt>
        </View>
        {next ? <RenewalTicket renewal={next} vehicle={vehicles.find((v) => v.id === next.vehicleId)} /> : null}
      </View>

      <View className="gap-2">
        <Button
          title={t("reminders.turnOn")}
          icon={Bell}
          onPress={async () => {
            await turnOn();
            close();
          }}
        />
        <Button
          title={t("reminders.notNow")}
          kind="ghost"
          onPress={() => {
            dismissPrompt();
            close();
          }}
        />
        <Txt variant="caption" className="text-center">
          {t("reminders.changeLater")}
        </Txt>
      </View>
    </SafeAreaView>
  );
}
