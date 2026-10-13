const { colorTokenNames } = require("./src/theme/token-names");

// Every color reads a CSS variable set by ThemeProvider, so light and dark mode
// switch by swapping variables, not by writing dark: classes everywhere.
const colors = Object.fromEntries(
  colorTokenNames.map((name) => [name, `rgb(var(--${name}) / <alpha-value>)`])
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
        "inter-extrabold": ["Inter_800ExtraBold"],
        mono: ["JetBrainsMono_600SemiBold"],
        "mono-bold": ["JetBrainsMono_700Bold"],
        si: ["NotoSansSinhala_400Regular"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "22px",
      },
    },
  },
  plugins: [],
};
