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

/** "94771234567" or "+94771234567" -> "+94 77 123 4567". Other numbers come back as given. */
export const formatPhone = (phone: string) => {
  const m = phone.replace(/^\+/, "").match(/^94(\d{2})(\d{3})(\d{4})$/);
  return m ? `+94 ${m[1]} ${m[2]} ${m[3]}` : phone;
};
