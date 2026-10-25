import type { Prisma } from "@/generated/prisma/index";

import { BLOCKING_BOOKING_STATUSES } from "@/lib/availability/types";

export type ExtensionConflictWindow = {
  pickupAt: Date;
  returnAt: Date;
};

type ConflictDb = {
  vehicleUnitOccupancy: {
    findMany: Prisma.TransactionClient["vehicleUnitOccupancy"]["findMany"];
  };
  booking: {
    findMany: Prisma.TransactionClient["booking"]["findMany"];
  };
  reservationHold: {
    findMany: Prisma.TransactionClient["reservationHold"]["findMany"];
  };
};

/**
 * Overlap for the assigned unit over [requestedStart, requestedEnd), excluding this booking.
 * Same inequality as buildOverlappingRangeWhere: start < existingEnd AND end > existingStart.
 */
export async function findUnitExtensionConflict(
  db: ConflictDb,
  input: {
    vehicleUnitId: string;
    bookingId: string;
    requestedStart: Date;
    requestedEnd: Date;
    now?: Date;
  },
): Promise<ExtensionConflictWindow | null> {
  const { vehicleUnitId, bookingId, requestedStart, requestedEnd } = input;
  const now = input.now ?? new Date();

  const occupancy = await db.vehicleUnitOccupancy.findMany({
    where: {
      vehicleUnitId,
      pickupAt: { lt: requestedEnd },
      returnAt: { gt: requestedStart },
      OR: [{ bookingId: null }, { bookingId: { not: bookingId } }],
    },
    select: { pickupAt: true, returnAt: true },
    orderBy: { pickupAt: "asc" },
    take: 1,
  });

  if (occupancy[0]) {
    return { pickupAt: occupancy[0].pickupAt, returnAt: occupancy[0].returnAt };
  }

  const booking = await db.booking.findMany({
    where: {
      vehicleUnitId,
      id: { not: bookingId },
      status: { in: [...BLOCKING_BOOKING_STATUSES] },
      pickupDateTime: { lt: requestedEnd },
      returnDateTime: { gt: requestedStart },
    },
    select: { pickupDateTime: true, returnDateTime: true },
    orderBy: { pickupDateTime: "asc" },
    take: 1,
  });

  if (booking[0]) {
    return { pickupAt: booking[0].pickupDateTime, returnAt: booking[0].returnDateTime };
  }

  const hold = await db.reservationHold.findMany({
    where: {
      vehicleUnitId,
      status: "ACTIVE",
      expiresAt: { gt: now },
      pickupDateTime: { lt: requestedEnd },
      returnDateTime: { gt: requestedStart },
    },
    select: { pickupDateTime: true, returnDateTime: true },
    orderBy: { pickupDateTime: "asc" },
    take: 1,
  });

  if (hold[0]) {
    return { pickupAt: hold[0].pickupDateTime, returnAt: hold[0].returnDateTime };
  }

  return null;
}

/** Other locks on this unit that end after `after` and start before `before`. Excludes this booking. */
export async function listUnitExtensionBlocks(
  db: ConflictDb,
  input: {
    vehicleUnitId: string;
    bookingId: string;
    after: Date;
    before: Date;
    now?: Date;
  },
): Promise<ExtensionConflictWindow[]> {
  const now = input.now ?? new Date();
  const [occupancy, bookings, holds] = await Promise.all([
    db.vehicleUnitOccupancy.findMany({
      where: {
        vehicleUnitId: input.vehicleUnitId,
        returnAt: { gt: input.after },
        pickupAt: { lt: input.before },
        OR: [{ bookingId: null }, { bookingId: { not: input.bookingId } }],
      },
      select: { pickupAt: true, returnAt: true },
    }),
    db.booking.findMany({
      where: {
        vehicleUnitId: input.vehicleUnitId,
        id: { not: input.bookingId },
        status: { in: [...BLOCKING_BOOKING_STATUSES] },
        returnDateTime: { gt: input.after },
        pickupDateTime: { lt: input.before },
      },
      select: { pickupDateTime: true, returnDateTime: true },
    }),
    db.reservationHold.findMany({
      where: {
        vehicleUnitId: input.vehicleUnitId,
        status: "ACTIVE",
        expiresAt: { gt: now },
        returnDateTime: { gt: input.after },
        pickupDateTime: { lt: input.before },
      },
      select: { pickupDateTime: true, returnDateTime: true },
    }),
  ]);

  return [
    ...occupancy.map((row) => ({ pickupAt: row.pickupAt, returnAt: row.returnAt })),
    ...bookings.map((row) => ({ pickupAt: row.pickupDateTime, returnAt: row.returnDateTime })),
    ...holds.map((row) => ({ pickupAt: row.pickupDateTime, returnAt: row.returnDateTime })),
  ];
}
