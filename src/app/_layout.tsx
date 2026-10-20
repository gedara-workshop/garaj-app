import "../../global.css";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { JetBrainsMono_600SemiBold, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import {
  NotoSansSinhala_400Regular,
  NotoSansSinhala_500Medium,
  NotoSansSinhala_600SemiBold,
  NotoSansSinhala_700Bold,
} from "@expo-google-fonts/noto-sans-sinhala";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/data/AuthProvider";
import { GarageProvider } from "@/data/GarageProvider";
import { RemindersProvider } from "@/data/RemindersProvider";
import { LanguageProvider, useT } from "@/i18n";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

SplashScreen.preventAutoHideAsync();
// On web, Google sign in returns to a pop-up running this app: hand the result back to the opener.
WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient();

function Navigator() {
  const { scheme, colors } = useTheme();
  const { session, isLoading } = useAuth();
  // Changing language re-mounts the screens so every label, date and count switches at once.
  const { lang } = useT();

  // Keep the splash up until the saved session is read, so signed-in people never see a flash of sign in.
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack key={lang} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors["surface-100"] } }}>
        {/* Signing in or out flips these guards and Expo Router moves to the first screen allowed. */}
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="vehicle/[id]" />
          <Stack.Screen name="vehicle/new" options={{ presentation: "modal" }} />
          <Stack.Screen
            name="vehicle/options"
            options={{ presentation: "formSheet", sheetAllowedDetents: "fitToContents", sheetGrabberVisible: true }}
          />
          <Stack.Screen name="vehicle/odometer" options={{ presentation: "modal" }} />
          <Stack.Screen name="renewal/edit" options={{ presentation: "modal" }} />
          <Stack.Screen name="renewal/document" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="record/edit" options={{ presentation: "modal" }} />
          <Stack.Screen name="service/edit" options={{ presentation: "modal" }} />
          <Stack.Screen name="bill/snap" options={{ presentation: "modal" }} />
          <Stack.Screen name="reminders" options={{ presentation: "modal" }} />
          <Stack.Screen name="account/delete" options={{ presentation: "modal" }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="sign-in/phone" />
          <Stack.Screen name="sign-in/code" />
        </Stack.Protected>
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
    NotoSansSinhala_500Medium,
    NotoSansSinhala_600SemiBold,
    NotoSansSinhala_700Bold,
  });

  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GarageProvider>
              <RemindersProvider>
                <Navigator />
              </RemindersProvider>
            </GarageProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
