import type { ReplaceBookingVehicleFailureReason } from "@/lib/admin/bookings/replace-booking-vehicle-types";

export function replaceBookingVehicleStatusCode(reason: ReplaceBookingVehicleFailureReason): number {
  if (reason === "not_found" || reason === "vehicle_not_found") return 404;
  if (reason === "same_unit") return 400;
  return 409;
}

export function replaceBookingVehicleErrorMessage(reason: ReplaceBookingVehicleFailureReason): string {
  switch (reason) {
    case "no_availability":
    case "vehicle_not_found":
      return "The selected replacement vehicle is no longer available.";
    case "invalid_status":
    case "missing_vehicle_unit":
    case "no_remaining_period":
      return "This booking is no longer in an active handed-over state.";
    case "current_unit_changed":
      return "The vehicle assigned to this booking has changed. Refresh and try again.";
    case "concurrent_update":
      return "This booking was updated while you were making changes. Refresh and try again.";
    case "same_unit":
      return "Please select a different vehicle.";
    case "incompatible_license":
      return "The customer is not eligible to use this vehicle.";
    case "incompatible_storage":
      return "This vehicle is not compatible with the booking's selected equipment.";
    case "not_found":
      return "Booking not found";
    default:
      return "Unable to replace the vehicle.";
  }
}
