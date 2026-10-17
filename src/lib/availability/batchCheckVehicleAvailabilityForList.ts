import { prisma } from "@/lib/prisma";
import type { VehicleListItemDto } from "@/lib/vehicles/types";
import { batchFindAvailableVehicleUnits } from "@/lib/vehicle-units/findAvailableVehicleUnits";

import { findConflictingBlocks } from "@/lib/availability/findConflictingBlocks";
import { findConflictingReservationHolds } from "@/lib/availability/findConflictingReservationHolds";
import type { AvailabilityDbClient, VehicleAvailabilityResult } from "@/lib/availability/types";

function inactiveResult(reason: string): VehicleAvailabilityResult {
  return {
    isAvailable: false,
    conflictingBookings: [],
    conflictingBlocks: [],
    conflictingReservationHolds: [],
    reason,
  };
}

function buildAvailabilityResult(
  hasAvailableUnit: boolean,
  blocks: VehicleAvailabilityResult["conflictingBlocks"],
  holds: VehicleAvailabilityResult["conflictingReservationHolds"],
): VehicleAvailabilityResult {
  const listingWideHolds = holds.filter((hold) => !hold.vehicleUnitId);
  const hasVehicleWideBlock = blocks.some((block) => block.vehicleId !== null);
  const isAvailable = hasAvailableUnit && !hasVehicleWideBlock && listingWideHolds.length === 0;

  const isReservedByActiveHold =
    !isAvailable && hasAvailableUnit && !hasVehicleWideBlock && holds.length > 0;

  return {
    isAvailable,
    conflictingBookings: [],
    conflictingBlocks: blocks,
    conflictingReservationHolds: holds,
    reason: isAvailable
      ? "Available"
      : isReservedByActiveHold
        ? "Selected vehicle is temporarily reserved by another customer"
        : hasAvailableUnit
          ? "Selected vehicle is not available for the chosen dates"
          : "No physical units are available for the chosen dates",
  };
}

/**
 * Runs availability checks for many vehicle listings using batched conflict queries
 * and a single batched unit-availability query (no per-vehicle N+1).
 */
export async function batchCheckVehicleAvailabilityForList(
  vehicles: readonly VehicleListItemDto[],
  requestedStart: Date,
  requestedEnd: Date,
  db: AvailabilityDbClient = prisma as unknown as AvailabilityDbClient,
): Promise<Map<string, VehicleAvailabilityResult>> {
  const out = new Map<string, VehicleAvailabilityResult>();

  const active = vehicles.filter((v) => v.isActive);
  for (const v of vehicles) {
    if (!v.isActive) {
      out.set(v.id, inactiveResult("Selected vehicle is not active"));
    }
  }

  if (active.length === 0) {
    return out;
  }

  const ids = active.map((v) => v.id);
  const uniqueTypes = [...new Set(active.map((v) => v.vehicleType))];

  const [allBlocks, allHolds, availableUnitsByVehicle] = await Promise.all([
    findConflictingBlocks(
      {
        requestedStart,
        requestedEnd,
        vehicleIds: ids,
        vehicleTypes: uniqueTypes,
      },
      db,
    ),
    findConflictingReservationHolds(
      {
        requestedStart,
        requestedEnd,
        vehicleIds: ids,
      },
      db,
    ),
    batchFindAvailableVehicleUnits({
      vehicleIds: ids,
      requestedStart,
      requestedEnd,
    }),
  ]);

  for (const vehicle of active) {
    const availableUnits = availableUnitsByVehicle.get(vehicle.id) ?? [];
    const holds = allHolds.filter((h) => h.vehicleId === vehicle.id);
    const blocks = allBlocks.filter(
      (b) => b.vehicleId === vehicle.id || b.vehicleType === vehicle.vehicleType,
    );
    out.set(vehicle.id, buildAvailabilityResult(availableUnits.length > 0, blocks, holds));
  }

  return out;
}
