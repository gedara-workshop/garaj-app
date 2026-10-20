import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, ImageIcon, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Chip } from "@/components/FormField";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { UnreadableBill } from "@/data/bill";
import { useGarage } from "@/data/GarageProvider";
import { useTheme } from "@/theme/ThemeProvider";

type Step = "pick" | "reading" | "unreadable" | "failed";

/** Snap a bill: photo, then AI reads it, then the entry form opens pre-filled for checking. */
export default function SnapBill() {
  const { vehicles, readBill } = useGarage();
  const { colors } = useTheme();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id);
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [cameraDenied, setCameraDenied] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const manual = () => router.replace({ pathname: "/record/edit", params: { vehicleId } });

  async function read(uri: string) {
    setPhoto(uri);
    setStep("reading");
    try {
      const draft = await readBill(uri);
      router.replace({ pathname: "/record/edit", params: { vehicleId, draft: JSON.stringify(draft) } });
    } catch (e) {
      setStep(e instanceof UnreadableBill ? "unreadable" : "failed");
    }
  }

  async function takePhoto() {
    // The web build has no camera API here; the file picker offers the camera on phones.
    if (Platform.OS !== "web") {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) return setCameraDenied(true);
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) read(result.assets[0].uri);
  }

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) read(result.assets[0].uri);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <X size={22} color={colors.ink} />
        </Pressable>
        <Txt variant="heading">Snap a bill</Txt>
        <View className="w-11" />
      </View>

      {vehicles.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Txt variant="heading">Add a vehicle first</Txt>
          <Txt className="text-center text-ink-muted">Bills are logged against a vehicle.</Txt>
          <Button title="Add vehicle" onPress={() => router.replace("/vehicle/new")} />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-5 px-4 pb-10">
          {vehicles.length > 1 ? (
            <View className="gap-2">
              <Txt variant="label" className="font-inter-semibold">
                Which vehicle
              </Txt>
              <View className="flex-row flex-wrap gap-2">
                {vehicles.map((v) => (
                  <Chip
                    key={v.id}
                    label={vehicleName(v)}
                    selected={v.id === vehicleId}
                    onPress={() => setVehicleId(v.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {photo ? (
            <View className="h-[320px] overflow-hidden rounded-lg bg-surface-300">
              <Image source={{ uri: photo }} contentFit="contain" style={{ flex: 1 }} />
            </View>
          ) : (
            <Txt className="text-ink-muted">
              Take a photo of a fuel receipt or service bill. Garaj reads it and fills in the entry for you to check.
            </Txt>
          )}

          {step === "reading" ? (
            <View className="flex-row items-center justify-center gap-3 py-2" accessibilityLiveRegion="polite">
              <ActivityIndicator color={colors.brand} />
              <Txt>Reading the bill...</Txt>
            </View>
          ) : null}

          {step === "unreadable" ? (
            <View accessibilityRole="alert" className="gap-1">
              <Txt variant="heading">Couldn&apos;t read this bill</Txt>
              <Txt className="text-ink-muted">
                It may be blurry, dark or cut off. Try again in good light with the whole bill in the frame.
              </Txt>
            </View>
          ) : null}

          {step === "failed" ? (
            <View accessibilityRole="alert" className="gap-1">
              <Txt variant="heading">Couldn&apos;t send the bill</Txt>
              <Txt className="text-ink-muted">Check your connection and try again, or enter it yourself.</Txt>
            </View>
          ) : null}

          {cameraDenied ? (
            <Txt className="text-ink-muted">
              Camera access is off for Garaj. Turn it on in your phone&apos;s settings, or choose a photo instead.
            </Txt>
          ) : null}

          {step !== "reading" ? (
            <View className="gap-3">
              <Button title={photo ? "Take another photo" : "Take a photo"} icon={Camera} onPress={takePhoto} />
              {step === "failed" && photo ? (
                <Button title="Try again" kind="secondary" onPress={() => read(photo)} />
              ) : (
                <Button title="Choose from photos" kind="secondary" icon={ImageIcon} onPress={choosePhoto} />
              )}
              <Button title="Enter it manually" kind="ghost" onPress={manual} />
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
