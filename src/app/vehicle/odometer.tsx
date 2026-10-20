import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Field } from "@/components/FormField";
import { Plate } from "@/components/Plate";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { useGarage } from "@/data/GarageProvider";
import { formatDate, formatNumber, parseAmount } from "@/data/format";
import { useTheme } from "@/theme/ThemeProvider";

/** Update odometer: the reading that drives every service bar. */
export default function UpdateOdometer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vehicles, setOdometer } = useGarage();
  const { colors } = useTheme();
  const vehicle = vehicles.find((v) => v.id === id);
  const [km, setKm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmLower, setConfirmLower] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  if (!vehicle) return null;

  async function save() {
    const reading = parseAmount(km);
    if (!(reading > 0)) return setError("Write the km reading as a number, like 54,320.");
    // A lower reading is usually a typo, but allow it on a second tap to fix a wrong one.
    if (reading < vehicle!.odometerKm && !confirmLower) {
      setConfirmLower(true);
      return setError(`That's lower than before (${formatNumber(vehicle!.odometerKm)} km). Tap Save again if it's right.`);
    }
    setError("");
    setBusy(true);
    try {
      await setOdometer(vehicle!.id, Math.round(reading));
      close();
    } catch {
      setError("Couldn't save. Check your connection and try again.");
      setBusy(false);
    }
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
        <Txt variant="heading">Update odometer</Txt>
        <View className="w-11" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 gap-5 px-4">
        <View className="flex-row items-center gap-2">
          <Plate province={vehicle.province} plate={vehicle.plate} />
          <Txt variant="label" className="text-ink-muted">
            {vehicleName(vehicle)}
          </Txt>
        </View>
        <View className="gap-1.5">
          <View className="flex-row">
            <Field
              label="Km on the clock now"
              value={km}
              onChangeText={(t) => {
                setKm(t);
                setConfirmLower(false);
              }}
              placeholder={formatNumber(vehicle.odometerKm)}
              keyboardType="number-pad"
              autoFocus
              mono
            />
          </View>
          <Txt variant="caption">
            Last reading {formatNumber(vehicle.odometerKm)} km on {formatDate(vehicle.odometerUpdatedAt)}.
          </Txt>
        </View>
        {error ? (
          <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
            {error}
          </Txt>
        ) : null}
        <Button title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
