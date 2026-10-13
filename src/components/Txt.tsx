import { Text, type TextProps } from "react-native";
import { cn } from "./cn";

// Type scale from the design system. React Native text doesn't inherit fonts,
// so every piece of text goes through this component.
const variants = {
  display: "font-inter-bold text-[32px] leading-[38px] tracking-tight text-ink",
  title: "font-inter-semibold text-[22px] leading-[28px] text-ink",
  heading: "font-inter-semibold text-[17px] leading-[24px] text-ink",
  body: "font-inter text-[15px] leading-[22px] text-ink",
  label: "font-inter-medium text-[13px] leading-[18px] text-ink",
  caption: "font-inter-medium text-[12px] leading-[16px] text-ink-muted",
  stat: "font-mono text-[20px] leading-[26px] text-ink",
  number: "font-mono text-[14px] leading-[18px] text-ink",
} as const;

export type TxtVariant = keyof typeof variants;

export function Txt({
  variant = "body",
  className = "",
  ...props
}: TextProps & { variant?: TxtVariant; className?: string }) {
  return <Text {...props} className={cn(variants[variant], className)} />;
}
