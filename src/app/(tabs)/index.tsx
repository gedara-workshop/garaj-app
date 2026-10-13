import { router } from "expo-router";
import { Bell, Camera, Plus } from "lucide-react-native";
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { RenewalTicket } from "@/components/RenewalTicket";
import { SectionHeader } from "@/components/SectionHeader";
import { Txt } from "@/components/Txt";
import { VehicleCard } from "@/components/VehicleCard";
import { useGarage } from "@/data/GarageProvider";
import { plural } from "@/data/format";
import { renewalStatus, sortRenewals } from "@/data/rules";
import { useTheme } from "@/theme/ThemeProvider";

export default function Home() {
  const { vehicles, renewals, serviceItems, records } = useGarage();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

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
          onPress={() => Alert.alert("Coming in week 3", "Snap a bill will read the bill with AI and fill in the entry.")}
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
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-100 px-4 pt-6">
      <Txt variant="display">Welcome</Txt>
      <Txt className="mt-1 text-ink-muted">Let&apos;s add your first vehicle. It takes about a minute.</Txt>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/vehicle/new")}
        className="mt-6 items-center gap-3 rounded-lg border-2 border-dashed border-line bg-surface-200 px-5 py-8"
      >
        <Txt variant="heading">Add your first vehicle</Txt>
        <Txt variant="caption">Car, jeep, van, bike, three-wheeler or lorry</Txt>
        <Button title="Add vehicle" icon={Plus} onPress={() => router.push("/vehicle/new")} />
      </Pressable>
    </SafeAreaView>
  );
}
