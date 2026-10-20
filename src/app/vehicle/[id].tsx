import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Ellipsis } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { PhotoScrim } from "@/components/PhotoScrim";
import { Plate } from "@/components/Plate";
import { RenewalTicket } from "@/components/RenewalTicket";
import { ScreenLoading } from "@/components/ScreenState";
import { SectionHeader } from "@/components/SectionHeader";
import { ServiceProgress } from "@/components/ServiceProgress";
import { TimelineRow } from "@/components/TimelineRow";
import { Txt } from "@/components/Txt";
import { vehicleName } from "@/components/VehicleCard";
import { VehicleTypeIcon, vehicleTypeLabel } from "@/components/VehicleTypeIcon";
import { useGarage } from "@/data/GarageProvider";
import { formatDate, formatNumber, formatShortLkr } from "@/data/format";
import { sortRenewals } from "@/data/rules";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vehicles, renewals, serviceItems, records, markRenewed, isLoading } = useGarage();
  const { colors } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();

  if (isLoading) return <ScreenLoading label={t("vehicle.loading")} />;

  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface-100 p-6">
        <Txt variant="heading">{t("vehicle.notFound")}</Txt>
        <Button title={t("vehicle.backHome")} onPress={() => router.replace("/")} />
      </View>
    );
  }

  const myRenewals = sortRenewals(renewals.filter((r) => r.vehicleId === vehicle.id));
  const myService = serviceItems.filter((s) => s.vehicleId === vehicle.id);
  const myRecords = records
    .filter((r) => r.vehicleId === vehicle.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const year = new Date().getFullYear();
  const spent = myRecords.filter((r) => new Date(r.date).getFullYear() === year).reduce((s, r) => s + r.amountLkr, 0);
  const details = [vehicle.year, vehicle.fuel && t(`fuel.${vehicle.fuel}`), vehicle.color]
    .filter(Boolean)
    .join(" · ");

  return (
    <ScrollView className="flex-1 bg-surface-100" contentContainerClassName="pb-12">
      <View style={{ height: 260 + insets.top }} className={vehicle.photo ? "bg-surface-300" : "bg-brand-tint"}>
        {vehicle.photo ? (
          <>
            <Image source={vehicle.photo} contentFit="cover" style={{ position: "absolute", inset: 0 }} />
            <PhotoScrim height={140} />
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <VehicleTypeIcon type={vehicle.type} size={72} />
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={{ top: insets.top + 8 }}
          className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-surface-200"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("vehicle.options")}
          onPress={() => router.push({ pathname: "/vehicle/options", params: { id: vehicle.id } })}
          style={{ top: insets.top + 8 }}
          className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-surface-200"
        >
          <Ellipsis size={22} color={colors.ink} />
        </Pressable>
        <View className="absolute bottom-0 left-0 right-0 gap-1.5 px-4 pb-4">
          <Txt className={`font-inter-semibold text-[26px] leading-[32px] ${vehicle.photo ? "text-white" : ""}`}>
            {vehicleName(vehicle)}
          </Txt>
          <View className="flex-row items-center gap-2">
            <Plate province={vehicle.province} plate={vehicle.plate} />
            <Txt variant="label" className={vehicle.photo ? "text-white" : "text-ink-muted"}>
              {details || vehicleTypeLabel[vehicle.type]}
            </Txt>
          </View>
        </View>
      </View>

      <View className="mx-4 mt-4 overflow-hidden rounded-md border border-line bg-surface-200">
        <View className="flex-row">
          <Stat value={formatNumber(vehicle.odometerKm)} label={t("card.kmOnClock")} />
          <Stat value={formatShortLkr(spent)} label={t("card.lkrThisYear")} divider />
          <Stat value={String(myRecords.length)} label={t("vehicle.entries")} divider />
        </View>
        <View className="flex-row items-center justify-between border-t border-line px-4 py-1">
          <Txt variant="caption">{t("vehicle.odometerUpdated", { date: formatDate(vehicle.odometerUpdatedAt, false) })}</Txt>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/vehicle/odometer", params: { id: vehicle.id } })}
            className="min-h-[44px] justify-center"
          >
            <Txt variant="label" className="font-inter-semibold text-brand">
              {t("vehicle.update")}
            </Txt>
          </Pressable>
        </View>
      </View>

      <View className="mt-6 gap-3 px-4">
        <SectionHeader
          title={t("vehicle.renewals")}
          action={t("common.add")}
          onAction={() => router.push({ pathname: "/renewal/edit", params: { vehicleId: vehicle.id } })}
        />
        {myRenewals.length ? (
          myRenewals.map((r) => (
            <RenewalTicket
              key={r.id}
              renewal={r}
              onRenewed={() => markRenewed(r.id)}
              onEdit={() => router.push({ pathname: "/renewal/edit", params: { id: r.id } })}
              onViewDocument={() => router.push({ pathname: "/renewal/document", params: { id: r.id } })}
            />
          ))
        ) : (
          <Txt className="text-ink-muted">{t("vehicle.noRenewals")}</Txt>
        )}
      </View>

      <View className="mt-6 gap-3 px-4">
        <SectionHeader
          title={t("vehicle.service")}
          action={myService.length ? (myService.length > 4 ? t("vehicle.allItems", { n: myService.length }) : t("common.add")) : undefined}
          onAction={() => router.push({ pathname: "/service/edit", params: { vehicleId: vehicle.id } })}
        />
        {myService.length ? (
          <ServiceProgress
            items={myService}
            odometerKm={vehicle.odometerKm}
            onPressItem={(item) => router.push({ pathname: "/service/edit", params: { id: item.id } })}
          />
        ) : (
          <View className="items-start gap-3 rounded-md border border-line bg-surface-200 p-4">
            <Txt className="text-ink-muted">{t("vehicle.serviceIntro")}</Txt>
            <Button
              title={t("vehicle.serviceSetup")}
              kind="secondary"
              onPress={() => router.push({ pathname: "/service/edit", params: { vehicleId: vehicle.id } })}
            />
          </View>
        )}
      </View>

      <View className="mt-6 gap-3 px-4">
        <SectionHeader
          title={t("vehicle.history")}
          action={t("common.add")}
          onAction={() => router.push({ pathname: "/record/edit", params: { vehicleId: vehicle.id } })}
        />
        {myRecords.length ? (
          <View className="rounded-md border border-line bg-surface-200 px-4 py-1">
            {myRecords.map((r, i) => (
              <TimelineRow
                key={r.id}
                record={r}
                last={i === myRecords.length - 1}
                // Waiting entries aren't in the database yet, so there is nothing to edit.
                onPress={r.pending ? undefined : () => router.push({ pathname: "/record/edit", params: { id: r.id } })}
              />
            ))}
          </View>
        ) : (
          <Txt className="text-ink-muted">{t("vehicle.noHistory")}</Txt>
        )}
        {myRecords.length ? <Txt variant="caption">{t("vehicle.amountsInLkr")}</Txt> : null}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label, divider = false }: { value: string; label: string; divider?: boolean }) {
  return (
    <View className={`flex-1 px-4 py-3 ${divider ? "border-l border-line" : ""}`}>
      <Txt variant="stat">{value}</Txt>
      <Txt variant="caption">{label}</Txt>
    </View>
  );
}
