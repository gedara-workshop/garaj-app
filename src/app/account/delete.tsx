import { router } from "expo-router";
import { Trash2, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Txt } from "@/components/Txt";
import { useAuth } from "@/data/AuthProvider";
import { useGarage } from "@/data/GarageProvider";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

/** Delete account: says exactly what goes, then asks for a second tap. */
export default function DeleteAccount() {
  const { deleteAccount } = useAuth();
  const { vehicles, records } = useGarage();
  const { colors } = useTheme();
  const { t, tn } = useT();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  async function remove() {
    // Two taps instead of a dialog: confirm dialogs don't work on the web build.
    if (!confirm) return setConfirm(true);
    setError("");
    setBusy(true);
    try {
      // Signing out at the end swaps the app back to Welcome by itself.
      await deleteAccount();
    } catch {
      setError(t("common.couldntDelete"));
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <X size={22} color={colors.ink} />
        </Pressable>
        <Txt variant="heading">{t("deleteAccount.title")}</Txt>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
        <Txt className="text-ink-muted">{t("deleteAccount.intro")}</Txt>
        <View className="gap-2 rounded-md border border-line bg-surface-200 p-4">
          <Txt>{tn("deleteAccount.vehicles", vehicles.length)}</Txt>
          <Txt>{tn("deleteAccount.entries", records.length)}</Txt>
          <Txt>{t("deleteAccount.files")}</Txt>
          <Txt>{t("deleteAccount.signIn")}</Txt>
        </View>
        <Txt variant="caption">{t("deleteAccount.shared")}</Txt>
        <Txt variant="caption">{t("deleteAccount.export")}</Txt>

        {error ? (
          <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
            {error}
          </Txt>
        ) : null}
        <Button
          title={busy ? t("deleteAccount.deleting") : confirm ? t("deleteAccount.confirm") : t("deleteAccount.button")}
          kind="secondary"
          icon={Trash2}
          onPress={remove}
          disabled={busy}
        />
        <Button title={t("deleteAccount.keep")} kind="ghost" onPress={close} disabled={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}
