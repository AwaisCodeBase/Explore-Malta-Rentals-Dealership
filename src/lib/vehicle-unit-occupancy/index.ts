import { randomBytes } from "node:crypto";

import type { Prisma } from "@/generated/prisma/index";

const PG_EXCLUSION_VIOLATION = "23P01";

type OccupancyDb = Pick<Prisma.TransactionClient, "$executeRaw" | "$executeRawUnsafe">;

export type OccupancyPeriodInput = {
  vehicleUnitId: string;
  pickupAt: Date;
  returnAt: Date;
};

export type CreateHoldOccupancyInput = OccupancyPeriodInput & {
  reservationHoldId: string;
};

export type CreateBookingOccupancyInput = OccupancyPeriodInput & {
  bookingId: string;
};

function newOccupancyId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function assertValidHalfOpenPeriod(pickupAt: Date, returnAt: Date): void {
  if (pickupAt >= returnAt) {
    throw new Error("Occupancy period start must be before end");
  }
}

export function isVehicleUnitOccupancyExclusionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; meta?: { code?: string } };
  if (candidate.code === PG_EXCLUSION_VIOLATION) {
    return true;
  }
  if (candidate.meta?.code === PG_EXCLUSION_VIOLATION) {
    return true;
  }

  const message = String((error as Error).message ?? "");
  return (
    message.includes("VehicleUnitOccupancy_vehicleUnitId_period_excl") ||
    message.includes("exclusion violation") ||
    message.toLowerCase().includes("23p01")
  );
}

export async function insertHoldOccupancy(
  db: OccupancyDb,
  input: CreateHoldOccupancyInput,
): Promise<void> {
  assertValidHalfOpenPeriod(input.pickupAt, input.returnAt);

  await db.$executeRaw`
    INSERT INTO "VehicleUnitOccupancy" (
      "id", "vehicleUnitId", "pickupAt", "returnAt", "reservationHoldId", "createdAt"
    ) VALUES (
      ${newOccupancyId("vuo_hld")},
      ${input.vehicleUnitId},
      ${input.pickupAt},
      ${input.returnAt},
      ${input.reservationHoldId},
      NOW()
    )
  `;
}

export async function insertBookingOccupancy(
  db: OccupancyDb,
  input: CreateBookingOccupancyInput,
): Promise<void> {
  assertValidHalfOpenPeriod(input.pickupAt, input.returnAt);

  await db.$executeRaw`
    INSERT INTO "VehicleUnitOccupancy" (
      "id", "vehicleUnitId", "pickupAt", "returnAt", "bookingId", "createdAt"
    ) VALUES (
      ${newOccupancyId("vuo_bk")},
      ${input.vehicleUnitId},
      ${input.pickupAt},
      ${input.returnAt},
      ${input.bookingId},
      NOW()
    )
  `;
}

/** Re-link an existing hold occupancy row to the confirmed booking (same period/unit). */
export async function convertHoldOccupancyToBooking(
  db: OccupancyDb,
  reservationHoldId: string,
  bookingId: string,
): Promise<boolean> {
  const updated = await db.$executeRaw`
    UPDATE "VehicleUnitOccupancy"
    SET "bookingId" = ${bookingId},
        "reservationHoldId" = NULL
    WHERE "reservationHoldId" = ${reservationHoldId}
  `;

  return Number(updated) > 0;
}

export async function deleteOccupancyForBooking(db: OccupancyDb, bookingId: string): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "VehicleUnitOccupancy" WHERE "bookingId" = ${bookingId}
  `;
}

export async function deleteOccupancyForHold(db: OccupancyDb, reservationHoldId: string): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "VehicleUnitOccupancy" WHERE "reservationHoldId" = ${reservationHoldId}
  `;
}

export { reconcileMismatchedBookingOccupancies } from "@/lib/vehicle-unit-occupancy/reconcileBookingOccupancy";
export type { ReconcileBookingOccupancyResult } from "@/lib/vehicle-unit-occupancy/reconcileBookingOccupancy";
export { syncBookingOccupancyToAssignedUnit } from "@/lib/vehicle-unit-occupancy/syncBookingOccupancy";
export type { SyncBookingOccupancyInput } from "@/lib/vehicle-unit-occupancy/syncBookingOccupancy";
