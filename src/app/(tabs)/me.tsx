import { router } from "expo-router";
import { BellOff, LogOut } from "lucide-react-native";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Chip } from "@/components/FormField";
import { Txt } from "@/components/Txt";
import { useAuth } from "@/data/AuthProvider";
import { formatPhone } from "@/data/format";
import { remindersSupported, useReminders } from "@/data/RemindersProvider";
import { languages, useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

const leadTimes = [7, 14, 30, 60];

export default function Me() {
  const { colors } = useTheme();
  const { t, tn, lang, setLang } = useT();
  const { session, signOut } = useAuth();
  const user = session?.user;
  const signedInAs = user?.phone ? formatPhone(user.phone) : user?.email;
  // Saved on this phone, where the reminders are scheduled.
  const { settings, setSettings, permission, turnOn } = useReminders();
  const { leadDays, weekBefore, onTheDay } = settings;

  const switchColors = { false: colors["surface-300"], true: colors.brand };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-100">
      <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2">
        <Txt variant="display">{t("tab.me")}</Txt>

        <View className="gap-2">
          <Txt variant="heading">{t("me.language")}</Txt>
          <View className="flex-row gap-2">
            {languages.map((l) => (
              <Chip key={l.lang} label={l.label} selected={l.lang === lang} onPress={() => setLang(l.lang)} />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Txt variant="heading">{t("me.reminders")}</Txt>
          {!remindersSupported ? (
            <Txt className="text-ink-muted">{t("me.remindersWeb")}</Txt>
          ) : permission !== "granted" ? (
            <View className="gap-3 rounded-md border border-line bg-surface-200 p-4">
              <View className="flex-row items-center gap-2">
                <BellOff size={18} color={colors["ink-muted"]} />
                <Txt className="flex-1">{t("me.remindersOff")}</Txt>
              </View>
              <Button
                title={t("reminders.turnOn")}
                onPress={() => (permission === "undetermined" ? router.push("/reminders") : turnOn())}
              />
            </View>
          ) : null}
          <View className="overflow-hidden rounded-md border border-line bg-surface-200">
            <View className="gap-2.5 border-b border-line p-4">
              <Txt>{t("me.firstReminder")}</Txt>
              <View className="flex-row gap-2">
                {leadTimes.map((d) => {
                  const on = d === leadDays;
                  return (
                    <Pressable
                      key={d}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      onPress={() => setSettings({ ...settings, leadDays: d })}
                      className={`min-h-[44px] flex-1 items-center justify-center rounded-md ${
                        on ? "border-2 border-brand bg-brand-tint" : "border border-line bg-surface-200"
                      }`}
                    >
                      <Txt className={on ? "font-inter-semibold text-brand" : "text-[14px]"}>{tn("status.days", d)}</Txt>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <ToggleRow label={t("me.weekBefore")} value={weekBefore} onChange={(v) => setSettings({ ...settings, weekBefore: v })} trackColor={switchColors} />
            <ToggleRow label={t("me.onTheDay")} value={onTheDay} onChange={(v) => setSettings({ ...settings, onTheDay: v })} trackColor={switchColors} last />
          </View>
        </View>

        {user ? (
          <View className="gap-2">
            <Txt variant="heading">{t("me.account")}</Txt>
            <View className="gap-3 rounded-md border border-line bg-surface-200 p-4">
              {signedInAs ? (
                <View className="gap-0.5">
                  <Txt variant="caption">{t("me.signedInAs")}</Txt>
                  <Txt variant={user.phone ? "number" : "body"}>{signedInAs}</Txt>
                </View>
              ) : null}
              <Button title={t("me.signOut")} kind="secondary" icon={LogOut} onPress={signOut} />
            </View>
          </View>
        ) : null}

        <Txt variant="caption">{t("me.comingNext")}</Txt>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  trackColor,
  last = false,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  trackColor: { false: string; true: string };
  last?: boolean;
}) {
  return (
    <View className={`min-h-[56px] flex-row items-center justify-between px-4 ${last ? "" : "border-b border-line"}`}>
      <Txt>{label}</Txt>
      <Switch value={value} onValueChange={onChange} trackColor={trackColor} accessibilityLabel={label} />
    </View>
  );
}
