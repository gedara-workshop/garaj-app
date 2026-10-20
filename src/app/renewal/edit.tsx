import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImageIcon, X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Chip, Field } from "@/components/FormField";
import { Plate } from "@/components/Plate";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { useGarage } from "@/data/GarageProvider";
import { isIsoDate } from "@/data/format";
import { renewalLabel } from "@/data/rules";
import type { RenewalKind } from "@/data/types";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

const kinds: RenewalKind[] = ["revenue_license", "insurance", "emission_test", "driving_license"];

/** Add a renewal (?vehicleId=) or edit one (?id=). */
export default function EditRenewal() {
  const { id, vehicleId: vehicleParam } = useLocalSearchParams<{ id?: string; vehicleId?: string }>();
  const { vehicles, renewals, saveRenewal, deleteRenewal } = useGarage();
  const { colors } = useTheme();
  const { t } = useT();

  const existing = id ? renewals.find((r) => r.id === id) : undefined;
  const vehicle = vehicles.find((v) => v.id === (existing?.vehicleId ?? vehicleParam));

  const [kind, setKind] = useState<RenewalKind>(existing?.kind ?? "revenue_license");
  const [provider, setProvider] = useState(existing?.provider ?? "");
  const [expiresOn, setExpiresOn] = useState(existing?.expiresOn ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // A newly picked document photo, or a request to remove the saved one.
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [removeDocument, setRemoveDocument] = useState(false);
  const shownDocument = documentUri ? { uri: documentUri } : removeDocument ? null : existing?.document;

  async function pickDocument(useCamera: boolean) {
    if (useCamera && Platform.OS !== "web") {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) return setError(t("bill.cameraOff"));
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };
    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      setDocumentUri(result.assets[0].uri);
      setRemoveDocument(false);
    }
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  // While deleting, the refetch drops the renewal before the screen closes: don't flash "not found".
  if (!vehicle || (id && !existing && !busy)) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface-100 p-6">
        <Txt variant="heading">{t("renewalForm.notFound")}</Txt>
        <Button title={t("common.back")} onPress={close} />
      </View>
    );
  }

  async function save() {
    if (!isIsoDate(expiresOn)) return setError(t("common.dateFormat"));
    setError("");
    setBusy(true);
    try {
      await saveRenewal(
        {
          id: existing?.id,
          vehicleId: vehicle!.id,
          kind,
          provider: kind === "insurance" ? provider.trim() || undefined : undefined,
          expiresOn,
        },
        { documentUri: documentUri ?? undefined, removeDocument }
      );
      close();
    } catch {
      setError(t("common.couldntSave"));
      setBusy(false);
    }
  }

  async function remove() {
    // Two taps instead of a dialog: confirm dialogs don't work on the web build.
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    try {
      await deleteRenewal(existing!.id);
      close();
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
        <Txt variant="heading">{existing ? t("renewalForm.editTitle") : t("renewalForm.addTitle")}</Txt>
        <View className="w-11" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 px-4 pb-10" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center gap-2">
            <Plate province={vehicle.province} plate={vehicle.plate} />
            <Txt variant="label" className="text-ink-muted">
              {vehicleName(vehicle)}
            </Txt>
          </View>

          <View className="gap-2">
            <Txt variant="label" className="font-inter-semibold">
              {t("renewalForm.what")}
            </Txt>
            <View className="flex-row flex-wrap gap-2">
              {kinds.map((k) => (
                <Chip key={k} label={renewalLabel[k]} selected={k === kind} onPress={() => setKind(k)} />
              ))}
            </View>
          </View>

          {kind === "insurance" ? (
            <View className="flex-row">
              <Field label={t("renewalForm.company")} value={provider} onChangeText={setProvider} placeholder="Ceylinco" />
            </View>
          ) : null}

          <View className="gap-1.5">
            <View className="flex-row">
              <Field
                label={kind === "insurance" ? t("renewalForm.renewsOn") : t("renewalForm.expiresOn")}
                value={expiresOn}
                onChangeText={setExpiresOn}
                placeholder="YYYY-MM-DD"
                mono
              />
            </View>
            <Txt variant="caption">{t("renewalForm.reminderNote")}</Txt>
          </View>

          <View className="gap-2">
            <View>
              <Txt variant="label" className="font-inter-semibold">
                {t("document.title")}
              </Txt>
              <Txt variant="caption">{t("document.hint")}</Txt>
            </View>
            {shownDocument ? (
              <View className="gap-2">
                <View className="h-[180px] overflow-hidden rounded-md border border-line bg-surface-300">
                  <Image source={shownDocument} contentFit="contain" style={{ flex: 1 }} accessibilityLabel={t("document.title")} />
                </View>
                <View className="flex-row gap-2">
                  <Button title={t("document.replace")} kind="secondary" icon={Camera} onPress={() => pickDocument(true)} className="flex-1" />
                  <Button
                    title={t("document.remove")}
                    kind="ghost"
                    onPress={() => {
                      setDocumentUri(null);
                      setRemoveDocument(true);
                    }}
                  />
                </View>
              </View>
            ) : (
              <View className="flex-row gap-2">
                <Button title={t("bill.take")} kind="secondary" icon={Camera} onPress={() => pickDocument(true)} className="flex-1" />
                <Button title={t("document.choose")} kind="secondary" icon={ImageIcon} onPress={() => pickDocument(false)} className="flex-1" />
              </View>
            )}
          </View>

          {error ? (
            <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
              {error}
            </Txt>
          ) : null}

          <Button title={busy ? t("common.saving") : t("common.save")} onPress={save} disabled={busy} />
          {existing ? (
            <Button
              title={confirmDelete ? t("common.tapAgainToDelete") : t("renewalForm.delete")}
              kind="ghost"
              onPress={remove}
              disabled={busy}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
