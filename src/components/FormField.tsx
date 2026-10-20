import { TriangleAlert } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Txt } from "./Txt";

/** Choice chip for forms: vehicle type, fuel, renewal kind. */
export function Chip({ label, selected, onPress, compact = false }: { label: string; selected: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`items-center justify-center rounded-md ${compact ? "min-h-[36px] px-2.5" : "min-h-[44px] px-3.5"} ${
        selected ? "border-2 border-brand bg-brand-tint" : "border border-line bg-surface-200"
      }`}
    >
      <Txt className={`${compact ? "text-[13px]" : "text-[14px]"} ${selected ? "font-inter-semibold text-brand" : ""}`}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Shown under a field Snap a bill wasn't sure about. Icon plus words, never color alone. */
export function CheckThis() {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center gap-1">
      <TriangleAlert size={14} color={colors.soon} />
      <Txt variant="caption" className="text-soon">
        Check this
      </Txt>
    </View>
  );
}

/** Labelled text input. mono for numbers and dates; flagged when Snap a bill wasn't sure. */
export function Field({
  label,
  mono = false,
  flagged = false,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; mono?: boolean; flagged?: boolean }) {
  return (
    <View className="flex-1 gap-1.5">
      <Txt variant="label" className="font-inter-semibold">
        {label}
      </Txt>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#8a8f8c"
        accessibilityHint={flagged ? "Check this, the bill was hard to read here" : undefined}
        className={`h-12 rounded-sm px-3.5 text-[16px] text-ink ${mono ? "font-mono" : "font-inter"} ${
          flagged ? "border-2 border-soon bg-soon-tint" : "border border-line bg-surface-200"
        }`}
      />
      {flagged ? <CheckThis /> : null}
    </View>
  );
}
