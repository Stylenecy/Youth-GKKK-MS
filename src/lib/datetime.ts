// All ministry times are Western Indonesian Time. The server renders in UTC
// on Vercel, so every formatter must pin the zone explicitly — otherwise a
// Saturday evening service can render as Sunday in production.
export const TZ = "Asia/Jakarta";

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: TZ, ...opts });

const fullDate = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dayMonth = fmt({ day: "numeric", month: "long" });
const weekdayDayMonth = fmt({ weekday: "long", day: "numeric", month: "long" });
const shortDate = fmt({ day: "numeric", month: "short" });
const timeOnly = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
const dayNumber = fmt({ day: "2-digit" });
const monthShort = fmt({ month: "short" });
const weekdayShort = fmt({ weekday: "short" });

export const formatFullDate = (d: string | Date) => fullDate.format(new Date(d));
export const formatDayMonth = (d: string | Date) => dayMonth.format(new Date(d));
export const formatWeekdayDayMonth = (d: string | Date) =>
  weekdayDayMonth.format(new Date(d));
export const formatShortDate = (d: string | Date) => shortDate.format(new Date(d));
export const formatTime = (d: string | Date) => timeOnly.format(new Date(d)) + " WIB";
export const formatDayNumber = (d: string | Date) => dayNumber.format(new Date(d));
export const formatMonthShort = (d: string | Date) => monthShort.format(new Date(d));
export const formatWeekdayShort = (d: string | Date) => weekdayShort.format(new Date(d));

export const formatDateTime = (d: string | Date) =>
  `${formatShortDate(d)} · ${formatTime(d)}`;

const ymdParts = fmt({ year: "numeric", month: "2-digit", day: "2-digit" });

/** Calendar date in WIB as a UTC-midnight timestamp, for day-level maths. */
function wibCalendarDay(d: Date): number {
  const parts = ymdParts.formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"));
}

/**
 * Whole calendar days from today until `d`, in WIB. Negative when past.
 * Deliberately not `(target - now) / 86400000`: an event at 17:00 today is
 * ~8 hours away, which rounds to 1 and renders as "Besok".
 */
export function daysUntil(d: string | Date): number {
  const diff = wibCalendarDay(new Date(d)) - wibCalendarDay(new Date());
  return Math.round(diff / 86_400_000);
}

/** Human countdown in Indonesian, e.g. "3 hari lagi" / "Hari ini". */
export function countdownLabel(d: string | Date): string {
  const days = daysUntil(d);
  if (days < 0) return "Sudah lewat";
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  if (days === 7) return "Minggu depan";
  return `${days} hari lagi`;
}

/** `YYYY-MM-DD` in WIB, for <input type="date"> defaultValue. */
export function toDateInputValue(d: string | Date): string {
  const parts = ymdParts.formatToParts(new Date(d));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** `HH:MM` in WIB, for <input type="time"> defaultValue. */
export function toTimeInputValue(d: string | Date): string {
  return timeOnly.format(new Date(d));
}

/**
 * Combine a date and time entered in WIB into a real instant.
 *
 * WIB is a fixed UTC+7 with no daylight saving, so the offset can be
 * appended literally. Without this, a bare `YYYY-MM-DD` is parsed as UTC
 * midnight — which is 07:00 WIB, silently moving every 17:00 service to
 * breakfast time.
 */
export function wibToISO(date: string, time?: string | null): string {
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "17:00";
  return new Date(`${date}T${t}:00+07:00`).toISOString();
}

export const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

/** Compact rupiah for stat tiles: Rp1,2jt / Rp250rb / Rp0. */
export function formatRupiahCompact(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const n = Math.abs(amount);
  if (n >= 1_000_000)
    return `${sign}Rp${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",")}jt`;
  if (n >= 1_000) return `${sign}Rp${Math.round(n / 1_000)}rb`;
  return `${sign}Rp${n}`;
}

export const EVENT_TYPE_LABEL: Record<string, string> = {
  worship: "Ibadah",
  cross: "Cross",
  talkshow: "Talkshow",
  movie: "Nonton Bareng",
  sports: "Olahraga",
  retreat: "Retreat",
  special: "Spesial",
};

export const eventTypeLabel = (t: string) => EVENT_TYPE_LABEL[t] ?? t;
