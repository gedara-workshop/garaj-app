import { LogOut } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Txt } from "@/components/Txt";
import { useAuth } from "@/data/AuthProvider";
import { formatPhone } from "@/data/format";
import { useTheme } from "@/theme/ThemeProvider";

const leadTimes = [7, 14, 30, 60];

export default function Me() {
  const { colors } = useTheme();
  const { session, signOut } = useAuth();
  const user = session?.user;
  const signedInAs = user?.phone ? formatPhone(user.phone) : user?.email;
  // Local only for now; these move to the user's profile once Supabase auth is in.
  const [leadDays, setLeadDays] = useState(30);
  const [weekBefore, setWeekBefore] = useState(true);
  const [onTheDay, setOnTheDay] = useState(true);

  const switchColors = { false: colors["surface-300"], true: colors.brand };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-100">
      <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2">
        <Txt variant="display">Me</Txt>

        <View className="gap-2">
          <Txt variant="heading">Renewal reminders</Txt>
          <View className="overflow-hidden rounded-md border border-line bg-surface-200">
            <View className="gap-2.5 border-b border-line p-4">
              <Txt>First reminder</Txt>
              <View className="flex-row gap-2">
                {leadTimes.map((d) => {
                  const on = d === leadDays;
                  return (
                    <Pressable
                      key={d}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      onPress={() => setLeadDays(d)}
                      className={`min-h-[44px] flex-1 items-center justify-center rounded-md ${
                        on ? "border-2 border-brand bg-brand-tint" : "border border-line bg-surface-200"
                      }`}
                    >
                      <Txt className={on ? "font-inter-semibold text-brand" : "text-[14px]"}>{d} days</Txt>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <ToggleRow label="Again 7 days before" value={weekBefore} onChange={setWeekBefore} trackColor={switchColors} />
            <ToggleRow label="On the day it expires" value={onTheDay} onChange={setOnTheDay} trackColor={switchColors} last />
          </View>
        </View>

        {user ? (
          <View className="gap-2">
            <Txt variant="heading">Account</Txt>
            <View className="gap-3 rounded-md border border-line bg-surface-200 p-4">
              {signedInAs ? (
                <View className="gap-0.5">
                  <Txt variant="caption">Signed in as</Txt>
                  <Txt variant={user.phone ? "number" : "body"}>{signedInAs}</Txt>
                </View>
              ) : null}
              <Button title="Sign out" kind="secondary" icon={LogOut} onPress={signOut} />
            </View>
          </View>
        ) : null}

        <Txt variant="caption">Language and WhatsApp reminders land here next.</Txt>
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
