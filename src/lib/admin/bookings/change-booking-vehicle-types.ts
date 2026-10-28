import type { BookingStatus, VehicleType } from "@/generated/prisma/index";

import type { VehicleChangePriceMode } from "@/lib/admin/bookings/calculate-vehicle-change-price";

export type ChangeBookingVehicleFailureReason =
  | "not_found"
  | "invalid_status"
  | "concurrent_update"
  | "same_vehicle"
  | "vehicle_not_found"
  | "vehicle_inactive"
  | "incompatible_license"
  | "incompatible_storage"
  | "invalid_color"
  | "no_availability"
  | "invalid_pricing"
  | "price_mode_unavailable";

export type ChangeBookingVehicleColorOption = {
  value: string;
  label: string;
  availableUnitCount: number;
};

export type ChangeBookingVehicleExclusionReason =
  | "current"
  | "unavailable"
  | "held"
  | "blocked"
  | "license"
  | "storage"
  | "inactive";

export type ChangeBookingVehicleOption = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  vehicleType: VehicleType;
  engineCc: number | null;
  baseDailyRate: number;
  supportsStorageBox: boolean;
  requiresColor: boolean;
  colors: ChangeBookingVehicleColorOption[];
};

export type ChangeBookingVehicleExcluded = {
  id: string;
  name: string;
  vehicleType: VehicleType;
  reason: ChangeBookingVehicleExclusionReason;
};

export type ChangeBookingVehicleOptions = {
  bookingReference: string;
  currentVehicleId: string | null;
  currentVehicleName: string;
  currentColor: string | null;
  currentUnitLabel: string | null;
  hasAssignedUnit: boolean;
  pickupDateTime: string;
  returnDateTime: string;
  currentSubtotal: number;
  canApplyCatalogPrice: boolean;
  customerLicenseCategory: string;
  storageBoxSelected: boolean;
  expectedUpdatedAt: string;
  vehicles: ChangeBookingVehicleOption[];
  excluded: ChangeBookingVehicleExcluded[];
};

export type ChangeBookingVehiclePreview = {
  bookingReference: string;
  currentVehicleName: string;
  currentColor: string | null;
  currentUnitLabel: string | null;
  replacementVehicleId: string;
  replacementVehicleName: string;
  replacementVehicleType: VehicleType;
  vehicleTypeChanged: boolean;
  selectedColor: string | null;
  pickupDateTime: string;
  returnDateTime: string;
  assignsUnitNow: boolean;
  proposedUnitLabel: string | null;
  proposedColor: string | null;
  priceMode: VehicleChangePriceMode;
  currentSubtotal: number;
  calculatedSubtotal: number;
  priceDifference: number;
  finalSubtotal: number;
  calculatedAppliedDailyRate: number;
  duesUpdated: boolean;
  canApplyCatalogPrice: boolean;
  expectedUpdatedAt: string;
};

export type ChangeBookingVehicleFailure = {
  ok: false;
  reason: ChangeBookingVehicleFailureReason;
  status?: BookingStatus;
};
