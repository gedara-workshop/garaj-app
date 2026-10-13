import { Car, ChartLine, House, User } from "lucide-react-native";
import { Tabs } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors["ink-muted"],
        tabBarStyle: { backgroundColor: colors["surface-200"], borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
        sceneStyle: { backgroundColor: colors["surface-100"] },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="vehicles" options={{ title: "Vehicles", tabBarIcon: ({ color }) => <Car color={color} size={22} /> }} />
      <Tabs.Screen name="costs" options={{ title: "Costs", tabBarIcon: ({ color }) => <ChartLine color={color} size={22} /> }} />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
