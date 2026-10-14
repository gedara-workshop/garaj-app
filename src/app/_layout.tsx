import "../../global.css";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { JetBrainsMono_600SemiBold, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { NotoSansSinhala_400Regular } from "@expo-google-fonts/noto-sans-sinhala";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/data/AuthProvider";
import { GarageProvider } from "@/data/GarageProvider";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { scheme, colors } = useTheme();
  const { isLoading } = useAuth();

  // Keep the splash up until the saved session is read, so signed-in people never see a flash of sign in.
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors["surface-100"] } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="vehicle/[id]" />
        <Stack.Screen name="vehicle/new" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
    NotoSansSinhala_400Regular,
  });

  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <GarageProvider>
          <Navigator />
        </GarageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
