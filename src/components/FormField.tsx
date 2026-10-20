import { Pressable, TextInput, View } from "react-native";
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

/** Labelled text input. mono for numbers and dates. */
export function Field({
  label,
  mono = false,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; mono?: boolean }) {
  return (
    <View className="flex-1 gap-1.5">
      <Txt variant="label" className="font-inter-semibold">
        {label}
      </Txt>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#8a8f8c"
        className={`h-12 rounded-sm border border-line bg-surface-200 px-3.5 text-[16px] text-ink ${
          mono ? "font-mono" : "font-inter"
        }`}
      />
    </View>
  );
}
