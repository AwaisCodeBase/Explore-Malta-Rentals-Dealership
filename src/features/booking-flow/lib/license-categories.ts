import {
  isEngineCcValue,
  LICENSES_FOR_125CC,
  LICENSES_FOR_50CC,
  type EngineCcValue,
} from "@/lib/vehicles/engine-cc";

export const LICENSE_CATEGORIES = ["B", "AM", "A", "A1", "A2"] as const;

export type LicenseCategory = (typeof LICENSE_CATEGORIES)[number];

const LICENSES_FOR_ATV: readonly LicenseCategory[] = ["B"];

export function getAllowedLicenseCategories(
  selectedVehicleType: string,
  selectedVehicleId?: string | null,
  engineCc?: number | null,
): readonly LicenseCategory[] {
  const normalizedType = selectedVehicleType.toLowerCase();
  const normalizedId = (selectedVehicleId ?? "").toLowerCase();
  if (normalizedType === "atv" || normalizedId.includes("atv")) {
    return LICENSES_FOR_ATV;
  }

  const cc: EngineCcValue | null = isEngineCcValue(engineCc)
    ? engineCc
    : normalizedId.includes("50cc") || normalizedType === "scooter"
      ? 50
      : normalizedId.includes("125cc") || normalizedType === "motorcycle"
        ? 125
        : null;

  if (cc === 50) {
    return LICENSES_FOR_50CC;
  }
  if (cc === 125) {
    return LICENSES_FOR_125CC;
  }
  return LICENSE_CATEGORIES;
}

export function isLicenseAllowedForVehicle(
  licenseCategory: string,
  selectedVehicleType: string,
  selectedVehicleId?: string | null,
  engineCc?: number | null,
): boolean {
  if (!licenseCategory) {
    return false;
  }
  return getAllowedLicenseCategories(selectedVehicleType, selectedVehicleId, engineCc).includes(
    licenseCategory as LicenseCategory,
  );
}

export function getLicenseCategoryHint(selectedVehicleType: string, engineCc?: number | null): string {
  if (selectedVehicleType.toLowerCase().includes("atv")) {
    return "ATV requires license B.";
  }
  if (engineCc === 50) {
    return "50cc requires license B or AM.";
  }
  if (engineCc === 125) {
    return "125cc requires license A, A1, or A2.";
  }
  return "50cc requires license B or AM. 125cc requires A, A1, or A2.";
}
