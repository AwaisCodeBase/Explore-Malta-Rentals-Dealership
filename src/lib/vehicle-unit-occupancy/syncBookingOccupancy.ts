import type { Prisma } from "@/generated/prisma/index";

import {
  deleteOccupancyForBooking,
  insertBookingOccupancy,
  type OccupancyPeriodInput,
} from "@/lib/vehicle-unit-occupancy";

type SyncBookingOccupancyDb = Pick<
  Prisma.TransactionClient,
  "$executeRaw" | "$executeRawUnsafe" | "vehicleUnitOccupancy"
>;

export type SyncBookingOccupancyInput = OccupancyPeriodInput & {
  bookingId: string;
};

/** Aligns the booking calendar lock with the booking's assigned vehicle unit. */
export async function syncBookingOccupancyToAssignedUnit(
  db: SyncBookingOccupancyDb,
  input: SyncBookingOccupancyInput,
): Promise<void> {
  const occupancy = await db.vehicleUnitOccupancy.findUnique({
    where: { bookingId: input.bookingId },
    select: { vehicleUnitId: true },
  });

  if (occupancy?.vehicleUnitId === input.vehicleUnitId) {
    return;
  }

  await deleteOccupancyForBooking(db, input.bookingId);
  await insertBookingOccupancy(db, {
    vehicleUnitId: input.vehicleUnitId,
    pickupAt: input.pickupAt,
    returnAt: input.returnAt,
    bookingId: input.bookingId,
  });
}
