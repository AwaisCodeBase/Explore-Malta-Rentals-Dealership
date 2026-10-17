import type { BookingStatus } from "@/generated/prisma/index";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/availability/types";
import { prisma } from "@/lib/prisma";
import {
  deleteOccupancyForBooking,
  isVehicleUnitOccupancyExclusionError,
  syncBookingOccupancyToAssignedUnit,
} from "@/lib/vehicle-unit-occupancy";

export type ReconcileBookingOccupancyResult = {
  scanned: number;
  repaired: number;
  staleLocksReleased: number;
  conflicts: Array<{ bookingReference: string; message: string }>;
};

export async function reconcileMismatchedBookingOccupancies(): Promise<ReconcileBookingOccupancyResult> {
  const bookings = await prisma.booking.findMany({
    where: {
      vehicleUnitId: { not: null },
      status: { in: [...BLOCKING_BOOKING_STATUSES] as BookingStatus[] },
    },
    select: {
      id: true,
      bookingReference: true,
      vehicleUnitId: true,
      pickupDateTime: true,
      returnDateTime: true,
      unitOccupancy: { select: { vehicleUnitId: true } },
    },
    orderBy: { pickupDateTime: "asc" },
  });

  const result: ReconcileBookingOccupancyResult = {
    scanned: bookings.length,
    repaired: 0,
    staleLocksReleased: 0,
    conflicts: [],
  };

  for (const booking of bookings) {
    const assignedUnitId = booking.vehicleUnitId;
    if (!assignedUnitId) {
      continue;
    }

    const occupancyUnitId = booking.unitOccupancy?.vehicleUnitId ?? null;
    if (occupancyUnitId === assignedUnitId) {
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await syncBookingOccupancyToAssignedUnit(tx, {
          bookingId: booking.id,
          vehicleUnitId: assignedUnitId,
          pickupAt: booking.pickupDateTime,
          returnAt: booking.returnDateTime,
        });
      });
      result.repaired += 1;
    } catch (error) {
      if (
        isVehicleUnitOccupancyExclusionError(error) &&
        occupancyUnitId &&
        occupancyUnitId !== assignedUnitId
      ) {
        await prisma.$transaction(async (tx) => {
          await deleteOccupancyForBooking(tx, booking.id);
        });
        result.staleLocksReleased += 1;
        result.conflicts.push({
          bookingReference: booking.bookingReference,
          message:
            "Released stale calendar lock on the previous unit. Assigned unit still has an overlapping reservation and needs manual review.",
        });
        continue;
      }

      result.conflicts.push({
        bookingReference: booking.bookingReference,
        message: isVehicleUnitOccupancyExclusionError(error)
          ? "Selected unit already has an overlapping calendar lock"
          : error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  return result;
}
