import { Pressable, View } from "react-native";
import { Txt } from "./Txt";

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Txt variant="heading" accessibilityRole="header">
        {title}
      </Txt>
      {action ? (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
          <Txt variant="label" className="font-inter-semibold text-brand">
            {action}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
