import type { ImageSource } from "expo-image";

export type VehicleType = "car" | "suv" | "van" | "pickup" | "three-wheeler" | "motorbike" | "lorry";
export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";
export type RenewalKind = "revenue_license" | "insurance" | "emission_test" | "driving_license";
export type RecordKind = "service" | "fuel" | "repair" | "other";
export type Status = "ok" | "soon" | "due";

export type Vehicle = {
  id: string;
  type: VehicleType;
  make: string;
  model: string;
  year?: number;
  fuel?: FuelType;
  color?: string;
  province?: string; // WP, NC, NW... (old plates have none)
  plate: string;
  odometerKm: number;
  odometerUpdatedAt: string; // ISO date
  photo?: ImageSource | number | null; // a signed link, or a bundled require() in sample data
};

export type Renewal = {
  id: string;
  vehicleId: string;
  kind: RenewalKind;
  provider?: string; // e.g. insurance company
  expiresOn: string; // ISO date
};

export type ServiceItem = {
  id: string;
  vehicleId: string;
  name: string;
  intervalKm: number;
  lastDoneKm: number;
};

export type LogRecord = {
  id: string;
  vehicleId: string;
  kind: RecordKind;
  title: string;
  place?: string;
  odometerKm?: number;
  date: string; // ISO date
  amountLkr: number;
};
