import { colorTokenNames } from "./token-names";

export type ColorToken = (typeof colorTokenNames)[number];
export type Scheme = "light" | "dark";

// Values from the Garaj design system (tokens.json). Light is the default theme.
export const palette: Record<Scheme, Record<string, string>> = {
  light: {
    "surface-100": "#f5f5f1",
    "surface-200": "#ffffff",
    "surface-300": "#ebebe5",
    ink: "#141917",
    "ink-muted": "#5a625f",
    line: "#dcdcd4",
    brand: "#0e5c55",
    "brand-ink": "#ffffff",
    "brand-tint": "#dcefeb",
    signal: "#f2a93b",
    ok: "#1d7238",
    "ok-tint": "#e0f1e5",
    soon: "#8a4f00",
    "soon-tint": "#fcefd5",
    due: "#b02318",
    "due-tint": "#fbe2df",
    "plate-bg": "#ffffff",
    "plate-ink": "#111111",
  },
  dark: {
    "surface-100": "#101312",
    "surface-200": "#191d1c",
    "surface-300": "#232827",
    ink: "#eef1ef",
    "ink-muted": "#a2aaa6",
    line: "#2f3533",
    brand: "#4cc3b4",
    "brand-ink": "#06211e",
    "brand-tint": "#15302c",
    signal: "#f2a93b",
    ok: "#5fcf88",
    "ok-tint": "#163322",
    soon: "#f3b543",
    "soon-tint": "#3a2c10",
    due: "#ff8b7b",
    "due-tint": "#3e1a16",
    "plate-bg": "#f2f2ec",
    "plate-ink": "#111111",
  },
};

export const hexToRgbTriplet = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
