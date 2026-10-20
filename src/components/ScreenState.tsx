import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "./Button";
import { Txt } from "./Txt";

/** Full-screen spinner for the first load. */
export function ScreenLoading({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center bg-surface-100">
      <ActivityIndicator color={colors.brand} accessibilityLabel={label} />
    </View>
  );
}

/** Full-screen "couldn't load" with a retry, for when there is nothing cached to show. */
export function ScreenError({ onRetry }: { onRetry: () => void }) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 items-center justify-center gap-4 bg-surface-100 px-6">
      <Txt variant="heading">Couldn&apos;t load your garage</Txt>
      <Txt className="text-center text-ink-muted">Check your connection and try again.</Txt>
      <Button title="Try again" onPress={onRetry} />
    </SafeAreaView>
  );
}

/** Empty state inside a screen: icon well, one line of why, one action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View className="items-center gap-3 rounded-lg border border-line bg-surface-200 px-5 py-8">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-tint">
        <Icon size={26} color={colors.brand} />
      </View>
      <Txt variant="heading" className="text-center">
        {title}
      </Txt>
      <Txt className="text-center text-ink-muted">{body}</Txt>
      {action}
    </View>
  );
}
