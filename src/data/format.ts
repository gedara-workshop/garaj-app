import { currentLang } from "@/i18n";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Full names read better in Sinhala than shortened ones.
const MONTHS_SI = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"];

export const formatNumber = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 142000 -> "142k" for cards; full numbers live on detail screens. */
export const formatShortLkr = (n: number) =>
  n >= 1000 ? `${formatNumber(n / 1000)}k` : formatNumber(n);

/** "October" / "ඔක්තෝබර්" for a 0-based month. */
export const monthName = (month: number) => (currentLang() === "si" ? MONTHS_SI : MONTHS_FULL)[month];

export const formatDate = (iso: string, withYear = true) => {
  const d = new Date(iso);
  if (currentLang() === "si") {
    const base = `${MONTHS_SI[d.getMonth()]} ${d.getDate()}`;
    return withYear ? `${d.getFullYear()} ${base}` : base;
  }
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return withYear ? `${base} ${d.getFullYear()}` : base;
};

/** Today as "2026-10-25" in local time (toISOString would give yesterday before 5:30 am in Sri Lanka). */
export const todayIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** "18,500" or "18500.50" as typed -> 18500.5. NaN when there is no number. */
export const parseAmount = (s: string) => (s.replace(/[^0-9.]/g, "") ? Number(s.replace(/[^0-9.]/g, "")) : NaN);

/** "2026-10-25" and a real calendar day (not 2026-02-30). */
export const isIsoDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

/** "94771234567" or "+94771234567" -> "+94 77 123 4567". Other numbers come back as given. */
export const formatPhone = (phone: string) => {
  const m = phone.replace(/^\+/, "").match(/^94(\d{2})(\d{3})(\d{4})$/);
  return m ? `+94 ${m[1]} ${m[2]} ${m[3]}` : phone;
};

/**
 * A Sri Lankan mobile number as typed ("077 123 4567", "771234567", "+94 77 123 4567")
 * -> "+94771234567". Null if it isn't a mobile number, since codes go out by SMS.
 */
export const toLkMobile = (input: string) => {
  const digits = input.replace(/\D/g, "").replace(/^94/, "").replace(/^0/, "");
  return /^7\d{8}$/.test(digits) ? `+94${digits}` : null;
};
