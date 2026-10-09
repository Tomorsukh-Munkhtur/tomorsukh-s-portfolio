/*
 * Deterministic Mongolian date formatting. Intl's "mn" locale data differs
 * between Node and browsers (Node often falls back to English), which breaks
 * hydration, so dates are assembled from numeric parts instead.
 */

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Ulaanbaatar",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function ubParts(date: Date) {
  const get = (type: string) => parts.formatToParts(date).find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** "10-р сарын 8, 14:05" in Ulaanbaatar time; the year is added when it isn't the current one. */
export function formatDateTime(iso: string, now = new Date()) {
  const p = ubParts(new Date(iso));
  const year = p.year !== ubParts(now).year ? `${p.year} оны ` : "";
  return `${year}${p.month}-р сарын ${p.day}, ${p.hour}:${p.minute}`;
}

/** "10-р сарын 8, Пү" for a calendar day string (YYYY-MM-DD). */
export function formatDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}-р сарын ${d}, ${weekday}`;
}
