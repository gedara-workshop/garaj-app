import { translate } from "@/i18n";
import type { FuelType, LogRecord, Renewal, Vehicle, RenewalKind, ServiceItem, Status, VehicleType } from "./types";

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

/** The date a time-based item falls due: N months after it was last done. */
export function serviceDueOn(item: ServiceItem) {
  if (!item.intervalMonths || !item.lastDoneOn) return undefined;
  const [y, m, d] = item.lastDoneOn.split("-").map(Number);
  // Clamp to the month's last day, so 31 Aug + 6 months is 28 Feb, not 3 Mar.
  const lastDay = new Date(y, m - 1 + item.intervalMonths + 1, 0).getDate();
  const due = new Date(y, m - 1 + item.intervalMonths, Math.min(d, lastDay));
  return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
}

/**
 * How far an item is toward its next service, by km and, when it has one, by time: "5,000 km or
 * 6 months, whichever comes first". byTime says which of the two is closer, so the bar can say so.
 */
export function serviceProgress(item: ServiceItem, odometerKm: number, today = new Date()) {
  const used = Math.max(0, odometerKm - item.lastDoneKm);
  const remainingKm = item.intervalKm - used;
  const kmShare = Math.min(1, used / item.intervalKm);

  const dueOn = serviceDueOn(item);
  const daysLeft = dueOn ? daysUntil(dueOn, today) : undefined;
  const totalDays = dueOn ? Math.max(1, daysUntil(dueOn, new Date(item.lastDoneOn!))) : 1;
  const timeShare = daysLeft === undefined ? 0 : Math.min(1, Math.max(0, (totalDays - daysLeft) / totalDays));

  const share = Math.max(kmShare, timeShare);
  const overdue = remainingKm < 0 || (daysLeft !== undefined && daysLeft < 0);
  const close = remainingKm <= SOON_KM || (daysLeft !== undefined && daysLeft <= SOON_DAYS) || share >= SOON_SHARE;
  const status: Status = overdue ? "due" : close ? "soon" : "ok";
  return { remainingKm, daysLeft, byTime: timeShare > kmShare, share, status };
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

/** Km a vehicle must cover between readings before cost per km means anything. */
export const MIN_KM_FOR_COST = 300;

/**
 * Running cost per km for one vehicle: everything spent between its lowest and highest logged
 * km readings, divided by the km between them. The entry at the highest reading is left out,
 * since fuel bought there hasn't been driven yet. Null until there is enough to go on.
 */
export function costPerKm(records: LogRecord[]) {
  const readings = records.filter((r) => r.odometerKm).sort((a, b) => a.odometerKm! - b.odometerKm!);
  if (readings.length < 2) return null;
  const first = readings[0];
  const last = readings[readings.length - 1];
  const km = last.odometerKm! - first.odometerKm!;
  if (km < MIN_KM_FOR_COST) return null;
  const spent = records
    .filter((r) => r.id !== last.id && r.date >= first.date && r.date <= last.date)
    .reduce((sum, r) => sum + r.amountLkr, 0);
  return spent / km;
}

/** A drop of this much against the long-run figure is worth a gentle note. */
export const ECONOMY_DROP = 0.15;

function kmPerLitre(fills: LogRecord[]) {
  if (fills.length < 2) return null;
  const km = fills[fills.length - 1].odometerKm! - fills[0].odometerKm!;
  // The last fill hasn't been driven yet, so its litres don't count.
  const litres = fills.slice(0, -1).reduce((sum, r) => sum + r.litres!, 0);
  return km >= MIN_KM_FOR_COST && litres > 0 ? km / litres : null;
}

/**
 * Fuel economy in km per litre from fuel entries that have both a km reading and litres.
 * recent covers the latest three fills; dropped is true when it is clearly worse than usual,
 * which often means tyre pressure or a service is due.
 */
export function fuelEconomy(records: LogRecord[]) {
  const fills = records
    .filter((r) => r.kind === "fuel" && r.odometerKm && r.litres)
    .sort((a, b) => a.odometerKm! - b.odometerKm!);
  const overall = kmPerLitre(fills);
  if (overall === null) return null;
  const recent = fills.length >= 6 ? kmPerLitre(fills.slice(-4)) : null;
  return { overall, recent, dropped: recent !== null && recent < overall * (1 - ECONOMY_DROP) };
}

type Suggestion = { name: string; intervalKm: number; intervalMonths?: number };

/**
 * Common km-based service items to offer when a vehicle has none, four at most (one card's worth).
 * Typical Sri Lankan garage intervals; the owner can change any of them. Names are in the current
 * language because they are saved as the item's name.
 */
export function suggestedServiceItems(type: VehicleType, fuel?: FuelType): Suggestion[] {
  if (type === "motorbike") {
    return fuel === "electric"
      ? [
          { name: translate("serviceItem.chainSprocket"), intervalKm: 15000 },
          { name: translate("serviceItem.brakePads"), intervalKm: 10000 },
        ]
      : [
          { name: translate("serviceItem.engineOil"), intervalKm: 2000, intervalMonths: 3 },
          { name: translate("serviceItem.chainSprocket"), intervalKm: 15000 },
          { name: translate("serviceItem.airFilter"), intervalKm: 10000 },
          { name: translate("serviceItem.sparkPlug"), intervalKm: 10000 },
        ];
  }
  if (type === "three-wheeler") {
    return [
      { name: translate("serviceItem.engineOil"), intervalKm: 3000, intervalMonths: 3 },
      { name: translate("serviceItem.airFilter"), intervalKm: 10000 },
      { name: translate("serviceItem.sparkPlug"), intervalKm: 10000 },
      { name: translate("serviceItem.brakeShoes"), intervalKm: 15000 },
    ];
  }
  if (type === "lorry") {
    return [
      { name: translate("serviceItem.oilFilter"), intervalKm: 10000, intervalMonths: 6 },
      { name: translate("serviceItem.fuelFilter"), intervalKm: 20000 },
      { name: translate("serviceItem.airFilter"), intervalKm: 20000 },
      { name: translate("serviceItem.brakeShoes"), intervalKm: 30000 },
    ];
  }
  if (fuel === "electric") {
    return [
      { name: translate("serviceItem.tyreRotation"), intervalKm: 10000 },
      { name: translate("serviceItem.cabinFilter"), intervalKm: 20000 },
      { name: translate("serviceItem.brakePads"), intervalKm: 40000 },
    ];
  }
  return [
    { name: translate("serviceItem.oilFilter"), intervalKm: 5000, intervalMonths: 6 },
    fuel === "diesel" ? { name: translate("serviceItem.fuelFilter"), intervalKm: 20000 } : { name: translate("serviceItem.sparkPlugs"), intervalKm: 40000 },
    { name: translate("serviceItem.airFilter"), intervalKm: 20000, intervalMonths: 12 },
    { name: translate("serviceItem.brakePads"), intervalKm: 30000 },
  ];
}

export type ReminderSettings = { leadDays: number; weekBefore: boolean; onTheDay: boolean };
export const defaultReminderSettings: ReminderSettings = { leadDays: SOON_DAYS, weekBefore: true, onTheDay: true };

/** iOS keeps at most 64 pending local notifications; stay under it and keep the soonest. */
export const MAX_REMINDERS = 60;
/** Reminders arrive at 9 am local time. */
export const REMINDER_HOUR = 9;

export type PlannedReminder = { renewal: Renewal; vehicle: Vehicle; daysBefore: number; at: Date };

/** Every reminder still to come for the garage's renewals, soonest first. Sold vehicles are already filtered out. */
export function planReminders(
  vehicles: Vehicle[],
  renewals: Renewal[],
  settings: ReminderSettings,
  now = new Date()
): PlannedReminder[] {
  const offsets = [
    ...new Set([settings.leadDays, ...(settings.weekBefore ? [7] : []), ...(settings.onTheDay ? [0] : [])]),
  ];
  const plan: PlannedReminder[] = [];
  for (const renewal of renewals) {
    const vehicle = vehicles.find((v) => v.id === renewal.vehicleId);
    if (!vehicle) continue;
    const [y, m, d] = renewal.expiresOn.split("-").map(Number);
    for (const daysBefore of offsets) {
      const at = new Date(y, m - 1, d - daysBefore, REMINDER_HOUR);
      if (at > now) plan.push({ renewal, vehicle, daysBefore, at });
    }
  }
  return plan.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_REMINDERS);
}

/** In the current language; read it when rendering, not at import time. */
export const renewalLabel: Record<RenewalKind, string> = {
  get revenue_license() {
    return translate("renewal.revenue_license");
  },
  get insurance() {
    return translate("renewal.insurance");
  },
  get emission_test() {
    return translate("renewal.emission_test");
  },
  get driving_license() {
    return translate("renewal.driving_license");
  },
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
