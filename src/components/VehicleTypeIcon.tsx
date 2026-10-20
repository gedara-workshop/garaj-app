import { Bike, Car, CarFront, Truck, Caravan, type LucideIcon } from "lucide-react-native";
import type { VehicleType } from "@/data/types";
import { translate } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

const icons: Record<VehicleType, LucideIcon> = {
  car: Car,
  suv: CarFront,
  van: Caravan,
  pickup: Truck,
  lorry: Truck,
  motorbike: Bike,
  "three-wheeler": Car, // Lucide has no tuk icon yet; swap for a custom one later
};

const types: VehicleType[] = ["car", "suv", "van", "pickup", "three-wheeler", "motorbike", "lorry"];

/** In the current language; read it when rendering, not at import time. */
export const vehicleTypeLabel = Object.defineProperties(
  {} as Record<VehicleType, string>,
  Object.fromEntries(types.map((t) => [t, { get: () => translate(`vehicleType.${t}`), enumerable: true }]))
);

export function VehicleTypeIcon({ type, size = 24, color }: { type: VehicleType; size?: number; color?: string }) {
  const { colors } = useTheme();
  const Icon = icons[type];
  return <Icon size={size} color={color ?? colors.brand} strokeWidth={1.8} />;
}
