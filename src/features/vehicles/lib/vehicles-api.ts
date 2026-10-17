import {
  isApiVehicleType,
  mapVehicleDetailItemToVehicle,
  mapVehicleListItemToVehicle,
  type Vehicle,
  type VehicleDetailApiItem,
  type VehicleListApiItem,
} from "@/features/vehicles/data/vehicles";
import { isVehicleRentalWindowStatus } from "@/lib/vehicles/types";

type VehiclesApiResponse = {
  success: boolean;
  vehicles?: VehicleListApiItem[];
  message?: string;
};

type VehicleApiResponse = {
  success: boolean;
  vehicle?: VehicleDetailApiItem;
  message?: string;
};

type CacheEntry<T> = Readonly<{
  data: T;
  expiresAt: number;
}>;

const VEHICLES_CACHE_TTL_MS = 60_000;
const vehiclesCache = new Map<string, CacheEntry<Vehicle[]>>();

function getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T) {
  cache.set(key, { data, expiresAt: Date.now() + VEHICLES_CACHE_TTL_MS });
}

function isVehicleListItem(value: unknown): value is VehicleListApiItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.vehicleType === "string" &&
    isApiVehicleType(candidate.vehicleType) &&
    (candidate.engineCc === undefined ||
      candidate.engineCc === null ||
      candidate.engineCc === 50 ||
      candidate.engineCc === 125) &&
    (candidate.brand === null || typeof candidate.brand === "string") &&
    (candidate.model === null || typeof candidate.model === "string") &&
    (candidate.color === null || typeof candidate.color === "string") &&
    (candidate.shortDescription === null || typeof candidate.shortDescription === "string") &&
    (candidate.description === null || typeof candidate.description === "string") &&
    (candidate.mainImageUrl === null || typeof candidate.mainImageUrl === "string") &&
    typeof candidate.helmetIncludedCount === "number" &&
    typeof candidate.supportsStorageBox === "boolean" &&
    typeof candidate.baseDailyRate === "number" &&
    (candidate.rentalWindowStatus === undefined ||
      (typeof candidate.rentalWindowStatus === "string" &&
        isVehicleRentalWindowStatus(candidate.rentalWindowStatus)))
  );
}

function isVehicleImage(value: unknown): value is VehicleDetailApiItem["images"][number] {
  if (!value || typeof value !== "object") return false;
  const image = value as Record<string, unknown>;
  return (
    typeof image.imageUrl === "string" &&
    (image.altText === null || typeof image.altText === "string") &&
    typeof image.sortOrder === "number" &&
    typeof image.isPrimary === "boolean"
  );
}

function isVehicleDetailItem(value: unknown): value is VehicleDetailApiItem {
  if (!isVehicleListItem(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.images)) return false;
  return candidate.images.every((image) => isVehicleImage(image));
}

async function parseJsonBody<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export type FetchVehiclesRentalWindow = Readonly<{
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  sessionKey?: string;
}>;

export async function fetchVehicles(
  signal?: AbortSignal,
  rentalWindow?: FetchVehiclesRentalWindow | null,
): Promise<Vehicle[]> {
  const search = new URLSearchParams();
  if (rentalWindow) {
    search.set("pickupDate", rentalWindow.pickupDate.trim());
    search.set("pickupTime", rentalWindow.pickupTime.trim());
    search.set("returnDate", rentalWindow.returnDate.trim());
    search.set("returnTime", rentalWindow.returnTime.trim());
    if (rentalWindow.sessionKey?.trim()) {
      search.set("sessionKey", rentalWindow.sessionKey.trim());
    }
  }
  const qs = search.toString();
  const cacheKey = qs || "__base__";
  const shouldBypassCache = Boolean(rentalWindow);
  if (!shouldBypassCache) {
    const cached = getFromCache(vehiclesCache, cacheKey);
    if (cached) return cached;
  }

  const response = await fetch(qs ? `/api/vehicles?${qs}` : "/api/vehicles", {
    method: "GET",
    cache: shouldBypassCache ? "no-store" : "force-cache",
    ...(shouldBypassCache ? {} : { next: { revalidate: 60 } }),
    signal,
  });
  const body = await parseJsonBody<VehiclesApiResponse>(response);

  if (!response.ok || !body?.success) {
    throw new Error(body?.message ?? "Unable to load vehicles right now.");
  }

  if (!Array.isArray(body.vehicles)) {
    throw new Error("Unexpected vehicles response shape.");
  }

  const mapped = body.vehicles.filter(isVehicleListItem).map(mapVehicleListItemToVehicle);
  if (!shouldBypassCache) {
    setCache(vehiclesCache, cacheKey, mapped);
  }
  return mapped;
}

export async function fetchVehicleBySlug(slug: string, signal?: AbortSignal): Promise<Vehicle | null> {
  const safeSlug = slug.trim();
  if (!safeSlug) {
    return null;
  }

  const response = await fetch(`/api/vehicles/${encodeURIComponent(safeSlug)}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const body = await parseJsonBody<VehicleApiResponse>(response);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.message ?? "Unable to load vehicle right now.");
  }

  if (!body.vehicle || !isVehicleDetailItem(body.vehicle)) {
    throw new Error("Unexpected vehicle response shape.");
  }

  return mapVehicleDetailItemToVehicle(body.vehicle);
}
