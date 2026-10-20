import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Chip, Field } from "@/components/FormField";
import { Txt } from "@/components/Txt";
import { vehicleTypeLabel } from "@/components/VehicleTypeIcon";
import { useGarage } from "@/data/GarageProvider";
import { isIsoDate } from "@/data/format";
import type { FuelType, VehicleType } from "@/data/types";
import { useTheme } from "@/theme/ThemeProvider";

const types: VehicleType[] = ["car", "suv", "van", "three-wheeler", "motorbike", "lorry"];
const fuels: FuelType[] = ["petrol", "diesel", "hybrid", "electric"];

export default function AddVehicle() {
  const { addVehicle } = useGarage();
  const { colors } = useTheme();

  const [photo, setPhoto] = useState<string | null>(null);
  const [type, setType] = useState<VehicleType>("car");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuel, setFuel] = useState<FuelType>("petrol");
  const [province, setProvince] = useState("");
  const [plate, setPlate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [licenseDate, setLicenseDate] = useState("");
  const [insuranceDate, setInsuranceDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  async function save() {
    const km = Number(odometer.replace(/[^0-9]/g, ""));
    if (!make.trim() || !model.trim()) return setError("Add the make and model, like Toyota Corolla.");
    if (!plate.trim()) return setError("Add the number plate so you can tell your vehicles apart.");
    if (province.trim() && !/^[A-Za-z]{2}$/.test(province.trim())) return setError("The province is two letters, like WP.");
    if (year && (Number(year) < 1950 || Number(year) > new Date().getFullYear() + 1)) {
      return setError("Write the year in full, like 2015.");
    }
    for (const d of [licenseDate, insuranceDate]) {
      if (d && !isIsoDate(d)) return setError("Write renewal dates as YYYY-MM-DD, like 2026-10-25.");
    }

    setError("");
    setSaving(true);
    try {
      const vehicle = await addVehicle(
        {
          type,
          make: make.trim(),
          model: model.trim(),
          year: year ? Number(year) : undefined,
          fuel,
          province: province.trim().toUpperCase() || undefined,
          plate: plate.trim().toUpperCase(),
          odometerKm: km || 0,
          odometerUpdatedAt: new Date().toISOString().slice(0, 10),
        },
        [
          ...(licenseDate ? [{ kind: "revenue_license" as const, expiresOn: licenseDate }] : []),
          ...(insuranceDate ? [{ kind: "insurance" as const, expiresOn: insuranceDate }] : []),
        ],
        photo
      );
      router.replace({ pathname: "/vehicle/[id]", params: { id: vehicle.id } });
    } catch {
      setError("Couldn't save the vehicle. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <X size={22} color={colors.ink} />
        </Pressable>
        <Txt variant="heading">Add vehicle</Txt>
        <View className="w-11" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 px-4 pb-10" keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={photo ? "Change photo" : "Add a photo of your vehicle"}
            onPress={pickPhoto}
            className="h-[188px] items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-line bg-surface-200"
          >
            {photo ? (
              <Image source={{ uri: photo }} contentFit="cover" style={{ position: "absolute", inset: 0 }} />
            ) : (
              <>
                <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-tint">
                  <Camera size={26} color={colors.brand} />
                </View>
                <Txt className="font-inter-semibold">Add a photo of your vehicle</Txt>
                <Txt variant="caption">Front corner angle, whole vehicle in frame. You can skip this.</Txt>
              </>
            )}
          </Pressable>

          <View className="gap-2">
            <Txt variant="label" className="font-inter-semibold">
              Vehicle type
            </Txt>
            <View className="flex-row flex-wrap gap-2">
              {types.map((t) => (
                <Chip key={t} label={vehicleTypeLabel[t]} selected={t === type} onPress={() => setType(t)} />
              ))}
            </View>
          </View>

          <View className="flex-row gap-3">
            <Field label="Make" value={make} onChangeText={setMake} placeholder="Toyota" />
            <Field label="Model" value={model} onChangeText={setModel} placeholder="Corolla" />
          </View>
          <View className="flex-row gap-3">
            <Field label="Year" value={year} onChangeText={setYear} placeholder="2015" keyboardType="number-pad" maxLength={4} />
            <View className="flex-1 gap-1.5">
              <Txt variant="label" className="font-inter-semibold">
                Fuel
              </Txt>
              <View className="flex-row flex-wrap gap-1.5">
                {fuels.map((f) => (
                  <Chip key={f} label={f[0].toUpperCase() + f.slice(1)} selected={f === fuel} onPress={() => setFuel(f)} compact />
                ))}
              </View>
            </View>
          </View>

          <View className="gap-1.5">
            <Txt variant="label" className="font-inter-semibold">
              Number plate
            </Txt>
            <View className="flex-row gap-2">
              <TextInput
                value={province}
                onChangeText={setProvince}
                placeholder="WP"
                autoCapitalize="characters"
                maxLength={2}
                accessibilityLabel="Province"
                placeholderTextColor="#8a8f8c"
                className="h-[52px] w-[76px] rounded-sm border-2 border-plate-ink bg-plate-bg text-center font-mono-bold text-[16px] text-plate-ink"
              />
              <TextInput
                value={plate}
                onChangeText={setPlate}
                placeholder="CAB-4521"
                autoCapitalize="characters"
                maxLength={10}
                accessibilityLabel="Plate number"
                placeholderTextColor="#8a8f8c"
                className="h-[52px] flex-1 rounded-sm border-2 border-plate-ink bg-plate-bg px-3.5 font-mono-bold text-[18px] tracking-wide text-plate-ink"
              />
            </View>
            <Txt variant="caption">Old plates like 31-8899 have no province. Leave it empty.</Txt>
          </View>

          <Field label="Odometer now (km)" value={odometer} onChangeText={setOdometer} placeholder="54,320" keyboardType="number-pad" mono />

          <View className="gap-3">
            <View>
              <Txt variant="heading">Renewal dates</Txt>
              <Txt variant="caption" className="mt-0.5">
                Add these now or later. You&apos;ll get a reminder 30 days before.
              </Txt>
            </View>
            <Field label="Revenue license expires" value={licenseDate} onChangeText={setLicenseDate} placeholder="YYYY-MM-DD" mono />
            <Field label="Insurance renews" value={insuranceDate} onChangeText={setInsuranceDate} placeholder="YYYY-MM-DD" mono />
          </View>

          {error ? (
            <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
              {error}
            </Txt>
          ) : null}
          <Button title={saving ? "Saving..." : "Save vehicle"} onPress={save} disabled={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
