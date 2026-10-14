import { Image } from "expo-image";
import { router } from "expo-router";
import { Bell, Camera, ChartLine, Smartphone, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { GoogleLogo } from "@/components/GoogleLogo";
import { Txt } from "@/components/Txt";
import { signInWithGoogle } from "@/data/googleSignIn";
import { useTheme } from "@/theme/ThemeProvider";

const features: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Bell,
    title: "Never miss a renewal",
    body: "Revenue license, insurance and emission test, reminded before they expire.",
  },
  {
    icon: Camera,
    title: "Snap a bill, we fill it in",
    body: "Service, fuel and repairs logged from a photo. You just check and save.",
  },
  {
    icon: ChartLine,
    title: "Know what each vehicle costs",
    body: "Monthly spend and cost per km, for one car or the whole family's.",
  },
];

export default function Welcome() {
  const { colors } = useTheme();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  async function continueWithGoogle() {
    setError("");
    setGoogleBusy(true);
    try {
      // On success the sign-in gate swaps Welcome for the app.
      await signInWithGoogle();
    } catch (e) {
      console.warn("Google sign in failed", e);
      setError("Google sign in didn't finish. Try again, or use your phone number.");
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <View className="flex-1 px-6 pb-8 pt-10">
        <Image
          source={require("../../assets/icon.png")}
          accessibilityLabel="Garaj"
          style={{ width: 56, height: 56, borderRadius: 14 }}
        />

        <Txt variant="display" accessibilityRole="header" className="mt-8">
          Every vehicle, every renewal, one place.
        </Txt>

        <View className="mt-8 gap-5">
          {features.map(({ icon: Icon, title, body }) => (
            <View key={title} className="flex-row items-start gap-3.5">
              <View className="h-11 w-11 items-center justify-center rounded-md bg-brand-tint">
                <Icon size={22} color={colors.brand} />
              </View>
              <View className="flex-1">
                <Txt className="font-inter-semibold">{title}</Txt>
                <Txt variant="label" className="font-inter text-ink-muted">
                  {body}
                </Txt>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-auto gap-3 pt-8">
          {error ? (
            <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
              {error}
            </Txt>
          ) : null}
          <Button title="Continue with phone number" icon={Smartphone} onPress={() => router.push("/sign-in/phone")} />
          <Button
            title={googleBusy ? "Opening Google..." : "Continue with Google"}
            kind="secondary"
            leading={<GoogleLogo />}
            onPress={continueWithGoogle}
            disabled={googleBusy}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
