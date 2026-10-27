import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { getAdminBookingById } from "@/lib/admin/bookings/getAdminBookingById";
import type { CancelBookingInput } from "@/lib/admin/bookings/lifecycle/booking-lifecycle-schema";
import { recordBookingStatusChange } from "@/lib/admin/bookings/lifecycle/recordBookingStatusChange";
import { notifyBookingCancelled } from "@/lib/admin/notifications";
import { restoreLoyaltyCreditForUnpaidBooking } from "@/lib/loyalty/loyalty-credit";
import { deleteOccupancyForBooking } from "@/lib/vehicle-unit-occupancy";
import { prisma } from "@/lib/prisma";

export type CancelBookingResult =
  | { ok: true; booking: AdminBookingDetail }
  | {
      ok: false;
      reason: "not_found" | "invalid_status";
    };

export async function cancelBooking(
  bookingId: string,
  input: CancelBookingInput,
  adminUserId: string,
): Promise<CancelBookingResult> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      securityDepositStatus: true,
      vehicleUnitId: true,
    },
  });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  // A credit redeemed on a confirmed booking stays redeemed if that booking is later cancelled.
  // A pending booking never became a completed sale, so cancelling it returns the credit.
  if (existing.status !== "CONFIRMED" && existing.status !== "PENDING_PAYMENT") {
    return { ok: false, reason: "invalid_status" };
  }

  let nextPaymentStatus = existing.paymentStatus;
  if (input.refundPayment && existing.paymentStatus === "PAID") {
    nextPaymentStatus = "REFUNDED";
  }

  let nextDepositStatus = existing.securityDepositStatus;
  if (input.depositOutcome === "REFUNDED" && existing.securityDepositStatus === "COLLECTED") {
    nextDepositStatus = "REFUNDED";
  } else if (input.depositOutcome === "DEDUCTED" && existing.securityDepositStatus === "COLLECTED") {
    nextDepositStatus = "DEDUCTED";
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        paymentStatus: nextPaymentStatus,
        securityDepositStatus: nextDepositStatus,
        depositRefundAmount:
          input.depositOutcome === "REFUNDED" ? (input.depositRefundAmount ?? null) : null,
        depositDeductionAmount:
          input.depositOutcome === "DEDUCTED" ? (input.depositDeductionAmount ?? null) : null,
        depositDeductionReason:
          input.depositOutcome === "DEDUCTED" ? input.depositDeductionReason?.trim() || null : null,
      },
    });

    if (existing.vehicleUnitId) {
      await tx.vehicleUnit.update({
        where: { id: existing.vehicleUnitId },
        data: { status: "AVAILABLE" },
      });
    }

    await deleteOccupancyForBooking(tx, bookingId);

    if (existing.status === "PENDING_PAYMENT") {
      await restoreLoyaltyCreditForUnpaidBooking(tx, bookingId);
    }

    await recordBookingStatusChange(tx, {
      bookingId,
      oldStatus: existing.status,
      newStatus: "CANCELLED",
      adminUserId,
      note: input.note,
    });
  });

  const booking = await getAdminBookingById(bookingId);
  if (!booking) {
    return { ok: false, reason: "not_found" };
  }

  await notifyBookingCancelled(booking, adminUserId);

  return { ok: true, booking };
}
