import { useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt } from "@/components/Txt";
import { useTheme } from "@/theme/ThemeProvider";

const leadTimes = [7, 14, 30, 60];

export default function Me() {
  const { colors } = useTheme();
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

        <Txt variant="caption">
          Sign in, language and WhatsApp reminders land here next, once accounts are connected.
        </Txt>
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
