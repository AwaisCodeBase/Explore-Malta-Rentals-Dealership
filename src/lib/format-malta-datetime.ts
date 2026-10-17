import { defaultTimeZone } from "@/i18n/routing";

const DEFAULT_LOCALE = "en-GB";

function parseIso(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format an ISO timestamp in Europe/Malta (server + client safe). */
export function formatMaltaDateTime(iso: string, locale = DEFAULT_LOCALE): string {
  const date = parseIso(iso);
  if (!date) return "—";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: defaultTimeZone,
  }).format(date);
}

/** Format an ISO date (no time) in Europe/Malta (server + client safe). */
export function formatMaltaDate(iso: string, locale = DEFAULT_LOCALE): string {
  const date = parseIso(iso);
  if (!date) return "—";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: defaultTimeZone,
  }).format(date);
}
