import { formatMaltaDateTime } from "@/lib/format-malta-datetime";
import type { BookingExtensionConflict, BookingExtensionFailureReason } from "@/lib/admin/bookings/extendBooking";

export function bookingExtensionErrorMessage(
  reason: BookingExtensionFailureReason,
  conflict?: BookingExtensionConflict | null,
): string {
  switch (reason) {
    case "unit_conflict": {
      const base = "This vehicle is already assigned to another booking during the requested extension period.";
      if (!conflict) {
        return base;
      }
      return `${base} Conflicting period: ${formatMaltaDateTime(conflict.pickupAt)} – ${formatMaltaDateTime(conflict.returnAt)}.`;
    }
    case "invalid_return":
      return "The new return time must be later than the current booking return time.";
    case "invalid_status":
      return "This booking can no longer be extended because its status has changed.";
    case "concurrent_update":
      return "This booking was modified while you were extending it. Refresh and try again.";
    case "missing_vehicle_unit":
      return "This booking does not have an assigned vehicle unit.";
    case "exceeds_max_days":
      return "The extended rental cannot exceed 28 billable days.";
    case "invalid_pricing":
      return "This booking does not have a valid original daily rate to extend.";
    case "not_found":
      return "Booking not found";
    default:
      return "Unable to extend this booking.";
  }
}
