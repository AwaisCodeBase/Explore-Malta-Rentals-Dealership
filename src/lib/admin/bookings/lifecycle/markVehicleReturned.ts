import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { getAdminBookingById } from "@/lib/admin/bookings/getAdminBookingById";
import type { MarkVehicleReturnedInput } from "@/lib/admin/bookings/lifecycle/booking-lifecycle-schema";
import { recordBookingStatusChange } from "@/lib/admin/bookings/lifecycle/recordBookingStatusChange";
import { prisma } from "@/lib/prisma";

class ReturnStateError extends Error {
  constructor(readonly reason: "invalid_status" | "missing_vehicle_unit") {
    super(reason);
  }
}

export type MarkVehicleReturnedResult =
  | { ok: true; booking: AdminBookingDetail }
  | {
      ok: false;
      reason: "not_found" | "invalid_status" | "missing_vehicle_unit";
    };

export async function markVehicleReturned(
  bookingId: string,
  input: MarkVehicleReturnedInput,
  adminUserId: string,
): Promise<MarkVehicleReturnedResult> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      vehicleUnitId: true,
    },
  });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  if (existing.status !== "VEHICLE_HANDED_OVER") {
    return { ok: false, reason: "invalid_status" };
  }

  if (!existing.vehicleUnitId) {
    return { ok: false, reason: "missing_vehicle_unit" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Booking" WHERE "id" = ${bookingId} FOR UPDATE
      `;
      const current = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { status: true, vehicleUnitId: true },
      });
      if (!current || current.status !== "VEHICLE_HANDED_OVER") {
        throw new ReturnStateError("invalid_status");
      }
      if (!current.vehicleUnitId) {
        throw new ReturnStateError("missing_vehicle_unit");
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "RETURNED",
          returnRecordedAt: input.returnRecordedAt,
          returnNotes: input.returnNotes?.trim() || null,
        },
      });

      await tx.vehicleUnit.update({
        where: { id: current.vehicleUnitId },
        data: { status: input.unitStatusAfterReturn },
      });

      await recordBookingStatusChange(tx, {
        bookingId,
        oldStatus: existing.status,
        newStatus: "RETURNED",
        adminUserId,
        note: input.note,
      });
    });
  } catch (error) {
    if (error instanceof ReturnStateError) {
      return { ok: false, reason: error.reason };
    }
    throw error;
  }

  const booking = await getAdminBookingById(bookingId);
  if (!booking) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, booking };
}
