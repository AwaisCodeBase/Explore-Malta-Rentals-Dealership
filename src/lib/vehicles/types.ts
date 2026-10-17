import type { VehicleType } from "@/generated/prisma/client";

/** When listing is scoped to a rental window + optional viewer session (holds). */
export type VehicleRentalWindowStatus = "available" | "unavailable" | "reserved_other" | "reserved_you";

export type AvailableColorDto = {
  value: string;
  label: string;
  availableUnitCount: number;
};

const RENTAL_WINDOW_STATUSES: readonly VehicleRentalWindowStatus[] = [
  "available",
  "unavailable",
  "reserved_other",
  "reserved_you",
];

export function isVehicleRentalWindowStatus(value: string): value is VehicleRentalWindowStatus {
  return (RENTAL_WINDOW_STATUSES as readonly string[]).includes(value);
}

/** Vehicles the customer can still book for the searched rental window. */
export function isBookableRentalWindowStatus(
  status: VehicleRentalWindowStatus | undefined,
): boolean {
  return status === "available" || status === "reserved_you";
}

export type VehicleImageDto = {
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type VehicleListItemDto = {
  id: string;
  name: string;
  slug: string;
  vehicleType: VehicleType;
  engineCc: number | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  shortDescription: string | null;
  description: string | null;
  mainImageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  baseDailyRate: number;
  helmetIncludedCount: number;
  supportsStorageBox: boolean;
  rentalWindowStatus?: VehicleRentalWindowStatus;
  availableColors?: AvailableColorDto[];
};

export type VehicleDetailDto = VehicleListItemDto & {
  images: VehicleImageDto[];
};

export type GetVehiclesFilters = {
  type?: VehicleType;
  active?: boolean;
};

export type GetVehiclesResult = {
  vehicles: VehicleListItemDto[];
};

export type GetVehicleBySlugResult = {
  vehicle: VehicleDetailDto | null;
};
