import { Bike, Car, CarFront, Truck, Caravan, type LucideIcon } from "lucide-react-native";
import type { VehicleType } from "@/data/types";
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

export const vehicleTypeLabel: Record<VehicleType, string> = {
  car: "Car",
  suv: "SUV / Jeep",
  van: "Van",
  pickup: "Pickup",
  "three-wheeler": "Three-wheeler",
  motorbike: "Motorbike",
  lorry: "Lorry",
};

export function VehicleTypeIcon({ type, size = 24, color }: { type: VehicleType; size?: number; color?: string }) {
  const { colors } = useTheme();
  const Icon = icons[type];
  return <Icon size={size} color={color ?? colors.brand} strokeWidth={1.8} />;
}
