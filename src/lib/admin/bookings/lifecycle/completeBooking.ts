import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { getAdminBookingById } from "@/lib/admin/bookings/getAdminBookingById";
import type { CompleteBookingInput } from "@/lib/admin/bookings/lifecycle/booking-lifecycle-schema";
import { recordBookingStatusChange } from "@/lib/admin/bookings/lifecycle/recordBookingStatusChange";
import { deleteOccupancyForBooking } from "@/lib/vehicle-unit-occupancy";
import { prisma } from "@/lib/prisma";

class CompleteStateError extends Error {
  constructor(readonly reason: "invalid_status" | "missing_vehicle_unit") {
    super(reason);
  }
}

export type CompleteBookingResult =
  | { ok: true; booking: AdminBookingDetail }
  | {
      ok: false;
      reason: "not_found" | "invalid_status" | "missing_vehicle_unit";
    };

export async function completeBooking(
  bookingId: string,
  input: CompleteBookingInput,
  adminUserId: string,
): Promise<CompleteBookingResult> {
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

  if (existing.status !== "RETURNED") {
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
      if (!current || current.status !== "RETURNED") {
        throw new CompleteStateError("invalid_status");
      }
      if (!current.vehicleUnitId) {
        throw new CompleteStateError("missing_vehicle_unit");
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          securityDepositStatus: input.depositOutcome,
          depositRefundAmount:
            input.depositOutcome === "REFUNDED" ? (input.depositRefundAmount ?? null) : null,
          depositDeductionAmount:
            input.depositOutcome === "DEDUCTED" ? (input.depositDeductionAmount ?? null) : null,
          depositDeductionReason:
            input.depositOutcome === "DEDUCTED" ? input.depositDeductionReason?.trim() || null : null,
          completionNotes: input.completionNotes?.trim() || null,
        },
      });

      await tx.vehicleUnit.update({
        where: { id: current.vehicleUnitId },
        data: { status: input.unitStatusAfterCompletion },
      });

      await deleteOccupancyForBooking(tx, bookingId);

      await recordBookingStatusChange(tx, {
        bookingId,
        oldStatus: existing.status,
        newStatus: "COMPLETED",
        adminUserId,
        note: input.note,
      });
    });
  } catch (error) {
    if (error instanceof CompleteStateError) {
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
