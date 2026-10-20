import type { FuelType, Renewal, RenewalKind, ServiceItem, Status, VehicleType } from "./types";

// Thresholds from the design system: "soon" within 30 days or 1,000 km / 70% of an interval.
export const SOON_DAYS = 30;
export const SOON_KM = 1000;
export const SOON_SHARE = 0.7;

const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function daysUntil(isoDate: string, today = new Date()) {
  return Math.round((startOfDay(new Date(isoDate)).getTime() - startOfDay(today).getTime()) / DAY);
}

export function renewalStatus(r: Renewal, today = new Date()): Status {
  const days = daysUntil(r.expiresOn, today);
  if (days < 0) return "due";
  if (days <= SOON_DAYS) return "soon";
  return "ok";
}

export function serviceProgress(item: ServiceItem, odometerKm: number) {
  const used = Math.max(0, odometerKm - item.lastDoneKm);
  const remainingKm = item.intervalKm - used;
  const share = Math.min(1, used / item.intervalKm);
  const status: Status =
    remainingKm < 0 ? "due" : remainingKm <= SOON_KM || share >= SOON_SHARE ? "soon" : "ok";
  return { remainingKm, share, status };
}

/** "Mark renewed": a year on from whichever is later, today or the old expiry. */
export function renewedExpiry(r: Renewal, today = new Date()) {
  const base = new Date(Math.max(today.getTime(), new Date(r.expiresOn).getTime()));
  base.setFullYear(base.getFullYear() + 1);
  return base.toISOString().slice(0, 10);
}

/** Most used up first, so the bars that need attention are the ones shown. */
export function sortServiceItems(items: ServiceItem[], odometerKm: number) {
  return [...items].sort((a, b) => serviceProgress(b, odometerKm).share - serviceProgress(a, odometerKm).share);
}

type Suggestion = { name: string; intervalKm: number };

/**
 * Common km-based service items to offer when a vehicle has none, four at most (one card's worth).
 * Typical Sri Lankan garage intervals; the owner can change any of them.
 */
export function suggestedServiceItems(type: VehicleType, fuel?: FuelType): Suggestion[] {
  if (type === "motorbike") {
    return fuel === "electric"
      ? [
          { name: "Chain and sprocket", intervalKm: 15000 },
          { name: "Brake pads", intervalKm: 10000 },
        ]
      : [
          { name: "Engine oil", intervalKm: 2000 },
          { name: "Chain and sprocket", intervalKm: 15000 },
          { name: "Air filter", intervalKm: 10000 },
          { name: "Spark plug", intervalKm: 10000 },
        ];
  }
  if (type === "three-wheeler") {
    return [
      { name: "Engine oil", intervalKm: 3000 },
      { name: "Air filter", intervalKm: 10000 },
      { name: "Spark plug", intervalKm: 10000 },
      { name: "Brake shoes", intervalKm: 15000 },
    ];
  }
  if (type === "lorry") {
    return [
      { name: "Oil and filter", intervalKm: 10000 },
      { name: "Fuel filter", intervalKm: 20000 },
      { name: "Air filter", intervalKm: 20000 },
      { name: "Brake shoes", intervalKm: 30000 },
    ];
  }
  if (fuel === "electric") {
    return [
      { name: "Tyre rotation", intervalKm: 10000 },
      { name: "Cabin air filter", intervalKm: 20000 },
      { name: "Brake pads", intervalKm: 40000 },
    ];
  }
  return [
    { name: "Oil and filter", intervalKm: 5000 },
    fuel === "diesel" ? { name: "Fuel filter", intervalKm: 20000 } : { name: "Spark plugs", intervalKm: 40000 },
    { name: "Air filter", intervalKm: 20000 },
    { name: "Brake pads", intervalKm: 30000 },
  ];
}

export const renewalLabel: Record<RenewalKind, string> = {
  revenue_license: "Revenue license",
  insurance: "Insurance",
  emission_test: "Emission test",
  driving_license: "Driving license",
};

const statusRank: Record<Status, number> = { due: 0, soon: 1, ok: 2 };

/** Overdue first, then soonest. */
export function sortRenewals(list: Renewal[], today = new Date()) {
  return [...list].sort(
    (a, b) =>
      statusRank[renewalStatus(a, today)] - statusRank[renewalStatus(b, today)] ||
      daysUntil(a.expiresOn, today) - daysUntil(b.expiresOn, today)
  );
}
