import { parseVehicleColorValue } from "@/features/vehicles/lib/vehicle-color";
import type { VehicleRentalWindowStatus, AvailableColorDto } from "@/lib/vehicles/types";
import {
  formatEngineCcLabel,
  isEngineCcValue,
  normalizeEngineCc,
  type EngineCcValue,
} from "@/lib/vehicles/engine-cc";

export const VEHICLE_TYPES = ["Scooter", "Motorcycle", "Bicycle", "ATV"] as const;

export type ApiVehicleType = (typeof VEHICLE_TYPES)[number];
export type VehicleType = ApiVehicleType;
export type Transmission = "Automatic" | "Manual";

/** Listing filter: exact seat count (1–3 only). */
export type VehicleSeatsFilter = 1 | 2 | 3 | "All";

/** Exterior / finish color used for listing filters. */
export type VehicleColor =
  | "Black"
  | "White"
  | "Grey"
  | "Red"
  | "Blue"
  | "Silver"
  | "Orange"
  | "Green"
  | "Cream";

export type VehicleAddOn = Readonly<{
  id: string;
  name: string;
  pricePerDay?: number;
  priceOnce?: number;
}>;

export type VehicleListApiItem = Readonly<{
  id: string;
  name: string;
  slug: string;
  vehicleType: ApiVehicleType;
  engineCc?: number | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  shortDescription: string | null;
  description: string | null;
  mainImageUrl: string | null;
  helmetIncludedCount: number;
  supportsStorageBox: boolean;
  baseDailyRate: number;
  rentalWindowStatus?: VehicleRentalWindowStatus;
  availableColors?: readonly AvailableColorDto[];
}>;

export type VehicleImageApiItem = Readonly<{
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}>;

export type VehicleDetailApiItem = VehicleListApiItem & {
  images: VehicleImageApiItem[];
};

export type Vehicle = Readonly<{
  id: string;
  slug: string;
  name: string;
  type: VehicleType;
  apiVehicleType: ApiVehicleType;
  brand: string | null;
  model: string | null;
  shortDescription: string | null;
  tagline: string;
  description: string;
  mainImageUrl: string | null;
  images: readonly string[];
  helmetIncludedCount: number;
  supportsStorageBox: boolean;
  pricePerDay: number;
  baseDailyRate: number;
  securityDepositEUR?: number;
  seats: number;
  transmission: Transmission;
  fuel: string;
  color: VehicleColor | null;
  engineCc: EngineCcValue | null;
  engine: string;
  rating: number;
  reviewCount: number;
  location: string;
  highlights: readonly string[];
  features: readonly string[];
  addOns: readonly VehicleAddOn[];
  /** Present when listing was fetched with full pickup/return date+time (holds). */
  rentalWindowStatus?: VehicleRentalWindowStatus;
  availableColors?: readonly AvailableColorDto[];
}>;

const PLACEHOLDER_ADDONS: readonly VehicleAddOn[] = [
  { id: "low-road-insurance", name: "Lowest Road Insurance", pricePerDay: 3 },
  { id: "full-coverage-insurance", name: "Full Coverage Insurance", pricePerDay: 8 },
];

function readableApiVehicleType(type: ApiVehicleType): string {
  return type;
}

function mapApiTypeToListingType(type: ApiVehicleType): VehicleType {
  return type;
}

function engineLabelForVehicle(type: ApiVehicleType, engineCc: number | null | undefined): string {
  const normalized = normalizeEngineCc(type, engineCc);
  const label = formatEngineCcLabel(normalized, type);
  return label || formatEngineCcLabel(null, type);
}

function supportsStorageFeatureLabel(supportsStorageBox: boolean): string {
  return supportsStorageBox ? "Storage box available" : "Storage box unavailable";
}

function toVehicleImageList(
  mainImageUrl: string | null,
  images: readonly VehicleImageApiItem[] | undefined,
): string[] {
  const imageUrls = (images ?? []).map((image) => image.imageUrl).filter(Boolean);
  if (mainImageUrl && !imageUrls.includes(mainImageUrl)) {
    return [mainImageUrl, ...imageUrls];
  }
  return mainImageUrl ? [mainImageUrl] : imageUrls;
}

function buildTagline(item: VehicleListApiItem): string {
  if (item.shortDescription?.trim()) return item.shortDescription;
  const parts = [item.brand, item.model].filter(Boolean);
  if (parts.length > 0) return `${parts.join(" ")} · ${readableApiVehicleType(item.vehicleType)}`;
  return readableApiVehicleType(item.vehicleType);
}

function buildDescription(item: VehicleListApiItem): string {
  if (item.description?.trim()) return item.description;
  if (item.shortDescription?.trim()) return item.shortDescription;
  return `${item.name} is available for booking in Malta.`;
}

function mapApiPricingToBaseDailyRate(item: VehicleListApiItem): number {
  return item.baseDailyRate > 0 ? item.baseDailyRate : 0;
}

export function mapVehicleListItemToVehicle(item: VehicleListApiItem): Vehicle {
  const inferredType = mapApiTypeToListingType(item.vehicleType);
  const supportsStorageBox = item.supportsStorageBox === true;
  const baseDailyRate = mapApiPricingToBaseDailyRate(item);
  const engineCc = isEngineCcValue(item.engineCc) ? item.engineCc : normalizeEngineCc(item.vehicleType, item.engineCc);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    type: inferredType,
    apiVehicleType: item.vehicleType,
    brand: item.brand,
    model: item.model,
    shortDescription: item.shortDescription,
    tagline: buildTagline(item),
    description: buildDescription(item),
    mainImageUrl: item.mainImageUrl,
    images: item.mainImageUrl ? [item.mainImageUrl] : [],
    helmetIncludedCount: item.helmetIncludedCount,
    supportsStorageBox,
    pricePerDay: baseDailyRate,
    baseDailyRate,
    seats: item.vehicleType === "Bicycle" ? 1 : 2,
    transmission: item.vehicleType === "Bicycle" ? "Manual" : "Automatic",
    fuel: item.vehicleType === "Bicycle" ? "Human powered" : "Petrol",
    color: parseVehicleColorValue(item.color),
    engineCc,
    engine: engineLabelForVehicle(item.vehicleType, item.engineCc),
    rating: 0,
    reviewCount: 0,
    location: "Pieta, Malta",
    highlights: [
      item.helmetIncludedCount > 0 ? `${item.helmetIncludedCount} helmet(s) included` : "Helmet availability on request",
      supportsStorageFeatureLabel(supportsStorageBox),
    ],
    features: [
      item.brand || item.model ? `Model: ${[item.brand, item.model].filter(Boolean).join(" ")}` : readableApiVehicleType(item.vehicleType),
      `${item.helmetIncludedCount} helmet(s) included`,
      supportsStorageFeatureLabel(supportsStorageBox),
    ],
    addOns: supportsStorageBox
      ? [{ id: "storage-box", name: "Storage box", priceOnce: 10 }, ...PLACEHOLDER_ADDONS]
      : PLACEHOLDER_ADDONS,
    ...(item.rentalWindowStatus ? { rentalWindowStatus: item.rentalWindowStatus } : {}),
    ...(item.availableColors ? { availableColors: item.availableColors } : {}),
  };
}

export function mapVehicleDetailItemToVehicle(item: VehicleDetailApiItem): Vehicle {
  const mapped = mapVehicleListItemToVehicle(item);
  return {
    ...mapped,
    images: toVehicleImageList(item.mainImageUrl, item.images),
  };
}

export function formatVehicleTypeLabel(type: ApiVehicleType): string {
  return readableApiVehicleType(type);
}

export function isApiVehicleType(value: string): value is ApiVehicleType {
  return (VEHICLE_TYPES as readonly string[]).includes(value);
}
