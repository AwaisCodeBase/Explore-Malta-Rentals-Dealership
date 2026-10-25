import type { BookingStatus } from "@/generated/prisma/index";

import type { ChangeBookingVehicleFailureReason } from "@/lib/admin/bookings/change-booking-vehicle-types";

export function changeBookingVehicleStatusCode(reason: ChangeBookingVehicleFailureReason): number {
  if (reason === "not_found" || reason === "vehicle_not_found") return 404;
  if (reason === "invalid_pricing" || reason === "same_vehicle") return 400;
  return 409;
}

export function changeBookingVehicleErrorMessage(
  reason: ChangeBookingVehicleFailureReason,
  status?: BookingStatus,
): string {
  switch (reason) {
    case "no_availability":
      return "No units of this vehicle are available for the full booking period.";
    case "invalid_status":
      if (status === "VEHICLE_HANDED_OVER" || status === "RETURNED") {
        return "This booking can no longer be changed because handover has already been completed.";
      }
      if (status === "COMPLETED") {
        return "This booking is completed and the booked vehicle can no longer be changed.";
      }
      if (status === "CANCELLED") {
        return "This booking is cancelled and the booked vehicle can no longer be changed.";
      }
      return "This booking can no longer be changed.";
    case "vehicle_inactive":
    case "vehicle_not_found":
      return "This vehicle is no longer available for booking.";
    case "concurrent_update":
      return "This booking was updated while you were making changes. Refresh and try again.";
    case "invalid_color":
      return "The selected color is no longer available for this booking period.";
    case "same_vehicle":
      return "Choose a different vehicle model.";
    case "incompatible_license":
      return "The customer's licence does not allow this vehicle.";
    case "incompatible_storage":
      return "This booking includes a storage box, and the selected vehicle does not support one.";
    case "price_mode_unavailable":
      return "This booking includes an extension, so the original agreed price must stay.";
    case "invalid_pricing":
      return "The replacement vehicle does not have a valid daily rate.";
    case "not_found":
      return "Booking not found";
    default:
      return "Unable to change the booked vehicle.";
  }
}
