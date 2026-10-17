export {
  cancelBookingSchema,
  completeBookingSchema,
  handOverVehicleSchema,
  markVehicleReturnedSchema,
  restoreCancelledBookingSchema,
} from "@/lib/admin/bookings/lifecycle/booking-lifecycle-schema";
export type {
  CancelBookingInput,
  CompleteBookingInput,
  HandOverVehicleInput,
  MarkVehicleReturnedInput,
  RestoreCancelledBookingInput,
} from "@/lib/admin/bookings/lifecycle/booking-lifecycle-schema";
export { cancelBooking } from "@/lib/admin/bookings/lifecycle/cancelBooking";
export type { CancelBookingResult } from "@/lib/admin/bookings/lifecycle/cancelBooking";
export { completeBooking } from "@/lib/admin/bookings/lifecycle/completeBooking";
export type { CompleteBookingResult } from "@/lib/admin/bookings/lifecycle/completeBooking";
export { handOverVehicle } from "@/lib/admin/bookings/lifecycle/handOverVehicle";
export type { HandOverVehicleResult } from "@/lib/admin/bookings/lifecycle/handOverVehicle";
export { markVehicleReturned } from "@/lib/admin/bookings/lifecycle/markVehicleReturned";
export type { MarkVehicleReturnedResult } from "@/lib/admin/bookings/lifecycle/markVehicleReturned";
export { restoreCancelledBooking } from "@/lib/admin/bookings/lifecycle/restoreCancelledBooking";
export type { RestoreCancelledBookingResult } from "@/lib/admin/bookings/lifecycle/restoreCancelledBooking";
