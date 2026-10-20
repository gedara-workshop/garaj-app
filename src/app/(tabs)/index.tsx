import { router } from "expo-router";
import { useEffect } from "react";
import { Bell, Camera, CloudOff, FileClock, Plus } from "lucide-react-native";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { RenewalTicket } from "@/components/RenewalTicket";
import { ScreenError, ScreenLoading } from "@/components/ScreenState";
import { SectionHeader } from "@/components/SectionHeader";
import { Txt } from "@/components/Txt";
import { VehicleCard } from "@/components/VehicleCard";
import { useGarage } from "@/data/GarageProvider";
import { remindersSupported, useReminders } from "@/data/RemindersProvider";
import { plural } from "@/data/format";
import { renewalStatus, sortRenewals } from "@/data/rules";
import { useTheme } from "@/theme/ThemeProvider";

export default function Home() {
  const { vehicles, renewals, serviceItems, records, isLoading, error, refetch, pendingCount } = useGarage();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { permission, promptDismissed } = useReminders();

  // Ask about reminders once there is a renewal to be reminded of, and only until answered.
  const shouldAsk = remindersSupported && renewals.length > 0 && permission === "undetermined" && !promptDismissed;
  useEffect(() => {
    if (shouldAsk) router.push("/reminders");
  }, [shouldAsk]);

  if (isLoading) return <ScreenLoading label="Loading your garage" />;
  if (error && vehicles.length === 0) return <ScreenError onRetry={refetch} />;
  if (vehicles.length === 0) return <EmptyHome />;

  const byVehicle = (id: string) => ({
    renewals: renewals.filter((r) => r.vehicleId === id),
    serviceItems: serviceItems.filter((s) => s.vehicleId === id),
    records: records.filter((r) => r.vehicleId === id),
  });

  const upcoming = sortRenewals(renewals).slice(0, 3);
  const overdue = renewals.filter((r) => renewalStatus(r) === "due").length;

  // Most urgent vehicle first.
  const ordered = [...vehicles].sort((a, b) => {
    const rank = (id: string) => {
      const first = sortRenewals(renewals.filter((r) => r.vehicleId === id))[0];
      return first ? { due: 0, soon: 1, ok: 2 }[renewalStatus(first)] : 3;
    };
    return rank(a.id) - rank(b.id);
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-100">
      <ScrollView contentContainerClassName="gap-5 pb-28 pt-2">
        <View className="flex-row items-center justify-between px-4">
          <Txt className="font-inter-extrabold text-[26px] tracking-tight text-brand">garaj</Txt>
          <View className="flex-row gap-2">
            <IconButton label="Add vehicle" onPress={() => router.push("/vehicle/new")}>
              <Plus size={20} color={colors.ink} />
            </IconButton>
            <IconButton label="Notifications" onPress={() => router.push("/me")}>
              <Bell size={20} color={colors.ink} />
            </IconButton>
          </View>
        </View>

        <View className="px-4">
          <Txt variant="display">My Garaj</Txt>
          <Txt className="mt-1 text-ink-muted">
            {plural(vehicles.length, "vehicle")}
            {overdue ? `, ${overdue} overdue` : ", nothing overdue"}
          </Txt>
        </View>

        {pendingCount ? (
          <View className="mx-4 flex-row items-center gap-3 rounded-md border border-line bg-surface-200 px-4 py-3">
            <CloudOff size={18} color={colors["ink-muted"]} />
            <Txt className="flex-1 text-[14px]">
              {plural(pendingCount, "entry", "entries")} waiting for a connection. {pendingCount === 1 ? "It uploads" : "They upload"} by
              itself.
            </Txt>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width - 56 + 12}
          decelerationRate="fast"
          contentContainerClassName="gap-3 px-4"
        >
          {ordered.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              {...byVehicle(v.id)}
              width={width - 56}
              onPress={() => router.push({ pathname: "/vehicle/[id]", params: { id: v.id } })}
            />
          ))}
        </ScrollView>

        <View className="gap-3 px-4">
          <SectionHeader title="Coming up" action="See all" onAction={() => router.push("/vehicles")} />
          {upcoming.map((r) => (
            <RenewalTicket key={r.id} renewal={r} vehicle={vehicles.find((v) => v.id === r.vehicleId)} />
          ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-5 right-4">
        <Button
          title="Snap a bill"
          icon={Camera}
          className="rounded-full px-6 shadow-lg"
          onPress={() => router.push("/bill/snap")}
        />
      </View>
    </SafeAreaView>
  );
}

function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-200 active:opacity-70"
    >
      {children}
    </Pressable>
  );
}

function EmptyHome() {
  const { colors } = useTheme();
  const steps = [
    { icon: Plus, text: "Add your vehicle, with a photo if you like" },
    { icon: FileClock, text: "Add the revenue license and insurance dates" },
    { icon: Bell, text: "Get a reminder 30 days before, 7 days before and on the day" },
  ];
  return (
    <SafeAreaView edges={["top"]} className="flex-1 justify-between bg-surface-100 px-4 pb-6 pt-2">
      <View className="gap-6">
        <Txt className="font-inter-extrabold text-[26px] tracking-tight text-brand">garaj</Txt>
        <View className="gap-1">
          <Txt variant="display">Welcome</Txt>
          <Txt className="text-ink-muted">Let&apos;s add your first vehicle. It takes about a minute.</Txt>
        </View>
        <View className="gap-4 rounded-lg border border-line bg-surface-200 p-4">
          {steps.map(({ icon: Icon, text }, i) => (
            <View key={text} className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-sm bg-brand-tint">
                <Icon size={20} color={colors.brand} />
              </View>
              <Txt className="flex-1">
                <Txt variant="number" className="text-ink-muted">
                  {i + 1}.{" "}
                </Txt>
                {text}
              </Txt>
            </View>
          ))}
        </View>
        <Txt variant="caption">Car, jeep, van, pickup, bike, three-wheeler or lorry.</Txt>
      </View>
      <Button title="Add vehicle" icon={Plus} onPress={() => router.push("/vehicle/new")} />
    </SafeAreaView>
  );
}
