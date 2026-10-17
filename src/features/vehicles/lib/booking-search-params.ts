import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import {
  TRIP_MAX_SPAN_DAYS,
  TRIP_MIN_SPAN_DAYS,
} from "@/features/booking/lib/booking-schema";
import type {
  Transmission,
  VehicleColor,
  VehicleSeatsFilter,
  VehicleType,
} from "@/features/vehicles/data/vehicles";

/** Map hero booking `vehicleTypeOptions` values to listing filter. */
export function parseVehicleTypeSearchParam(
  raw: string | null,
): VehicleType | "All" {
  if (!raw) return "All";
  const key = raw.trim().toLowerCase();
  const map: Record<string, VehicleType | "All"> = {
    all: "All",
    scooter: "Scooter",
    scooters: "Scooter",
    motorcycle: "Motorcycle",
    motorcycles: "Motorcycle",
    atv: "ATV",
    atvs: "ATV",
    bicycle: "Bicycle",
    bicycles: "Bicycle",
  };
  if (key in map) return map[key]!;
  const titled: VehicleType[] = ["Scooter", "Motorcycle", "ATV", "Bicycle"];
  if (titled.includes(raw as VehicleType)) return raw as VehicleType;
  if (raw === "All") return "All";
  return "All";
}

const COLOR_URL: Record<VehicleColor, string> = {
  Black: "black",
  White: "white",
  Grey: "grey",
  Red: "red",
  Blue: "blue",
  Silver: "silver",
  Orange: "orange",
  Green: "green",
  Cream: "cream",
};

const URL_TO_COLOR: Record<string, VehicleColor | "All"> = {
  all: "All",
  black: "Black",
  white: "White",
  grey: "Grey",
  gray: "Grey",
  red: "Red",
  blue: "Blue",
  silver: "Silver",
  orange: "Orange",
  green: "Green",
  cream: "Cream",
};

export function parseBrandSearchParam(raw: string | null): string | "All" {
  if (!raw) return "All";
  const decoded = decodeURIComponent(raw.trim());
  if (!decoded || decoded.toLowerCase() === "all") return "All";
  return decoded;
}

export function brandToUrlParam(value: string | "All"): string {
  if (value === "All") return "all";
  return encodeURIComponent(value.trim());
}

export function parseColorSearchParam(
  raw: string | null,
): VehicleColor | "All" {
  if (!raw) return "All";
  const key = raw.trim().toLowerCase();
  if (key === "all") return "All";
  return URL_TO_COLOR[key] ?? "All";
}

export function vehicleColorToUrlParam(value: VehicleColor | "All"): string {
  if (value === "All") return "all";
  return COLOR_URL[value];
}

export function parseTransmissionSearchParam(
  raw: string | null,
): Transmission | "All" {
  if (!raw) return "All";
  const key = raw.trim().toLowerCase();
  if (key === "all") return "All";
  if (key === "automatic") return "Automatic";
  if (key === "manual") return "Manual";
  return "All";
}

export function transmissionToUrlParam(value: Transmission | "All"): string {
  if (value === "All") return "all";
  return value.toLowerCase();
}

export function parseSeatsSearchParam(raw: string | null): VehicleSeatsFilter {
  if (!raw) return "All";
  const key = raw.trim().toLowerCase();
  if (key === "all") return "All";
  if (key === "1") return 1;
  if (key === "2") return 2;
  if (key === "3") return 3;
  return "All";
}

export function seatsFilterToUrlParam(value: VehicleSeatsFilter): string {
  if (value === "All") return "all";
  return String(value);
}

export function vehicleFilterTypeToUrlParam(value: VehicleType | "All"): string {
  switch (value) {
    case "All":
      return "all";
    case "Scooter":
      return "scooter";
    case "Motorcycle":
      return "motorcycle";
    case "ATV":
      return "atv";
    case "Bicycle":
      return "bicycle";
    default:
      return "all";
  }
}

export function parsePickupDateParam(raw: string | null): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }
  const [y, mo, da] = raw.split("-").map(Number);
  const dt = new Date(y!, mo! - 1, da!);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatPickupDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Keeps trip end within booking min/max span vs pickup (calendar days). */
export function clampTripEndDate(pickup: Date, end: Date): Date {
  const start = startOfDay(pickup);
  const e = startOfDay(end);
  const span = differenceInCalendarDays(e, start);
  if (span < TRIP_MIN_SPAN_DAYS) return addDays(start, TRIP_MIN_SPAN_DAYS);
  if (span > TRIP_MAX_SPAN_DAYS) return addDays(start, TRIP_MAX_SPAN_DAYS);
  return e;
}

/** Filter scooters/motorcycles by engine class from URL (`cc=50` / `cc=125`). */
export type EngineCcFilter = "All" | "50" | "125";

export function parseCcSearchParam(raw: string | null): EngineCcFilter {
  if (!raw) return "All";
  const key = raw.trim().toLowerCase();
  if (key === "50") return "50";
  if (key === "125") return "125";
  return "All";
}

export function engineCcToUrlParam(value: EngineCcFilter): string {
  if (value === "All") return "all";
  return value;
}

export function formatPickupDateLabel(isoDate: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, mo, da] = isoDate.split("-").map(Number);
  const dt = new Date(y!, mo! - 1, da!);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
