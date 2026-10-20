import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Chip, Field } from "@/components/FormField";
import { Txt } from "@/components/Txt";
import { vehicleTypeLabel } from "@/components/VehicleTypeIcon";
import { useGarage } from "@/data/GarageProvider";
import { formatNumber, isIsoDate, todayIso } from "@/data/format";
import type { FuelType, VehicleType } from "@/data/types";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

const types: VehicleType[] = ["car", "suv", "van", "pickup", "three-wheeler", "motorbike", "lorry"];
const fuels: FuelType[] = ["petrol", "diesel", "hybrid", "electric"];

/** Add a vehicle, or edit one with ?id= (renewal dates are then managed on the vehicle screen). */
export default function AddVehicle() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { vehicles, addVehicle, updateVehicle } = useGarage();
  const { colors } = useTheme();
  const { t } = useT();
  const existing = id ? vehicles.find((v) => v.id === id) : undefined;

  const [photo, setPhoto] = useState<string | null>(null);
  const [type, setType] = useState<VehicleType>(existing?.type ?? "car");
  const [make, setMake] = useState(existing?.make ?? "");
  const [model, setModel] = useState(existing?.model ?? "");
  const [year, setYear] = useState(existing?.year ? String(existing.year) : "");
  const [fuel, setFuel] = useState<FuelType>(existing?.fuel ?? "petrol");
  const [province, setProvince] = useState(existing?.province ?? "");
  const [plate, setPlate] = useState(existing?.plate ?? "");
  const [odometer, setOdometer] = useState(existing ? formatNumber(existing.odometerKm) : "");
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
    if (!make.trim() || !model.trim()) return setError(t("vehicleForm.needMakeModel"));
    if (!plate.trim()) return setError(t("vehicleForm.needPlate"));
    if (province.trim() && !/^[A-Za-z]{2}$/.test(province.trim())) return setError(t("vehicleForm.provinceFormat"));
    if (year && (Number(year) < 1950 || Number(year) > new Date().getFullYear() + 1)) {
      return setError(t("vehicleForm.yearFormat"));
    }
    for (const d of [licenseDate, insuranceDate]) {
      if (d && !isIsoDate(d)) return setError(t("common.dateFormat"));
    }

    setError("");
    setSaving(true);
    const details = {
      type,
      make: make.trim(),
      model: model.trim(),
      year: year ? Number(year) : undefined,
      fuel,
      province: province.trim().toUpperCase() || undefined,
      plate: plate.trim().toUpperCase(),
      odometerKm: km || 0,
      // Editing keeps the old "updated" date unless the reading itself changed.
      odometerUpdatedAt: existing && existing.odometerKm === (km || 0) ? existing.odometerUpdatedAt : todayIso(),
    };
    try {
      if (existing) {
        await updateVehicle(existing.id, details, photo);
        router.back();
        return;
      }
      const vehicle = await addVehicle(
        details,
        [
          ...(licenseDate ? [{ kind: "revenue_license" as const, expiresOn: licenseDate }] : []),
          ...(insuranceDate ? [{ kind: "insurance" as const, expiresOn: insuranceDate }] : []),
        ],
        photo
      );
      router.replace({ pathname: "/vehicle/[id]", params: { id: vehicle.id } });
    } catch {
      setError(t("common.couldntSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <X size={22} color={colors.ink} />
        </Pressable>
        <Txt variant="heading">{existing ? t("vehicleForm.editTitle") : t("home.addVehicle")}</Txt>
        <View className="w-11" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 px-4 pb-10" keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={photo || existing?.photo ? t("vehicleForm.changePhoto") : t("vehicleForm.addPhoto")}
            onPress={pickPhoto}
            className="h-[188px] items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-line bg-surface-200"
          >
            {photo || existing?.photo ? (
              <>
                <Image source={photo ? { uri: photo } : existing!.photo} contentFit="cover" style={{ position: "absolute", inset: 0 }} />
                <View className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-full bg-surface-200 px-3 py-1.5">
                  <Camera size={16} color={colors.ink} />
                  <Txt variant="label">{t("vehicleForm.changePhoto")}</Txt>
                </View>
              </>
            ) : (
              <>
                <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-tint">
                  <Camera size={26} color={colors.brand} />
                </View>
                <Txt className="font-inter-semibold">{t("vehicleForm.addPhoto")}</Txt>
                <Txt variant="caption">{t("vehicleForm.photoTip")}</Txt>
              </>
            )}
          </Pressable>

          <View className="gap-2">
            <Txt variant="label" className="font-inter-semibold">
              {t("vehicleForm.type")}
            </Txt>
            <View className="flex-row flex-wrap gap-2">
              {types.map((vt) => (
                <Chip key={vt} label={vehicleTypeLabel[vt]} selected={vt === type} onPress={() => setType(vt)} />
              ))}
            </View>
          </View>

          <View className="flex-row gap-3">
            <Field label={t("vehicleForm.make")} value={make} onChangeText={setMake} placeholder="Toyota" />
            <Field label={t("vehicleForm.model")} value={model} onChangeText={setModel} placeholder="Corolla" />
          </View>
          <View className="flex-row gap-3">
            <Field label={t("vehicleForm.year")} value={year} onChangeText={setYear} placeholder="2015" keyboardType="number-pad" maxLength={4} />
            <View className="flex-1 gap-1.5">
              <Txt variant="label" className="font-inter-semibold">
                {t("vehicleForm.fuel")}
              </Txt>
              <View className="flex-row flex-wrap gap-1.5">
                {fuels.map((f) => (
                  <Chip key={f} label={t(`fuel.${f}`)} selected={f === fuel} onPress={() => setFuel(f)} compact />
                ))}
              </View>
            </View>
          </View>

          <View className="gap-1.5">
            <Txt variant="label" className="font-inter-semibold">
              {t("vehicleForm.plate")}
            </Txt>
            <View className="flex-row gap-2">
              <TextInput
                value={province}
                onChangeText={setProvince}
                placeholder="WP"
                autoCapitalize="characters"
                maxLength={2}
                accessibilityLabel={t("vehicleForm.province")}
                placeholderTextColor="#8a8f8c"
                className="h-[52px] w-[76px] rounded-sm border-2 border-plate-ink bg-plate-bg text-center font-mono-bold text-[16px] text-plate-ink"
              />
              <TextInput
                value={plate}
                onChangeText={setPlate}
                placeholder="CAB-4521"
                autoCapitalize="characters"
                maxLength={10}
                accessibilityLabel={t("vehicleForm.plateNumber")}
                placeholderTextColor="#8a8f8c"
                className="h-[52px] flex-1 rounded-sm border-2 border-plate-ink bg-plate-bg px-3.5 font-mono-bold text-[18px] tracking-wide text-plate-ink"
              />
            </View>
            <Txt variant="caption">{t("vehicleForm.oldPlates")}</Txt>
          </View>

          <Field label={t("vehicleForm.odometer")} value={odometer} onChangeText={setOdometer} placeholder="54,320" keyboardType="number-pad" mono />

          {existing ? null : (
            <View className="gap-3">
              <View>
                <Txt variant="heading">{t("vehicleForm.renewalDates")}</Txt>
                <Txt variant="caption" className="mt-0.5">
                  {t("vehicleForm.renewalDatesBody")}
                </Txt>
              </View>
              <Field label={t("vehicleForm.licenseExpires")} value={licenseDate} onChangeText={setLicenseDate} placeholder="YYYY-MM-DD" mono />
              <Field label={t("vehicleForm.insuranceRenews")} value={insuranceDate} onChangeText={setInsuranceDate} placeholder="YYYY-MM-DD" mono />
            </View>
          )}

          {error ? (
            <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
              {error}
            </Txt>
          ) : null}
          <Button
            title={saving ? t("common.saving") : existing ? t("vehicleForm.saveChanges") : t("vehicleForm.save")}
            onPress={save}
            disabled={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
