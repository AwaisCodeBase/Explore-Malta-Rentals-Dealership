import type { Prisma } from "@/generated/prisma/index";

import {
  formatVehicleColorLabel,
  parseVehicleColorValue,
  vehicleColorToValue,
} from "@/features/vehicles/lib/vehicle-color";
import { findAvailableVehicleUnits } from "@/lib/vehicle-units/findAvailableVehicleUnits";
import { prisma } from "@/lib/prisma";
import type { AvailableColorDto } from "@/lib/vehicle-units/types";

type VehicleUnitDbClient = typeof prisma | Prisma.TransactionClient;

export type GetAvailableColorsInput = {
  vehicleId: string;
  requestedStart: Date;
  requestedEnd: Date;
  excludeHoldReference?: string;
  excludeSessionKey?: string;
};

function groupUnitsByColor(
  units: Array<{ color: string | null }>,
): AvailableColorDto[] {
  const counts = new Map<string, { label: string; count: number }>();

  for (const unit of units) {
    const canonical = parseVehicleColorValue(unit.color);
    if (!canonical) {
      continue;
    }
    const value = vehicleColorToValue(canonical);
    const existing = counts.get(value);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(value, { label: formatVehicleColorLabel(canonical), count: 1 });
    }
  }

  return [...counts.entries()]
    .map(([value, { label, count }]) => ({
      value,
      label,
      availableUnitCount: count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getAvailableColorsForVehicle(
  input: GetAvailableColorsInput,
  db: VehicleUnitDbClient = prisma as unknown as VehicleUnitDbClient,
): Promise<AvailableColorDto[]> {
  const availableUnits = await findAvailableVehicleUnits(
    {
      vehicleId: input.vehicleId,
      requestedStart: input.requestedStart,
      requestedEnd: input.requestedEnd,
      excludeHoldReference: input.excludeHoldReference,
      excludeSessionKey: input.excludeSessionKey,
    },
    db,
  );

  return groupUnitsByColor(availableUnits);
}

export async function vehicleHasColoredUnits(
  vehicleId: string,
  db: VehicleUnitDbClient = prisma as unknown as VehicleUnitDbClient,
): Promise<boolean> {
  const count = await db.vehicleUnit.count({
    where: {
      vehicleId,
      isActive: true,
      color: { not: null },
    },
  });
  return count > 0;
}

/** Distinct colors on active units — not filtered by rental dates. */
export async function getUnitColorsForVehicle(
  vehicleId: string,
  db: VehicleUnitDbClient = prisma as unknown as VehicleUnitDbClient,
): Promise<AvailableColorDto[]> {
  const units = await db.vehicleUnit.findMany({
    where: {
      vehicleId,
      isActive: true,
      color: { not: null },
    },
    select: { color: true },
  });

  return groupUnitsByColor(units);
}
