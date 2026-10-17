export const ENGINE_CC_VALUES = [50, 125] as const;

export type EngineCcValue = (typeof ENGINE_CC_VALUES)[number];

export const LICENSES_FOR_50CC = ["B", "AM"] as const;
export const LICENSES_FOR_125CC = ["A", "A1", "A2"] as const;

export function isEngineCcValue(value: unknown): value is EngineCcValue {
  return value === 50 || value === 125;
}

export function vehicleTypeUsesEngineCc(vehicleType: string): boolean {
  return vehicleType === "Scooter" || vehicleType === "Motorcycle";
}

export function defaultEngineCcForVehicleType(vehicleType: string): EngineCcValue | null {
  if (vehicleType === "Scooter") return 50;
  if (vehicleType === "Motorcycle") return 125;
  return null;
}

export function normalizeEngineCc(
  vehicleType: string,
  engineCc: number | null | undefined,
): EngineCcValue | null {
  if (!vehicleTypeUsesEngineCc(vehicleType)) {
    return null;
  }
  return isEngineCcValue(engineCc) ? engineCc : defaultEngineCcForVehicleType(vehicleType);
}

export function formatEngineCcLabel(
  engineCc: number | null | undefined,
  vehicleType?: string,
): string {
  if (engineCc === 50) return "50cc";
  if (engineCc === 125) return "125cc";
  if (vehicleType === "ATV") return "ATV";
  if (vehicleType === "Bicycle") return "Bicycle";
  return "";
}

export function isLicenseAllowedForEngine(
  vehicleType: string,
  licenseCategory: string,
  engineCc?: number | null,
): boolean {
  if (vehicleType === "Bicycle" || vehicleType === "ATV") {
    return true;
  }

  const cc = normalizeEngineCc(vehicleType, engineCc);
  if (cc == null) {
    return true;
  }

  const allowed = cc === 50 ? LICENSES_FOR_50CC : LICENSES_FOR_125CC;
  return (allowed as readonly string[]).includes(licenseCategory);
}
