import { router, useLocalSearchParams } from "expo-router";
import { Receipt, X } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { CheckThis, Chip, Field } from "@/components/FormField";
import { Plate } from "@/components/Plate";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import type { BillDraft, DraftField } from "@/data/bill";
import { useGarage } from "@/data/GarageProvider";
import { formatNumber, isIsoDate, parseAmount, todayIso } from "@/data/format";
import type { RecordKind } from "@/data/types";
import { useT } from "@/i18n";
import type { StringKey } from "@/i18n/en";
import { useTheme } from "@/theme/ThemeProvider";

const kinds: { kind: RecordKind; label: StringKey; example?: StringKey }[] = [
  { kind: "fuel", label: "costs.kind.fuel" },
  { kind: "service", label: "costs.kind.service", example: "recordForm.exampleService" },
  { kind: "repair", label: "recordForm.repair", example: "recordForm.exampleRepair" },
  { kind: "other", label: "costs.kind.other", example: "recordForm.exampleOther" },
];

/** Add a log entry (?vehicleId=), edit one (?id=), or check one read from a bill (?vehicleId=&draft=). */
export default function EditRecord() {
  const params = useLocalSearchParams<{ id?: string; vehicleId?: string; draft?: string }>();
  const { id, vehicleId: vehicleParam } = params;
  const [draft] = useState<BillDraft | undefined>(() => (params.draft ? JSON.parse(params.draft) : undefined));
  const [flagged, setFlagged] = useState<DraftField[]>(draft?.flagged ?? []);
  const { vehicles, records, serviceItems, saveRecord, deleteRecord } = useGarage();
  const { colors } = useTheme();
  const { t } = useT();

  const existing = id ? records.find((r) => r.id === id) : undefined;
  const vehicle = vehicles.find((v) => v.id === (existing?.vehicleId ?? vehicleParam));
  const items = serviceItems.filter((s) => s.vehicleId === vehicle?.id);

  const start = existing ?? draft;
  const [kind, setKind] = useState<RecordKind>(start?.kind ?? "fuel");
  const [title, setTitle] = useState(start?.title && start.kind !== "fuel" ? start.title : "");
  const [litres, setLitres] = useState(start?.litres ? String(start.litres) : "");
  const [amount, setAmount] = useState(start?.amountLkr !== undefined ? formatNumber(start.amountLkr) : "");
  const [km, setKm] = useState(start?.odometerKm ? formatNumber(start.odometerKm) : "");
  const [place, setPlace] = useState(start?.place ?? "");
  const [date, setDate] = useState(start?.date ?? todayIso());
  const [serviced, setServiced] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  // While deleting, the refetch drops the entry before the screen closes: don't flash "not found".
  if (!vehicle || (id && !existing && !busy)) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface-100 p-6">
        <Txt variant="heading">{t("recordForm.notFound")}</Txt>
        <Button title={t("common.back")} onPress={close} />
      </View>
    );
  }

  const isFuel = kind === "fuel";
  const isFlagged = (f: DraftField) => flagged.includes(f);
  // Touching a flagged field counts as checking it.
  const checked = (f: DraftField) => setFlagged((list) => list.filter((x) => x !== f));
  const canRestartBars = (kind === "service" || kind === "repair") && items.length > 0;
  const billPath = existing?.billPath ?? draft?.billPath;

  async function save() {
    const lkr = parseAmount(amount);
    const L = litres ? parseAmount(litres) : undefined;
    const reading = km ? parseAmount(km) : undefined;
    if (!isFuel && !title.trim()) return setError(t("recordForm.needTitle"));
    if (!(lkr >= 0)) return setError(t("recordForm.needAmount"));
    if (L !== undefined && !(L > 0)) return setError(t("recordForm.litresFormat"));
    if (reading !== undefined && !(reading > 0)) return setError(t("common.kmFormat"));
    if (!isIsoDate(date)) return setError(t("common.dateFormat"));
    if (canRestartBars && serviced.length && !reading) {
      return setError(t("recordForm.needKmForBars"));
    }

    setError("");
    setBusy(true);
    try {
      await saveRecord(
        {
          id: existing?.id,
          vehicleId: vehicle!.id,
          kind,
          title: isFuel ? (L ? t("recordForm.fuelTitle", { litres: L }) : t("costs.kind.fuel")) : title.trim(),
          place: place.trim() || undefined,
          odometerKm: reading ? Math.round(reading) : undefined,
          date,
          amountLkr: lkr,
          litres: isFuel ? L : undefined,
        },
        {
          servicedItemIds: canRestartBars ? serviced : [],
          billPath: draft?.billPath,
          extracted: draft?.extracted,
        }
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
      await deleteRecord(existing!.id);
      close();
    } catch {
      setError(t("common.couldntDelete"));
      setBusy(false);
    }
  }

  const toggle = (itemId: string) =>
    setServiced((list) => (list.includes(itemId) ? list.filter((x) => x !== itemId) : [...list, itemId]));

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
        <Txt variant="heading">{existing ? t("recordForm.editTitle") : draft ? t("recordForm.checkTitle") : t("recordForm.addTitle")}</Txt>
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

          {billPath ? (
            <Button
              title={t("billView.open")}
              kind="secondary"
              icon={Receipt}
              onPress={() => router.push({ pathname: "/bill/view", params: { path: billPath } })}
            />
          ) : null}

          {draft ? (
            <Txt className="text-ink-muted">
              {flagged.length ? t("recordForm.readFlagged") : t("recordForm.readClean")}
            </Txt>
          ) : null}

          <View className="gap-1.5">
            <View className="flex-row flex-wrap gap-2">
              {kinds.map((k) => (
                <Chip
                  key={k.kind}
                  label={t(k.label)}
                  selected={k.kind === kind}
                  onPress={() => {
                    setKind(k.kind);
                    checked("kind");
                  }}
                />
              ))}
            </View>
            {isFlagged("kind") ? <CheckThis /> : null}
          </View>

          {isFuel ? null : (
            <View className="flex-row">
              <Field
                label={t("recordForm.whatDone")}
                value={title}
                onChangeText={(text) => {
                setTitle(text);
                checked("title");
              }}
                flagged={isFlagged("title")}
                placeholder={(() => {
                  const example = kinds.find((k) => k.kind === kind)?.example;
                  return example && t(example);
                })()}
              />
            </View>
          )}

          <View className="flex-row gap-3">
            <Field
              label={t("common.amountLkr")}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                checked("amount");
              }}
              flagged={isFlagged("amount")}
              placeholder="18,500"
              keyboardType="decimal-pad"
              mono
            />
            {isFuel ? (
              <Field
                label={t("recordForm.litres")}
                value={litres}
                onChangeText={(text) => {
                setLitres(text);
                checked("litres");
              }}
                flagged={isFlagged("litres")}
                placeholder="32"
                keyboardType="decimal-pad"
                mono
              />
            ) : null}
          </View>

          <View className="gap-1.5">
            <View className="flex-row gap-3">
              <Field
                label={t("recordForm.odometer")}
                value={km}
                onChangeText={(text) => {
                setKm(text);
                checked("km");
              }}
                flagged={isFlagged("km")}
                placeholder={formatNumber(vehicle.odometerKm)}
                keyboardType="number-pad"
                mono
              />
              <Field
                label={t("recordForm.date")}
                value={date}
                onChangeText={(text) => {
                setDate(text);
                checked("date");
              }}
                flagged={isFlagged("date")}
                placeholder="YYYY-MM-DD"
                mono
              />
            </View>
            <Txt variant="caption">
              {t("recordForm.odometerNote", { km: formatNumber(vehicle.odometerKm) })}
            </Txt>
          </View>

          <View className="flex-row">
            <Field
              label={t("recordForm.place")}
              value={place}
              onChangeText={(text) => {
                setPlace(text);
                checked("place");
              }}
              flagged={isFlagged("place")}
              placeholder={t("recordForm.placeExample")}
            />
          </View>

          {canRestartBars ? (
            <View className="gap-2">
              <View>
                <Txt variant="label" className="font-inter-semibold">
                  {t(kind === "service" ? "recordForm.doneInService" : "recordForm.doneInRepair")}
                </Txt>
                <Txt variant="caption">{t("recordForm.barsRestart")}</Txt>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {items.map((item) => (
                  <Chip key={item.id} label={item.name} selected={serviced.includes(item.id)} onPress={() => toggle(item.id)} />
                ))}
              </View>
            </View>
          ) : null}

          {error ? (
            <Txt accessibilityRole="alert" className="font-inter-medium text-[13px] text-due">
              {error}
            </Txt>
          ) : null}

          <Button title={busy ? t("common.saving") : t("common.save")} onPress={save} disabled={busy} />
          {existing ? (
            <Button
              title={confirmDelete ? t("common.tapAgainToDelete") : t("recordForm.delete")}
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
