import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
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
import type { RecordKind } from "@/data/types";
import { useTheme } from "@/theme/ThemeProvider";

const kinds: { kind: RecordKind; label: string; example: string }[] = [
  { kind: "fuel", label: "Fuel", example: "" },
  { kind: "service", label: "Service", example: "Full service" },
  { kind: "repair", label: "Repair", example: "Two tyres replaced" },
  { kind: "other", label: "Other", example: "Car wash" },
];

/** Add a log entry (?vehicleId=) or edit one (?id=). */
export default function EditRecord() {
  const { id, vehicleId: vehicleParam } = useLocalSearchParams<{ id?: string; vehicleId?: string }>();
  const { vehicles, records, serviceItems, saveRecord, deleteRecord } = useGarage();
  const { colors } = useTheme();

  const existing = id ? records.find((r) => r.id === id) : undefined;
  const vehicle = vehicles.find((v) => v.id === (existing?.vehicleId ?? vehicleParam));
  const items = serviceItems.filter((s) => s.vehicleId === vehicle?.id);

  const [kind, setKind] = useState<RecordKind>(existing?.kind ?? "fuel");
  const [title, setTitle] = useState(existing && existing.kind !== "fuel" ? existing.title : "");
  const [litres, setLitres] = useState(existing?.litres ? String(existing.litres) : "");
  const [amount, setAmount] = useState(existing ? formatNumber(existing.amountLkr) : "");
  const [km, setKm] = useState(existing?.odometerKm ? formatNumber(existing.odometerKm) : "");
  const [place, setPlace] = useState(existing?.place ?? "");
  const [date, setDate] = useState(existing?.date ?? todayIso());
  const [serviced, setServiced] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  // While deleting, the refetch drops the entry before the screen closes: don't flash "not found".
  if (!vehicle || (id && !existing && !busy)) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface-100 p-6">
        <Txt variant="heading">This entry isn&apos;t in your garage</Txt>
        <Button title="Back" onPress={close} />
      </View>
    );
  }

  const isFuel = kind === "fuel";
  const canRestartBars = (kind === "service" || kind === "repair") && items.length > 0;

  async function save() {
    const lkr = parseAmount(amount);
    const L = litres ? parseAmount(litres) : undefined;
    const reading = km ? parseAmount(km) : undefined;
    if (!isFuel && !title.trim()) return setError("Say what was done, like Full service.");
    if (!(lkr >= 0)) return setError("Add the amount in rupees, like 18,500.");
    if (L !== undefined && !(L > 0)) return setError("Write the litres as a number, like 32.");
    if (reading !== undefined && !(reading > 0)) return setError("Write the km reading as a number, like 54,320.");
    if (!isIsoDate(date)) return setError("Write the date as YYYY-MM-DD, like 2026-10-25.");
    if (canRestartBars && serviced.length && !reading) {
      return setError("Add the km reading so the service bars restart from it.");
    }

    setError("");
    setBusy(true);
    try {
      await saveRecord(
        {
          id: existing?.id,
          vehicleId: vehicle!.id,
          kind,
          title: isFuel ? (L ? `Fuel, ${L} L` : "Fuel") : title.trim(),
          place: place.trim() || undefined,
          odometerKm: reading ? Math.round(reading) : undefined,
          date,
          amountLkr: lkr,
          litres: isFuel ? L : undefined,
        },
        canRestartBars ? serviced : []
      );
      close();
    } catch {
      setError("Couldn't save. Check your connection and try again.");
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
      setError("Couldn't delete. Check your connection and try again.");
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
          accessibilityLabel="Close"
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <X size={22} color={colors.ink} />
        </Pressable>
        <Txt variant="heading">{existing ? "Edit entry" : "Add entry"}</Txt>
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

          <View className="flex-row flex-wrap gap-2">
            {kinds.map((k) => (
              <Chip key={k.kind} label={k.label} selected={k.kind === kind} onPress={() => setKind(k.kind)} />
            ))}
          </View>

          {isFuel ? null : (
            <View className="flex-row">
              <Field
                label="What was done"
                value={title}
                onChangeText={setTitle}
                placeholder={kinds.find((k) => k.kind === kind)?.example}
              />
            </View>
          )}

          <View className="flex-row gap-3">
            <Field label="Amount (LKR)" value={amount} onChangeText={setAmount} placeholder="18,500" keyboardType="decimal-pad" mono />
            {isFuel ? (
              <Field label="Litres" value={litres} onChangeText={setLitres} placeholder="32" keyboardType="decimal-pad" mono />
            ) : null}
          </View>

          <View className="gap-1.5">
            <View className="flex-row gap-3">
              <Field
                label="Odometer (km)"
                value={km}
                onChangeText={setKm}
                placeholder={formatNumber(vehicle.odometerKm)}
                keyboardType="number-pad"
                mono
              />
              <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" mono />
            </View>
            <Txt variant="caption">
              Odometer now {formatNumber(vehicle.odometerKm)} km. A higher reading updates it.
            </Txt>
          </View>

          <View className="flex-row">
            <Field label="Place" value={place} onChangeText={setPlace} placeholder="Marawila" />
          </View>

          {canRestartBars ? (
            <View className="gap-2">
              <View>
                <Txt variant="label" className="font-inter-semibold">
                  Done in this {kind}
                </Txt>
                <Txt variant="caption">These service bars restart from this km reading.</Txt>
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

          <Button title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
          {existing ? (
            <Button
              title={confirmDelete ? "Tap again to delete" : "Delete entry"}
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
