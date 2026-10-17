import {
  INITIAL_BOOKING_FLOW_STATE,
  type BookingFlowState,
} from "@/features/booking-flow/lib/types";
import { formatVehicleColorLabel, parseVehicleColorValue } from "@/features/vehicles/lib/vehicle-color";

type InitialRentalState = {
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  selectedColor?: string;
};

function cloneInitialState(): BookingFlowState {
  return {
    ...INITIAL_BOOKING_FLOW_STATE,
    rental: { ...INITIAL_BOOKING_FLOW_STATE.rental },
    delivery: { ...INITIAL_BOOKING_FLOW_STATE.delivery },
    addons: { ...INITIAL_BOOKING_FLOW_STATE.addons },
    customer: { ...INITIAL_BOOKING_FLOW_STATE.customer },
    additionalDriver: { ...INITIAL_BOOKING_FLOW_STATE.additionalDriver },
    deposit: { ...INITIAL_BOOKING_FLOW_STATE.deposit },
    consent: { ...INITIAL_BOOKING_FLOW_STATE.consent },
    hotelCode: { ...INITIAL_BOOKING_FLOW_STATE.hotelCode },
  };
}

function normalizeInitialColor(raw?: string): string | null {
  if (!raw?.trim()) {
    return null;
  }
  return parseVehicleColorValue(raw) ?? formatVehicleColorLabel(raw) ?? raw.trim();
}

function applyInitialRental(next: BookingFlowState, initialRental?: InitialRentalState) {
  if (!initialRental) {
    return;
  }
  next.rental.pickupDate = initialRental.pickupDate ?? "";
  next.rental.pickupTime = initialRental.pickupTime ?? "";
  next.rental.returnDate = initialRental.returnDate ?? "";
  next.rental.returnTime = initialRental.returnTime ?? "";
  const color = normalizeInitialColor(initialRental.selectedColor);
  if (color) {
    next.rental.selectedColor = color;
  }
}

export function buildBookingInitialState(
  selectedVehicleSlug?: string,
  initialRental?: InitialRentalState,
): BookingFlowState {
  const next = cloneInitialState();

  if (!selectedVehicleSlug) {
    applyInitialRental(next, initialRental);
    return next;
  }

  next.rental.vehicleSlug = selectedVehicleSlug;
  applyInitialRental(next, initialRental);
  return next;
}
