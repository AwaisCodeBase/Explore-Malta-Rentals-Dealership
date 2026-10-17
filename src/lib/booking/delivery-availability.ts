const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const SUNDAY_PICKUP_DELIVERY_ERROR_MESSAGE =
  "Delivery is unavailable on Sundays. Please select Office Pickup.";

/**
 * Returns the weekday (0 = Sunday … 6 = Saturday) for a YYYY-MM-DD string,
 * or null when the value is not a valid calendar date.
 *
 * Uses local date components to avoid UTC midnight shifts from `new Date("YYYY-MM-DD")`.
 */
export function getWeekdayFromDateOnly(date: string): number | null {
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

  return parsed.getDay();
}

export function isSundayDateOnly(date: string): boolean {
  return getWeekdayFromDateOnly(date) === 0;
}

export function isPickupDeliveryAllowedForDate(pickupDate: string): boolean {
  const weekday = getWeekdayFromDateOnly(pickupDate);
  if (weekday === null) {
    return true;
  }
  return weekday !== 0;
}

export function getSundayPickupDeliveryError(): { path: string; message: string } {
  return {
    path: "delivery.pickupOption",
    message: SUNDAY_PICKUP_DELIVERY_ERROR_MESSAGE,
  };
}

export function getPickupDeliveryResetForSunday<
  T extends { pickupOption: "office" | "delivery"; pickupAddress: string },
>(pickupDate: string, delivery: T): Partial<T> | null {
  if (delivery.pickupOption !== "delivery" || isPickupDeliveryAllowedForDate(pickupDate)) {
    return null;
  }

  return {
    pickupOption: "office",
    pickupAddress: "",
  } as Partial<T>;
}
