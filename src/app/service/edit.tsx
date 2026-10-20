import { router, useLocalSearchParams } from "expo-router";
import { ChevronRight, X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Chip, Field } from "@/components/FormField";
import { Plate } from "@/components/Plate";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { useGarage } from "@/data/GarageProvider";
import { formatNumber, isIsoDate, parseAmount, todayIso } from "@/data/format";
import { suggestedServiceItems } from "@/data/rules";
import type { ServiceItem, Vehicle } from "@/data/types";
import { translate, translatePlural, useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

/** Add service items to a vehicle (?vehicleId=) or edit one (?id=). */
export default function EditService() {
  const { id, vehicleId } = useLocalSearchParams<{ id?: string; vehicleId?: string }>();
  const { vehicles, serviceItems } = useGarage();
  const { colors } = useTheme();
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  const existing = id ? serviceItems.find((s) => s.id === id) : undefined;
  const vehicle = vehicles.find((v) => v.id === (existing?.vehicleId ?? vehicleId));
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  // While deleting, the refetch drops the item before the screen closes: don't flash "not found".
  const notFound = !vehicle || (id && !existing && !busy);

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
        <Txt variant="heading">{id ? t("serviceForm.editTitle") : t("serviceForm.title")}</Txt>
        <View className="w-11" />
      </View>

      {notFound ? (
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Txt variant="heading">{t("serviceForm.notFound")}</Txt>
          <Button title={t("common.back")} onPress={close} />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          <ScrollView contentContainerClassName="gap-5 px-4 pb-10" keyboardShouldPersistTaps="handled">
            <View className="flex-row items-center gap-2">
              <Plate province={vehicle!.province} plate={vehicle!.plate} />
              <Txt variant="label" className="text-ink-muted">
                {vehicleName(vehicle!)}
              </Txt>
            </View>
            {id ? (
              <EditOne item={existing} busy={busy} setBusy={setBusy} close={close} />
            ) : (
              <AddItems
                vehicle={vehicle!}
                tracked={serviceItems.filter((s) => s.vehicleId === vehicle!.id)}
                busy={busy}
                setBusy={setBusy}
                close={close}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

/** Whole months, up to five years. */
const validMonths = (n: number) => Number.isInteger(n) && n >= 1 && n <= 60;

type FormProps = { busy: boolean; setBusy: (b: boolean) => void; close: () => void };

function AddItems({ vehicle, tracked, busy, setBusy, close }: FormProps & { vehicle: Vehicle; tracked: ServiceItem[] }) {
  const { saveServiceItems } = useGarage();
  const { colors } = useTheme();
  const trackedNames = new Set(tracked.map((item) => item.name.toLowerCase()));
  const suggestions = suggestedServiceItems(vehicle.type, vehicle.fuel).filter((s) => !trackedNames.has(s.name.toLowerCase()));

  // A vehicle with nothing tracked yet starts with every suggestion picked.
  const [picked, setPicked] = useState<string[]>(tracked.length ? [] : suggestions.map((s) => s.name));
  const [name, setName] = useState("");
  const [every, setEvery] = useState("");
  const [months, setMonths] = useState("");
  const [lastDone, setLastDone] = useState(formatNumber(vehicle.odometerKm));
  const [error, setError] = useState("");

  const toggle = (n: string) => setPicked((list) => (list.includes(n) ? list.filter((x) => x !== n) : [...list, n]));
  const count = picked.length + (name.trim() ? 1 : 0);

  async function save() {
    const lastDoneKm = parseAmount(lastDone);
    const intervalKm = parseAmount(every);
    const intervalMonths = months ? parseAmount(months) : undefined;
    if (intervalMonths !== undefined && !validMonths(intervalMonths)) return setError(translate("serviceForm.monthsFormat"));
    if (name.trim() && !(intervalKm > 0)) return setError(translate("serviceForm.needInterval"));
    if (!(lastDoneKm >= 0)) return setError(translate("common.kmFormat"));
    if (count === 0) return setError(translate("serviceForm.needItem"));

    const items = [
      ...suggestions.filter((s) => picked.includes(s.name)),
      ...(name.trim() ? [{ name: name.trim(), intervalKm: Math.round(intervalKm), intervalMonths }] : []),
      // Counted from today, like the km reading: "last done" is unknown for a new item.
    ].map((s) => ({ ...s, vehicleId: vehicle.id, lastDoneKm: Math.round(lastDoneKm), lastDoneOn: todayIso() }));

    setError("");
    setBusy(true);
    try {
      await saveServiceItems(items);
      close();
    } catch {
      setError(translate("common.couldntSave"));
      setBusy(false);
    }
  }

  return (
    <>
      {tracked.length ? (
        <View className="gap-2">
          <Txt variant="label" className="font-inter-semibold">
            {translate("serviceForm.tracked")}
          </Txt>
          <View className="overflow-hidden rounded-md border border-line bg-surface-200">
            {tracked.map((item, i) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityHint={translate("service.editHint")}
                onPress={() => router.push({ pathname: "/service/edit", params: { id: item.id } })}
                className={`min-h-[52px] flex-row items-center gap-3 px-4 active:opacity-70 ${
                  i < tracked.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <Txt className="flex-1">{item.name}</Txt>
                <Txt variant="number" className="text-ink-muted">
                  {item.intervalMonths
                    ? translate("serviceForm.everyMonths", { km: formatNumber(item.intervalKm), months: item.intervalMonths })
                    : translate("serviceForm.every", { km: formatNumber(item.intervalKm) })}
                </Txt>
                <ChevronRight size={18} color={colors["ink-muted"]} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Txt className="text-ink-muted">
          {translate("serviceForm.intro")}
        </Txt>
      )}

      {suggestions.length ? (
        <View className="gap-2">
          <Txt variant="label" className="font-inter-semibold">
            {translate("serviceForm.suggested")}
          </Txt>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((s) => (
              <Chip
                key={s.name}
                label={
                  s.intervalMonths
                    ? translate("serviceForm.suggestionMonths", { name: s.name, km: formatNumber(s.intervalKm), months: s.intervalMonths })
                    : translate("serviceForm.suggestion", { name: s.name, km: formatNumber(s.intervalKm) })
                }
                selected={picked.includes(s.name)}
                onPress={() => toggle(s.name)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-2">
        <Txt variant="label" className="font-inter-semibold">
          {translate("serviceForm.own")}
        </Txt>
        <View className="flex-row gap-3">
          <Field label={translate("serviceForm.item")} value={name} onChangeText={setName} placeholder={translate("serviceForm.itemExample")} />
          <Field label={translate("serviceForm.everyKm")} value={every} onChangeText={setEvery} placeholder="40,000" keyboardType="number-pad" mono />
        </View>
        <View className="flex-row">
          <Field label={translate("serviceForm.orMonths")} value={months} onChangeText={setMonths} placeholder="12" keyboardType="number-pad" mono />
        </View>
      </View>

      <View className="gap-1.5">
        <View className="flex-row">
          <Field label={translate("serviceForm.lastDone")} value={lastDone} onChangeText={setLastDone} keyboardType="number-pad" mono />
        </View>
        <Txt variant="caption">{translate("serviceForm.lastDoneNote")}</Txt>
      </View>

      {error ? (
        <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
          {error}
        </Txt>
      ) : null}
      <Button
        title={busy ? translate("common.saving") : count ? translatePlural("serviceForm.addCount", count) : translate("serviceForm.addItems")}
        onPress={save}
        disabled={busy}
      />
    </>
  );
}

function EditOne({ item, busy, setBusy, close }: FormProps & { item?: ServiceItem }) {
  const { saveServiceItems, deleteServiceItem } = useGarage();
  const [name, setName] = useState(item?.name ?? "");
  const [every, setEvery] = useState(item ? formatNumber(item.intervalKm) : "");
  const [lastDone, setLastDone] = useState(item ? formatNumber(item.lastDoneKm) : "");
  const [months, setMonths] = useState(item?.intervalMonths ? String(item.intervalMonths) : "");
  const [lastDoneOn, setLastDoneOn] = useState(item?.lastDoneOn ?? todayIso());
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;

  async function save() {
    const intervalKm = parseAmount(every);
    const lastDoneKm = parseAmount(lastDone);
    if (!name.trim()) return setError(translate("serviceForm.needName"));
    if (!(intervalKm > 0)) return setError(translate("serviceForm.needInterval"));
    if (!(lastDoneKm >= 0)) return setError(translate("common.kmFormat"));
    const intervalMonths = months ? parseAmount(months) : undefined;
    if (intervalMonths !== undefined && !validMonths(intervalMonths)) return setError(translate("serviceForm.monthsFormat"));
    if (!isIsoDate(lastDoneOn)) return setError(translate("common.dateFormat"));
    setError("");
    setBusy(true);
    try {
      await saveServiceItems([
        {
          id: item!.id,
          vehicleId: item!.vehicleId,
          name: name.trim(),
          intervalKm: Math.round(intervalKm),
          lastDoneKm: Math.round(lastDoneKm),
          intervalMonths,
          lastDoneOn,
        },
      ]);
      close();
    } catch {
      setError(translate("common.couldntSave"));
      setBusy(false);
    }
  }

  async function remove() {
    // Two taps instead of a dialog: confirm dialogs don't work on the web build.
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    try {
      await deleteServiceItem(item!.id);
      close();
    } catch {
      setError(translate("common.couldntDelete"));
      setBusy(false);
    }
  }

  return (
    <>
      <View className="flex-row">
        <Field label={translate("serviceForm.item")} value={name} onChangeText={setName} />
      </View>
      <View className="flex-row gap-3">
        <Field label={translate("serviceForm.everyKm")} value={every} onChangeText={setEvery} keyboardType="number-pad" mono />
        <Field label={translate("serviceForm.orMonths")} value={months} onChangeText={setMonths} placeholder="6" keyboardType="number-pad" mono />
      </View>
      <View className="flex-row gap-3">
        <Field label={translate("serviceForm.lastDone")} value={lastDone} onChangeText={setLastDone} keyboardType="number-pad" mono />
        <Field label={translate("serviceForm.lastDoneOn")} value={lastDoneOn} onChangeText={setLastDoneOn} placeholder="YYYY-MM-DD" mono />
      </View>
      <Txt variant="caption">{translate("serviceForm.whicheverFirst")}</Txt>
      {error ? (
        <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
          {error}
        </Txt>
      ) : null}
      <Button title={busy ? translate("common.saving") : translate("common.save")} onPress={save} disabled={busy} />
      <Button
        title={confirmDelete ? translate("common.tapAgainToDelete") : translate("serviceForm.stop")}
        kind="ghost"
        onPress={remove}
        disabled={busy}
      />
    </>
  );
}
