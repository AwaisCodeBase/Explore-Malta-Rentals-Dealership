import type { VehicleCatalogStatus, VehicleType } from "@/generated/prisma/client";

import type { AdminVehicleUnitDto } from "@/lib/admin/vehicle-units/types";
import type { VehicleDeleteBlockedReason } from "@/lib/admin/vehicles/vehicle-delete-errors";

export type AdminVehicleImageDto = {
  id?: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type AdminVehicleListItem = {
  id: string;
  name: string;
  slug: string;
  vehicleType: VehicleType;
  engineCc: number | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  mainImageUrl: string | null;
  catalogStatus: VehicleCatalogStatus;
  isActive: boolean;
  displayOrder: number;
  baseDailyRate: number;
  totalUnits: number;
  availableUnits: number;
  bookingCount: number;
  reservationHoldCount: number;
  availabilityBlockCount: number;
  canDelete: boolean;
  deleteBlockedReasons: VehicleDeleteBlockedReason[];
};

export type AdminVehicleDetail = AdminVehicleListItem & {
  shortDescription: string | null;
  description: string | null;
  helmetIncludedCount: number;
  supportsStorageBox: boolean;
  images: AdminVehicleImageDto[];
  units: AdminVehicleUnitDto[];
  createdAt: string;
  updatedAt: string;
};

export type AdminVehicleListFilters = {
  search?: string;
  vehicleType?: VehicleType;
  catalogStatus?: VehicleCatalogStatus;
};

export type AdminVehicleListResult = {
  vehicles: AdminVehicleListItem[];
  total: number;
};

export const VEHICLE_CATALOG_STATUSES: VehicleCatalogStatus[] = [
  "AVAILABLE",
  "BOOKED",
  "UNDER_PROCESS",
  "SOLD",
  "MAINTENANCE",
  "INACTIVE",
];

export const VEHICLE_TYPES: VehicleType[] = ["Scooter", "Motorcycle", "Bicycle", "ATV"];
