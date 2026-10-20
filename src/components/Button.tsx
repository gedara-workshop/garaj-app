import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "./cn";
import { Txt } from "./Txt";

type Kind = "primary" | "secondary" | "ghost";

const box: Record<Kind, string> = {
  primary: "bg-brand",
  secondary: "bg-surface-200 border border-line",
  ghost: "bg-transparent",
};
const label: Record<Kind, string> = {
  primary: "text-brand-ink",
  secondary: "text-ink",
  ghost: "text-brand",
};
const iconColor: Record<Kind, string> = { primary: "brand-ink", secondary: "ink", ghost: "brand" };

export function Button({
  title,
  kind = "primary",
  icon: Icon,
  leading,
  className = "",
  ...props
}: PressableProps & {
  title: string;
  kind?: Kind;
  icon?: LucideIcon;
  /** Anything that isn't a Lucide icon, like a brand logo. */
  leading?: ReactNode;
  className?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      className={cn(
        "min-h-[48px] flex-row items-center justify-center gap-2 rounded-md px-5 active:opacity-80",
        box[kind],
        props.disabled && "opacity-50",
        className
      )}
    >
      {Icon ? <Icon size={18} color={colors[iconColor[kind]]} strokeWidth={2} /> : leading}
      <Txt className={`font-inter-semibold text-[15px] ${label[kind]}`}>{title}</Txt>
    </Pressable>
  );
}
