import type { BookingStatus } from "@/generated/prisma/index";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { getAdminBookingById } from "@/lib/admin/bookings/getAdminBookingById";
import type { RestoreCancelledBookingInput } from "@/lib/admin/bookings/lifecycle/booking-lifecycle-schema";
import { recordBookingStatusChange } from "@/lib/admin/bookings/lifecycle/recordBookingStatusChange";
import {
  insertBookingOccupancy,
  isVehicleUnitOccupancyExclusionError,
} from "@/lib/vehicle-unit-occupancy";
import { prisma } from "@/lib/prisma";

export type RestoreCancelledBookingResult =
  | { ok: true; booking: AdminBookingDetail }
  | {
      ok: false;
      reason:
        | "not_found"
        | "invalid_status"
        | "invalid_previous_status"
        | "missing_vehicle_unit"
        | "occupancy_conflict";
    };

function isRestorablePreviousStatus(
  status: BookingStatus | null | undefined,
): status is "CONFIRMED" | "PENDING_PAYMENT" {
  return status === "CONFIRMED" || status === "PENDING_PAYMENT";
}

export async function restoreCancelledBooking(
  bookingId: string,
  input: RestoreCancelledBookingInput,
  adminUserId: string,
): Promise<RestoreCancelledBookingResult> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      vehicleUnitId: true,
      pickupDateTime: true,
      returnDateTime: true,
      unitOccupancy: { select: { id: true } },
      statusHistory: {
        where: { newStatus: "CANCELLED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { oldStatus: true },
      },
    },
  });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  if (existing.status !== "CANCELLED") {
    return { ok: false, reason: "invalid_status" };
  }

  const previousStatus = existing.statusHistory[0]?.oldStatus ?? "CONFIRMED";
  if (!isRestorablePreviousStatus(previousStatus)) {
    return { ok: false, reason: "invalid_previous_status" };
  }

  if (!existing.vehicleUnitId) {
    return { ok: false, reason: "missing_vehicle_unit" };
  }

  const unit = await prisma.vehicleUnit.findUnique({
    where: { id: existing.vehicleUnitId },
    select: { id: true },
  });
  if (!unit) {
    return { ok: false, reason: "missing_vehicle_unit" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: previousStatus },
      });

      if (!existing.unitOccupancy) {
        await insertBookingOccupancy(tx, {
          vehicleUnitId: existing.vehicleUnitId!,
          pickupAt: existing.pickupDateTime,
          returnAt: existing.returnDateTime,
          bookingId,
        });
      }

      await recordBookingStatusChange(tx, {
        bookingId,
        oldStatus: "CANCELLED",
        newStatus: previousStatus,
        adminUserId,
        note: input.note?.trim() || "Restored after accidental cancellation",
      });
    });
  } catch (error) {
    if (isVehicleUnitOccupancyExclusionError(error)) {
      return { ok: false, reason: "occupancy_conflict" };
    }
    throw error;
  }

  const booking = await getAdminBookingById(bookingId);
  if (!booking) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, booking };
}
