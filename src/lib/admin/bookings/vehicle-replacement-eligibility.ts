import type { BookingStatus, VehicleUnitStatus } from "@/generated/prisma/index";

/** Physical replacement is only for a rental already out with the customer. */
export const VEHICLE_REPLACEMENT_BOOKING_STATUSES = ["VEHICLE_HANDED_OVER"] as const satisfies readonly BookingStatus[];

export const REPLACEMENT_UNIT_DISPOSITIONS = ["AVAILABLE", "MAINTENANCE", "NOT_AVAILABLE"] as const satisfies readonly VehicleUnitStatus[];

export const REPLACEMENT_REASONS = ["mechanical_issue", "damage", "customer_requested", "other"] as const;

export type VehicleReplacementBookingStatus = (typeof VEHICLE_REPLACEMENT_BOOKING_STATUSES)[number];
export type ReplacementUnitDisposition = (typeof REPLACEMENT_UNIT_DISPOSITIONS)[number];
export type ReplacementReason = (typeof REPLACEMENT_REASONS)[number];

export function isVehicleReplacementBookingStatus(
  status: BookingStatus,
): status is VehicleReplacementBookingStatus {
  return (VEHICLE_REPLACEMENT_BOOKING_STATUSES as readonly BookingStatus[]).includes(status);
}

export function isReplacementUnitDisposition(status: string): status is ReplacementUnitDisposition {
  return (REPLACEMENT_UNIT_DISPOSITIONS as readonly string[]).includes(status);
}
