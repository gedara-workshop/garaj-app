import { Check, CircleAlert, Clock } from "lucide-react-native";
import { Text, View } from "react-native";
import type { Status } from "@/data/types";
import { useTheme } from "@/theme/ThemeProvider";

const styles: Record<Status, { box: string; text: string; color: string }> = {
  ok: { box: "bg-ok-tint", text: "text-ok", color: "ok" },
  soon: { box: "bg-soon-tint", text: "text-soon", color: "soon" },
  due: { box: "bg-due-tint", text: "text-due", color: "due" },
};

const icons = { ok: Check, soon: Clock, due: CircleAlert };

/** Always icon plus words, never color alone. */
export function StatusChip({ status, label }: { status: Status; label: string }) {
  const { colors } = useTheme();
  const s = styles[status];
  const Icon = icons[status];
  return (
    <View className={`h-[26px] flex-row items-center gap-1 self-start rounded-full px-2.5 ${s.box}`}>
      <Icon size={14} color={colors[s.color]} strokeWidth={2.4} />
      <Text className={`font-inter-semibold text-[13px] ${s.text}`}>{label}</Text>
    </View>
  );
}
