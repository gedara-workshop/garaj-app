import { twMerge } from "tailwind-merge";

/** Joins class names so later classes win (NativeWind doesn't resolve conflicts by order). */
export const cn = (...classes: (string | false | null | undefined)[]) => twMerge(classes.filter(Boolean).join(" "));
