import { createContext, useContext, useMemo, type ReactNode } from "react";
import { View } from "react-native";
import { useColorScheme, vars } from "nativewind";
import { colorTokenNames } from "./token-names";
import { hexToRgbTriplet, palette, type Scheme } from "./tokens";

const themeVars = Object.fromEntries(
  (["light", "dark"] as const).map((scheme) => [
    scheme,
    vars(
      Object.fromEntries(
        colorTokenNames.map((name) => [`--${name}`, hexToRgbTriplet(palette[scheme][name])])
      )
    ),
  ])
) as Record<Scheme, ReturnType<typeof vars>>;

type ThemeValue = { scheme: Scheme; colors: Record<string, string> };
const ThemeContext = createContext<ThemeValue>({ scheme: "light", colors: palette.light });

/** Raw hex colors for props that can't take a className (tab bar, icons, status bar). */
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme();
  const scheme: Scheme = colorScheme === "dark" ? "dark" : "light";
  const value = useMemo(() => ({ scheme, colors: palette[scheme] }), [scheme]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVars[scheme]]} className="bg-surface-100">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}
