import { defaultTimeZone } from "@/i18n/routing";
import { MAX_BILLABLE_RENTAL_DAYS, calculateCalendarRentalDays } from "@/lib/pricing/rental-duration";

/** YYYY-MM-DD in the business timezone. */
export function maltaCalendarDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: defaultTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Extra inclusive calendar days between the current return date and a later return.
 * Same calendar day is 0. A proposed return on an earlier calendar day is null.
 */
export function additionalBillableCalendarDays(
  currentReturn: Date,
  proposedReturn: Date,
): number | null {
  const currentKey = maltaCalendarDateKey(currentReturn);
  const proposedKey = maltaCalendarDateKey(proposedReturn);
  const span = calculateCalendarRentalDays(currentKey, proposedKey);
  if (span === null) {
    return null;
  }

  return span - 1;
}

/** HH:mm in Europe/Malta. */
export function maltaTimeKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: defaultTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function addMaltaCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year!, month! - 1, day! + days));
  return shifted.toISOString().slice(0, 10);
}

/** Convert a Malta wall-clock date and time to an absolute instant. */
export function maltaDateTimeToUtc(dateKey: string, time: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: defaultTimeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(utcGuess)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const zonedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
  );
  const result = new Date(utcGuess.getTime() - (zonedAsUtc - utcGuess.getTime()));
  if (maltaCalendarDateKey(result) === dateKey && maltaTimeKey(result) === time) {
    return result;
  }

  const retry = new Date(result.getTime() + 60 * 60 * 1000);
  if (maltaCalendarDateKey(retry) === dateKey && maltaTimeKey(retry) === time) {
    return retry;
  }

  return result;
}

export type ExtensionBlockInstant = {
  pickupAt: Date;
  returnAt: Date;
};

/**
 * Latest return instant that does not overlap another lock.
 * Equal to the next lock's start is allowed (half-open ranges).
 * Returns `currentReturn` when no later instant is free.
 */
export function latestExtensionReturn(
  currentReturn: Date,
  blocks: readonly ExtensionBlockInstant[],
  maxReturn: Date,
): Date {
  let latest = maxReturn;
  for (const block of blocks) {
    if (block.returnAt.getTime() <= currentReturn.getTime()) {
      continue;
    }
    if (block.pickupAt.getTime() <= currentReturn.getTime()) {
      return currentReturn;
    }
    if (block.pickupAt.getTime() < latest.getTime()) {
      latest = block.pickupAt;
    }
  }
  return latest;
}

export function maxExtensionReturn(currentReturn: Date, billableDays: number, time: string): Date | null {
  const remaining = MAX_BILLABLE_RENTAL_DAYS - billableDays;
  if (remaining < 0) {
    return currentReturn;
  }
  const maxDate = addMaltaCalendarDays(maltaCalendarDateKey(currentReturn), remaining);
  return maltaDateTimeToUtc(maxDate, time);
}

export function isSelectableExtensionReturn(
  dateKey: string,
  time: string,
  currentReturn: Date,
  latestReturn: Date,
): boolean {
  const instant = maltaDateTimeToUtc(dateKey, time);
  if (!instant) {
    return false;
  }
  return instant.getTime() > currentReturn.getTime() && instant.getTime() <= latestReturn.getTime();
}
