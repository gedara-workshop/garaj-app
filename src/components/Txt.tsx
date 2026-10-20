import { Children, isValidElement, type ReactNode } from "react";
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

// Sinhala needs Noto Sans Sinhala (Inter has no Sinhala letters) and taller lines, 24px for 15px
// text, so vowel signs above and below the letters don't clip.
const SINHALA = /[\u0D80-\u0DFF]/;
const sinhalaFont: Record<string, string> = {
  "font-inter": "font-si",
  "font-inter-medium": "font-si-medium",
  "font-inter-semibold": "font-si-semibold",
  "font-inter-bold": "font-si-bold",
  "font-inter-extrabold": "font-si-bold",
};

function hasSinhala(node: ReactNode): boolean {
  return Children.toArray(node).some((child) =>
    typeof child === "string"
      ? SINHALA.test(child)
      : isValidElement<{ children?: ReactNode }>(child) && hasSinhala(child.props.children)
  );
}

export function Txt({
  variant = "body",
  className = "",
  style,
  ...props
}: TextProps & { variant?: TxtVariant; className?: string }) {
  const classes = cn(variants[variant], className);
  if (!hasSinhala(props.children)) return <Text {...props} style={style} className={classes} />;

  // Numbers keep the mono face; letters switch to the Sinhala face at the same weight.
  const font = classes.match(/\bfont-inter(-\w+)?\b/)?.[0];
  const size = Number(classes.match(/\btext-\[(\d+)px\]/)?.[1] ?? 15);
  return (
    <Text
      {...props}
      className={font ? cn(classes, sinhalaFont[font]) : classes}
      style={[{ lineHeight: Math.round(size * 1.6) }, style]}
    />
  );
}
