import type { VehicleColor } from "@/features/vehicles/data/vehicles";

const VEHICLE_COLORS: readonly VehicleColor[] = [
  "Black",
  "White",
  "Grey",
  "Red",
  "Blue",
  "Silver",
  "Orange",
  "Green",
  "Cream",
];

export const VEHICLE_COLOR_OPTIONS = VEHICLE_COLORS;

export const VEHICLE_COLOR_SWATCHES: Record<VehicleColor, string> = {
  Black: "#1a1a1a",
  White: "#ffffff",
  Grey: "#9ca3af",
  Red: "#ef4444",
  Blue: "#3b82f6",
  Silver: "#c0c0c0",
  Orange: "#f97316",
  Green: "#22c55e",
  Cream: "#fffdd0",
};

export function parseVehicleColorValue(
  raw: string | null | undefined,
): VehicleColor | null {
  if (!raw?.trim()) return null;
  const normalized = raw.trim();
  const lower = normalized.toLowerCase();
  if (lower === "gray" || lower === "grey") {
    return "Grey";
  }
  const match = VEHICLE_COLORS.find(
    (color) => color.toLowerCase() === lower,
  );
  return match ?? null;
}

export function isVehicleColor(value: string): value is VehicleColor {
  return (VEHICLE_COLORS as readonly string[]).includes(value);
}

/** Normalize user input to canonical storage label (e.g. "black" → "Black"). */
export function normalizeVehicleColorForStorage(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const preset = parseVehicleColorValue(raw);
  if (preset) {
    return preset;
  }
  return raw.trim();
}

export function isPresetVehicleColor(value: string): value is VehicleColor {
  return isVehicleColor(value);
}

export function getVehicleColorSwatch(value: string | null | undefined): string {
  const preset = parseVehicleColorValue(value);
  if (preset) {
    return VEHICLE_COLOR_SWATCHES[preset];
  }
  return "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)";
}

/** Lowercase API/URL value from canonical color (e.g. "Black" → "black"). */
export function vehicleColorToValue(color: VehicleColor | string): string {
  const parsed = parseVehicleColorValue(color);
  return parsed ? parsed.toLowerCase() : color.trim().toLowerCase();
}

/** Display label from API value or raw string (e.g. "black" → "Black"). */
export function formatVehicleColorLabel(value: string | null | undefined): string {
  const parsed = parseVehicleColorValue(value);
  return parsed ?? (value?.trim() || "");
}

export function colorsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return vehicleColorToValue(a) === vehicleColorToValue(b);
}
