import { Car, ChartLine, House, User } from "lucide-react-native";
import { Tabs } from "expo-router";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t, lang } = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors["ink-muted"],
        tabBarStyle: { backgroundColor: colors["surface-200"], borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: lang === "si" ? "NotoSansSinhala_600SemiBold" : "Inter_600SemiBold", fontSize: 12 },
        sceneStyle: { backgroundColor: colors["surface-100"] },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tab.home"), tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="vehicles" options={{ title: t("tab.vehicles"), tabBarIcon: ({ color }) => <Car color={color} size={22} /> }} />
      <Tabs.Screen name="costs" options={{ title: t("tab.costs"), tabBarIcon: ({ color }) => <ChartLine color={color} size={22} /> }} />
      <Tabs.Screen name="me" options={{ title: t("tab.me"), tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
