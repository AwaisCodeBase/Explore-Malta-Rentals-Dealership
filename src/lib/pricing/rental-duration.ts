import { differenceInCalendarDays, differenceInMinutes, parse } from "date-fns";

export const MAX_BILLABLE_RENTAL_DAYS = 28;

export type RentalDurationBreakdown = Readonly<{
  actualDurationMinutes: number;
  actualDurationHours: number;
  billableDays: number;
}>;

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses a YYYY-MM-DD string into a local-midnight Date.
 * Uses local date components to avoid UTC midnight shifts from `new Date("YYYY-MM-DD")`.
 */
function parseDateOnlyLocal(date: string): Date | null {
  const trimmed = date.trim();
  if (!DATE_ONLY_REGEX.test(trimmed)) {
    return null;
  }

  const [yearText, monthText, dayText] = trimmed.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

/**
 * Inclusive calendar-day rental count.
 * Every calendar date from pickup through return counts as one full rental day.
 * Time of day does not affect the result.
 */
export function calculateCalendarRentalDays(
  pickupDate: string,
  returnDate: string,
): number | null {
  const pickupDay = parseDateOnlyLocal(pickupDate);
  const returnDay = parseDateOnlyLocal(returnDate);
  if (!pickupDay || !returnDay) {
    return null;
  }

  const spanDays = differenceInCalendarDays(returnDay, pickupDay);
  if (spanDays < 0) {
    return null;
  }

  return spanDays + 1;
}

function parseDateTime(date: string, time: string): Date | null {
  if (!date || !time) {
    return null;
  }

  const parsed = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function calculateRentalDuration(
  pickupDate: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string,
): RentalDurationBreakdown | null {
  const pickup = parseDateTime(pickupDate, pickupTime);
  const dropoff = parseDateTime(returnDate, returnTime);
  if (!pickup || !dropoff) {
    return null;
  }

  const actualDurationMinutes = differenceInMinutes(dropoff, pickup);
  if (actualDurationMinutes <= 0) {
    return null;
  }

  const billableDays = calculateCalendarRentalDays(pickupDate, returnDate);
  if (billableDays === null) {
    return null;
  }

  return {
    actualDurationMinutes,
    actualDurationHours: Number((actualDurationMinutes / 60).toFixed(2)),
    billableDays,
  };
}

export function getBillableRentalDays(
  pickupDate: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string,
): number {
  return calculateRentalDuration(pickupDate, pickupTime, returnDate, returnTime)?.billableDays ?? 0;
}
