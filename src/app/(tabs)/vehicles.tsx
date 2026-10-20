import { Image } from "expo-image";
import { router } from "expo-router";
import { Car, Plus } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Plate } from "@/components/Plate";
import { EmptyState, ScreenError, ScreenLoading } from "@/components/ScreenState";
import { StatusChip } from "@/components/StatusChip";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { VehicleTypeIcon } from "@/components/VehicleTypeIcon";
import { useGarage } from "@/data/GarageProvider";
import { daysUntil, renewalStatus, sortRenewals } from "@/data/rules";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

export default function Vehicles() {
  const { vehicles, renewals, isLoading, error, refetch } = useGarage();
  const { colors } = useTheme();
  const { t, tn } = useT();

  if (isLoading) return <ScreenLoading label={t("vehicles.loading")} />;
  if (error && vehicles.length === 0) return <ScreenError onRetry={refetch} />;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-100">
      <ScrollView contentContainerClassName="gap-4 px-4 pb-10 pt-2">
        <View className="flex-row items-center justify-between">
          <Txt variant="display">{t("tab.vehicles")}</Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("home.addVehicle")}
            onPress={() => router.push("/vehicle/new")}
            className="h-11 w-11 items-center justify-center rounded-full bg-brand active:opacity-80"
          >
            <Plus size={20} color={colors["brand-ink"]} />
          </Pressable>
        </View>
        <Txt className="-mt-2 text-ink-muted">{tn("home.vehicles", vehicles.length)}</Txt>

        {vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title={t("vehicles.emptyTitle")}
            body={t("vehicles.emptyBody")}
            action={<Button title={t("home.addVehicle")} icon={Plus} onPress={() => router.push("/vehicle/new")} />}
          />
        ) : (
          <View className="overflow-hidden rounded-md border border-line bg-surface-200">
            {vehicles.map((v, i) => {
              const next = sortRenewals(renewals.filter((r) => r.vehicleId === v.id))[0];
              const status = next ? renewalStatus(next) : "ok";
              const days = next ? daysUntil(next.expiresOn) : 0;
              const label = !next
                ? t("vehicles.noRenewals")
                : status === "due"
                  ? t("vehicles.overdue")
                  : status === "soon"
                    ? tn("status.days", days)
                    : t("vehicles.good");
              return (
                <Pressable
                  key={v.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/vehicle/[id]", params: { id: v.id } })}
                  className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-300 ${
                    i < vehicles.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  {v.photo ? (
                    <Image source={v.photo} contentFit="cover" style={{ width: 76, height: 56, borderRadius: 8 }} />
                  ) : (
                    <View className="h-14 w-[76px] items-center justify-center rounded-sm bg-brand-tint">
                      <VehicleTypeIcon type={v.type} size={26} />
                    </View>
                  )}
                  <View className="flex-1 gap-1.5">
                    <Txt className="font-inter-semibold">{vehicleName(v)}</Txt>
                    <Plate province={v.province} plate={v.plate} small />
                  </View>
                  <StatusChip status={status} label={label} />
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/vehicle/new")}
          className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-md border-2 border-dashed border-line"
        >
          <Plus size={18} color={colors.brand} />
          <Txt className="font-inter-semibold text-brand">{t("vehicles.addAnother")}</Txt>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
