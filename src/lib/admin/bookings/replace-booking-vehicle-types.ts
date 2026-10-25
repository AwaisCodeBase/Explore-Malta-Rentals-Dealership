import type { VehicleType, VehicleUnitStatus } from "@/generated/prisma/index";

import type { ReplacementReason, ReplacementUnitDisposition } from "@/lib/admin/bookings/vehicle-replacement-eligibility";

export type ReplaceBookingVehicleFailureReason =
  | "not_found"
  | "invalid_status"
  | "missing_vehicle_unit"
  | "no_remaining_period"
  | "same_unit"
  | "vehicle_not_found"
  | "no_availability"
  | "incompatible_license"
  | "incompatible_storage"
  | "current_unit_changed"
  | "concurrent_update";

export type ReplaceBookingVehicleFailure = {
  ok: false;
  reason: ReplaceBookingVehicleFailureReason;
  status?: string;
};

export type ReplacementVehicleUnitOption = {
  id: string;
  licensePlate: string;
  color: string | null;
  vehicleId: string;
  vehicleName: string;
  brand: string | null;
  model: string | null;
  vehicleType: VehicleType;
};

export type ReplaceBookingVehicleOptions = {
  bookingReference: string;
  currentVehicleName: string;
  currentLicensePlate: string | null;
  currentColor: string | null;
  currentUnitStatus: VehicleUnitStatus | null;
  replacementEffectiveAt: string;
  returnDateTime: string;
  subtotal: number;
  priceUnchanged: true;
  expectedUpdatedAt: string;
  expectedVehicleUnitId: string;
  units: ReplacementVehicleUnitOption[];
};

export type ReplaceBookingVehicleInput = {
  vehicleUnitId: string;
  previousUnitStatus: ReplacementUnitDisposition;
  reason: ReplacementReason;
  note?: string | null;
  expectedUpdatedAt: Date;
  expectedVehicleUnitId: string;
};
