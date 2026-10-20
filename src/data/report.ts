import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { vehicleTypeLabel } from "@/components/VehicleTypeIcon";
import { vehicleName } from "@/components/VehicleCard";
import { translate } from "@/i18n";
import { formatDate, formatNumber, todayIso } from "./format";
import { costPerKm, fuelEconomy, renewalLabel, serviceDueOn, sortRenewals } from "./rules";
import type { LogRecord, Renewal, ServiceItem, Vehicle } from "./types";

// A plain, printable history of one vehicle: for selling it, for a small business's accounts,
// or just to keep. It's the owner's own record, not certified service history.

const esc = (s: string | number | undefined) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const kindLabel = (k: LogRecord["kind"]) => translate(k === "repair" ? "recordForm.repair" : `costs.kind.${k}`);

export function vehicleReportHtml(vehicle: Vehicle, renewals: Renewal[], items: ServiceItem[], records: LogRecord[]) {
  const t = translate;
  const history = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const total = history.reduce((sum, r) => sum + r.amountLkr, 0);
  const perKm = costPerKm(records);
  const economy = fuelEconomy(records);
  const plate = [vehicle.province, vehicle.plate].filter(Boolean).join(" ");
  const details = [
    vehicleTypeLabel[vehicle.type],
    vehicle.year,
    vehicle.fuel && t(`fuel.${vehicle.fuel}`),
    t("report.odometer", { km: formatNumber(vehicle.odometerKm), date: formatDate(vehicle.odometerUpdatedAt) }),
  ]
    .filter(Boolean)
    .join(" · ");

  // Colors match the app's light theme: ink, muted ink, lines and Garaj teal.
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, Roboto, "Noto Sans Sinhala", sans-serif; color: #141917; font-size: 12px; margin: 0; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 22px 0 6px; color: #0e5c55; }
  .muted { color: #5a625f; }
  .plate { font-family: monospace; font-weight: 700; border: 1.5px solid #111; border-radius: 4px; padding: 1px 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #dcdcd4; vertical-align: top; }
  th { font-size: 11px; color: #5a625f; font-weight: 600; }
  .num { text-align: right; font-family: monospace; white-space: nowrap; }
  .total td { font-weight: 700; border-bottom: none; }
  .foot { margin-top: 24px; font-size: 10px; color: #5a625f; }
</style></head><body>
  <h1>${esc(vehicleName(vehicle))}</h1>
  <div><span class="plate">${esc(plate)}</span> <span class="muted">${esc(details)}</span></div>

  <h2>${esc(t("vehicle.renewals"))}</h2>
  ${
    renewals.length
      ? `<table><tr><th>${esc(t("renewalForm.what"))}</th><th>${esc(t("report.date"))}</th></tr>
      ${sortRenewals(renewals)
        .map(
          (r) =>
            `<tr><td>${esc(renewalLabel[r.kind])}${r.provider ? ` (${esc(r.provider)})` : ""}</td><td>${esc(formatDate(r.expiresOn))}</td></tr>`
        )
        .join("")}</table>`
      : `<p class="muted">${esc(t("card.noRenewals"))}</p>`
  }

  ${
    items.length
      ? `<h2>${esc(t("vehicle.service"))}</h2>
    <table><tr><th>${esc(t("serviceForm.item"))}</th><th>${esc(t("report.interval"))}</th><th>${esc(t("serviceForm.lastDone"))}</th><th>${esc(t("report.nextDue"))}</th></tr>
    ${items
      .map((s) => {
        const interval = s.intervalMonths
          ? t("serviceForm.everyMonths", { km: formatNumber(s.intervalKm), months: s.intervalMonths })
          : t("serviceForm.every", { km: formatNumber(s.intervalKm) });
        const dueOn = serviceDueOn(s);
        const next = [`${formatNumber(s.lastDoneKm + s.intervalKm)} km`, dueOn && formatDate(dueOn)].filter(Boolean).join(" / ");
        return `<tr><td>${esc(s.name)}</td><td>${esc(interval)}</td><td class="num">${esc(formatNumber(s.lastDoneKm))} km${
          s.lastDoneOn ? `<br><span class="muted">${esc(formatDate(s.lastDoneOn))}</span>` : ""
        }</td><td>${esc(next)}</td></tr>`;
      })
      .join("")}</table>`
      : ""
  }

  <h2>${esc(t("vehicle.history"))}</h2>
  ${
    history.length
      ? `<table><tr><th>${esc(t("recordForm.date"))}</th><th>${esc(t("report.entry"))}</th><th>${esc(t("recordForm.place"))}</th><th class="num">km</th><th class="num">${esc(t("costs.lkr"))}</th></tr>
      ${history
        .map(
          (r) =>
            `<tr><td>${esc(formatDate(r.date))}</td><td>${esc(r.title)}<br><span class="muted">${esc(kindLabel(r.kind))}</span></td><td>${esc(r.place)}</td><td class="num">${
              r.odometerKm ? esc(formatNumber(r.odometerKm)) : ""
            }</td><td class="num">${esc(formatNumber(r.amountLkr))}</td></tr>`
        )
        .join("")}
      <tr class="total"><td colspan="4">${esc(t("report.total"))}</td><td class="num">${esc(formatNumber(total))}</td></tr></table>`
      : `<p class="muted">${esc(t("vehicle.noHistory"))}</p>`
  }
  ${perKm !== null ? `<p>${esc(t("report.perKm", { amount: perKm.toFixed(1) }))}${economy ? ` · ${esc(t("costs.economy", { kmpl: economy.overall.toFixed(1) }))}` : ""}</p>` : ""}

  <p class="foot">${esc(t("report.footer", { date: formatDate(todayIso()) }))}</p>
</body></html>`;
}

/** Makes the PDF and opens the share sheet (WhatsApp, email, Files). On web it opens the print dialog. */
export async function shareVehicleReport(vehicle: Vehicle, renewals: Renewal[], items: ServiceItem[], records: LogRecord[]) {
  const html = vehicleReportHtml(vehicle, renewals, items, records);
  if (Platform.OS === "web") return Print.printAsync({ html });
  const { uri } = await Print.printToFileAsync({ html, margins: { left: 36, right: 36, top: 36, bottom: 36 } });
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: vehicleName(vehicle) });
}
