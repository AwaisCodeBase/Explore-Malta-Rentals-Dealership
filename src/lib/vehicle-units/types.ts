import type { VehicleUnitStatus } from "@/generated/prisma/client";
import type { VehicleColor } from "@/features/vehicles/data/vehicles";

/** Physical/operational statuses that allow unit assignment when active. Date locks use VehicleUnitOccupancy. */
export const ASSIGNABLE_VEHICLE_UNIT_STATUSES: readonly VehicleUnitStatus[] = ["AVAILABLE", "RESERVED"];

export const NON_BOOKABLE_VEHICLE_UNIT_STATUSES: readonly VehicleUnitStatus[] = [
  "OUT_WITH_CUSTOMER",
  "MAINTENANCE",
  "NOT_AVAILABLE",
];

export type VehicleUnitRecord = {
  id: string;
  vehicleId: string;
  licensePlate: string;
  color: string | null;
  status: VehicleUnitStatus;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FindAvailableVehicleUnitsInput = {
  vehicleId: string;
  requestedStart: Date;
  requestedEnd: Date;
  color?: VehicleColor;
  excludeHoldReference?: string;
  excludeSessionKey?: string;
  excludeVehicleUnitId?: string;
};

export type AssignVehicleUnitInput = FindAvailableVehicleUnitsInput;

export type AssignVehicleUnitResult = {
  vehicleUnitId: string;
  licensePlate: string;
  color: string | null;
};

export type AvailableColorDto = {
  value: string;
  label: string;
  availableUnitCount: number;
};
