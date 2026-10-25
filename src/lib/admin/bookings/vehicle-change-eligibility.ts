import type { BookingStatus, VehicleCatalogStatus } from "@/generated/prisma/index";

/**
 * Model changes are allowed only before the customer has the vehicle.
 * Swapping the physical unit after handover is a separate workflow.
 */
export const VEHICLE_CHANGE_BOOKING_STATUSES = ["PENDING_PAYMENT", "CONFIRMED"] as const satisfies readonly BookingStatus[];

export type VehicleChangeBookingStatus = (typeof VEHICLE_CHANGE_BOOKING_STATUSES)[number];

const BOOKABLE_CATALOG_STATUSES = ["AVAILABLE", "BOOKED"] as const satisfies readonly VehicleCatalogStatus[];

export function isVehicleChangeBookingStatus(
  status: BookingStatus,
): status is VehicleChangeBookingStatus {
  return (VEHICLE_CHANGE_BOOKING_STATUSES as readonly BookingStatus[]).includes(status);
}

export function isBookableReplacementVehicle(vehicle: {
  isActive: boolean;
  catalogStatus: VehicleCatalogStatus;
}): boolean {
  return (
    vehicle.isActive &&
    (BOOKABLE_CATALOG_STATUSES as readonly VehicleCatalogStatus[]).includes(vehicle.catalogStatus)
  );
}
