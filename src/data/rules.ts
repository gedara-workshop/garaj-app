import type { Renewal, RenewalKind, ServiceItem, Status } from "./types";

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
