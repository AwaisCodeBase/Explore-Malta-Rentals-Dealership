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

/**
 * Aligns the active calendar lock with the assigned unit.
 * An existing lock on that unit is left in place, including any earlier intervals on other units.
 * Moving the lock deletes every occupancy for the booking, which is only safe before a replacement history exists.
 */
export async function syncBookingOccupancyToAssignedUnit(
  db: SyncBookingOccupancyDb,
  input: SyncBookingOccupancyInput,
): Promise<void> {
  const occupancy = await db.vehicleUnitOccupancy.findFirst({
    where: {
      bookingId: input.bookingId,
      vehicleUnitId: input.vehicleUnitId,
    },
    select: { id: true },
  });

  if (occupancy) {
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
