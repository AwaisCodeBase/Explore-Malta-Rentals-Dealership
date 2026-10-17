import type { Prisma } from "@/generated/prisma/index";

import {
  formatVehicleColorLabel,
  parseVehicleColorValue,
  vehicleColorToValue,
} from "@/features/vehicles/lib/vehicle-color";
import { batchFindAvailableVehicleUnits } from "@/lib/vehicle-units/findAvailableVehicleUnits";
import { prisma } from "@/lib/prisma";
import type { AvailableColorDto, VehicleUnitRecord } from "@/lib/vehicle-units/types";

type VehicleUnitDbClient = typeof prisma | Prisma.TransactionClient;

export type BatchGetAvailableColorsInput = {
  vehicleIds: string[];
  requestedStart: Date;
  requestedEnd: Date;
  excludeSessionKey?: string;
};

function groupUnitsByColorForVehicle(
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

/**
 * Batch-fetch available colors for multiple vehicles using a single unit-availability query.
 */
export async function batchGetAvailableColorsForVehicles(
  input: BatchGetAvailableColorsInput,
  db: VehicleUnitDbClient = prisma as unknown as VehicleUnitDbClient,
): Promise<Map<string, AvailableColorDto[]>> {
  const out = new Map<string, AvailableColorDto[]>();

  if (input.vehicleIds.length === 0) {
    return out;
  }

  const availableByVehicle = await batchFindAvailableVehicleUnits(
    {
      vehicleIds: input.vehicleIds,
      requestedStart: input.requestedStart,
      requestedEnd: input.requestedEnd,
      excludeSessionKey: input.excludeSessionKey,
    },
    db,
  );

  for (const vehicleId of input.vehicleIds) {
    const units = availableByVehicle.get(vehicleId) ?? [];
    out.set(vehicleId, groupUnitsByColorForVehicle(units));
  }

  return out;
}

/** Derive color DTOs from a precomputed available-units map (avoids a second DB round-trip). */
export function availableColorsFromUnitsMap(
  vehicleIds: readonly string[],
  availableByVehicle: ReadonlyMap<string, readonly VehicleUnitRecord[]>,
): Map<string, AvailableColorDto[]> {
  const out = new Map<string, AvailableColorDto[]>();
  for (const vehicleId of vehicleIds) {
    out.set(vehicleId, groupUnitsByColorForVehicle(availableByVehicle.get(vehicleId) ?? []));
  }
  return out;
}
