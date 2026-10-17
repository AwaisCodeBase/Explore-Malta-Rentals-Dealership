import type { Prisma, VehicleType } from "@/generated/prisma/client";
import type { VehicleColor } from "@/features/vehicles/data/vehicles";

import { prisma } from "@/lib/prisma";
import { findAvailableVehicleUnits } from "@/lib/vehicle-units";

import { findConflictingBlocks } from "./findConflictingBlocks";
import { findConflictingReservationHolds } from "./findConflictingReservationHolds";
import {
  assertValidAvailabilityWindow,
  type AvailabilityDbClient,
  type VehicleAvailabilityResult,
} from "./types";

export type CheckVehicleAvailabilityInput = {
  vehicleId: string;
  requestedStart: Date;
  requestedEnd: Date;
  vehicleType?: VehicleType;
  color?: VehicleColor;
  excludeHoldReference?: string;
  excludeSessionKey?: string;
};

async function resolveVehicleType(
  vehicleId: string,
  db: AvailabilityDbClient,
): Promise<{ vehicleType: VehicleType; isActive: boolean } | null> {
  const vehicle = await db.vehicle.findUnique({
    where: { id: vehicleId },
    select: { vehicleType: true, isActive: true },
  });

  if (!vehicle) {
    return null;
  }

  return {
    vehicleType: vehicle.vehicleType,
    isActive: vehicle.isActive,
  };
}

type VehicleUnitDbClient = typeof prisma | Prisma.TransactionClient;

export async function checkVehicleAvailability(
  input: CheckVehicleAvailabilityInput,
  db: AvailabilityDbClient = prisma as unknown as AvailabilityDbClient,
  unitDb: VehicleUnitDbClient = prisma,
): Promise<VehicleAvailabilityResult> {
  assertValidAvailabilityWindow(input);

  const resolvedVehicle = input.vehicleType
    ? { vehicleType: input.vehicleType, isActive: true }
    : await resolveVehicleType(input.vehicleId, db);

  if (!resolvedVehicle) {
    return {
      isAvailable: false,
      conflictingBookings: [],
      conflictingBlocks: [],
      conflictingReservationHolds: [],
      reason: "Selected vehicle does not exist",
    };
  }

  if (!resolvedVehicle.isActive) {
    return {
      isAvailable: false,
      conflictingBookings: [],
      conflictingBlocks: [],
      conflictingReservationHolds: [],
      reason: "Selected vehicle is not active",
    };
  }

  const [availableUnits, conflictingBlocks, conflictingReservationHolds] = await Promise.all([
    findAvailableVehicleUnits(
      {
        vehicleId: input.vehicleId,
        requestedStart: input.requestedStart,
        requestedEnd: input.requestedEnd,
        color: input.color,
        excludeHoldReference: input.excludeHoldReference,
        excludeSessionKey: input.excludeSessionKey,
      },
      unitDb,
    ),
    findConflictingBlocks(
      {
        requestedStart: input.requestedStart,
        requestedEnd: input.requestedEnd,
        vehicleId: input.vehicleId,
        vehicleType: resolvedVehicle.vehicleType,
      },
      db,
    ),
    findConflictingReservationHolds(
      {
        requestedStart: input.requestedStart,
        requestedEnd: input.requestedEnd,
        vehicleId: input.vehicleId,
        excludeHoldReference: input.excludeHoldReference,
        excludeSessionKey: input.excludeSessionKey,
      },
      db,
    ),
  ]);

  const hasUnitAvailable = availableUnits.length > 0;
  const hasVehicleWideBlock = conflictingBlocks.some((block) => block.vehicleId === input.vehicleId);

  const isAvailable = hasUnitAvailable && !hasVehicleWideBlock;

  const isReservedByActiveHold =
    !isAvailable &&
    hasUnitAvailable &&
    !hasVehicleWideBlock &&
    conflictingReservationHolds.length > 0;

  return {
    isAvailable,
    conflictingBookings: [],
    conflictingBlocks,
    conflictingReservationHolds,
    reason: isAvailable
      ? "Available"
      : isReservedByActiveHold
        ? "Selected vehicle is temporarily reserved by another customer"
        : hasUnitAvailable
          ? "Selected vehicle is not available for the chosen dates"
          : "No physical units are available for the chosen dates",
  };
}
