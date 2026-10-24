import type { BookingStatus } from "@/generated/prisma/index";

export const EXTENDABLE_BOOKING_STATUSES = ["CONFIRMED", "VEHICLE_HANDED_OVER"] as const satisfies readonly BookingStatus[];

export type ExtendableBookingStatus = (typeof EXTENDABLE_BOOKING_STATUSES)[number];

export function isExtendableBookingStatus(status: BookingStatus): status is ExtendableBookingStatus {
  return (EXTENDABLE_BOOKING_STATUSES as readonly BookingStatus[]).includes(status);
}
