import type { BookingStatus, VehicleUnitStatus } from "@/generated/prisma/client";

export type AdminVehicleUnitDto = {
  id: string;
  vehicleId: string;
  licensePlate: string;
  color: string | null;
  status: VehicleUnitStatus;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminVehicleUnitBookingItem = {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  pickupDateTime: string;
  returnDateTime: string;
  customerFullName: string;
  customerEmail: string;
};

export type AdminVehicleUnitHoldItem = {
  holdReference: string;
  status: string;
  pickupDateTime: string;
  returnDateTime: string;
  expiresAt: string;
};

export type AdminVehicleUnitDetailDto = AdminVehicleUnitDto & {
  vehicleName: string;
  bookings: AdminVehicleUnitBookingItem[];
  activeHolds: AdminVehicleUnitHoldItem[];
};

export type AdminVehicleUnitCounts = {
  totalUnits: number;
  availableUnits: number;
};
