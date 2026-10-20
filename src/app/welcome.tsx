import { Image } from "expo-image";
import { router } from "expo-router";
import { Bell, Camera, ChartLine, Smartphone, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Chip } from "@/components/FormField";
import { GoogleLogo } from "@/components/GoogleLogo";
import { Txt } from "@/components/Txt";
import { signInWithGoogle } from "@/data/googleSignIn";
import { languages, useT } from "@/i18n";
import type { StringKey } from "@/i18n/en";
import { useTheme } from "@/theme/ThemeProvider";

const features: { icon: LucideIcon; title: StringKey; body: StringKey }[] = [
  { icon: Bell, title: "welcome.renewalTitle", body: "welcome.renewalBody" },
  { icon: Camera, title: "welcome.billTitle", body: "welcome.billBody" },
  { icon: ChartLine, title: "welcome.costTitle", body: "welcome.costBody" },
];

export default function Welcome() {
  const { colors } = useTheme();
  const { t, lang, setLang } = useT();
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
      setError(t("welcome.googleFailed"));
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <View className="flex-1 px-6 pb-8 pt-10">
        <View className="flex-row items-start justify-between">
          <Image
            source={require("../../assets/icon.png")}
            accessibilityLabel="Garaj"
            style={{ width: 56, height: 56, borderRadius: 14 }}
          />
          {/* Each label is in its own language, so anyone can find theirs. */}
          <View className="flex-row gap-1.5">
            {languages.map((l) => (
              <Chip key={l.lang} label={l.label} selected={l.lang === lang} onPress={() => setLang(l.lang)} compact />
            ))}
          </View>
        </View>

        <Txt variant="display" accessibilityRole="header" className="mt-8">
          {t("welcome.headline")}
        </Txt>

        <View className="mt-8 gap-5">
          {features.map(({ icon: Icon, title, body }) => (
            <View key={title} className="flex-row items-start gap-3.5">
              <View className="h-11 w-11 items-center justify-center rounded-md bg-brand-tint">
                <Icon size={22} color={colors.brand} />
              </View>
              <View className="flex-1">
                <Txt className="font-inter-semibold">{t(title)}</Txt>
                <Txt variant="label" className="font-inter text-ink-muted">
                  {t(body)}
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
          <Button title={t("welcome.phone")} icon={Smartphone} onPress={() => router.push("/sign-in/phone")} />
          <Button
            title={googleBusy ? t("welcome.googleOpening") : t("welcome.google")}
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
