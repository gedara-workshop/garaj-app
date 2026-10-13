const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatNumber = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 142000 -> "142k" for cards; full numbers live on detail screens. */
export const formatShortLkr = (n: number) =>
  n >= 1000 ? `${formatNumber(n / 1000)}k` : formatNumber(n);

export const formatDate = (iso: string, withYear = true) => {
  const d = new Date(iso);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return withYear ? `${base} ${d.getFullYear()}` : base;
};

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${formatNumber(n)} ${Math.abs(n) === 1 ? one : many}`;
