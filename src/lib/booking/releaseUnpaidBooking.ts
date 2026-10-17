import type { BookingStatus, Prisma } from "@/generated/prisma/index";
import { deleteOccupancyForBooking } from "@/lib/vehicle-unit-occupancy";

type ReleaseDb = Pick<
  Prisma.TransactionClient,
  "booking" | "vehicleUnit" | "bookingStatusHistory" | "$executeRaw" | "$executeRawUnsafe"
>;

export type ReleaseUnpaidBookingResult =
  | { ok: true; released: true; previousStatus: BookingStatus }
  | { ok: true; released: false; reason: "not_found" | "not_releasable" }
  | { ok: false; error: string };

const RELEASABLE_STATUSES: BookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED"];

/**
 * Cancels an unpaid online booking and frees the vehicle unit occupancy.
 * Idempotent: already-cancelled bookings are reported as not_releasable.
 */
export async function releaseUnpaidBooking(
  db: ReleaseDb,
  bookingId: string,
  options: {
    note?: string;
    actorLabel?: string;
    /** When true, also release legacy CONFIRMED+unpaid online bookings. */
    allowConfirmedUnpaid?: boolean;
  } = {},
): Promise<ReleaseUnpaidBookingResult> {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalDueOnline: true,
        vehicleUnitId: true,
      },
    });

    if (!booking) {
      return { ok: true, released: false, reason: "not_found" };
    }

    const totalDueOnline =
      typeof booking.totalDueOnline === "number"
        ? booking.totalDueOnline
        : booking.totalDueOnline.toNumber();

    const isPendingPayment = booking.status === "PENDING_PAYMENT";
    const isLegacyConfirmedUnpaid =
      options.allowConfirmedUnpaid === true &&
      booking.status === "CONFIRMED" &&
      totalDueOnline > 0 &&
      booking.paymentStatus !== "PAID" &&
      booking.paymentStatus !== "REFUNDED";

    if (!isPendingPayment && !isLegacyConfirmedUnpaid) {
      return { ok: true, released: false, reason: "not_releasable" };
    }

    if (!RELEASABLE_STATUSES.includes(booking.status)) {
      return { ok: true, released: false, reason: "not_releasable" };
    }

    const previousStatus = booking.status;
    const note =
      options.note?.trim() ||
      "Released unpaid online booking after payment failure or checkout expiry";

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        paymentStatus: booking.paymentStatus === "PAID" ? "PAID" : "FAILED",
      },
    });

    if (booking.vehicleUnitId) {
      await db.vehicleUnit.update({
        where: { id: booking.vehicleUnitId },
        data: { status: "AVAILABLE" },
      });
    }

    await deleteOccupancyForBooking(db, bookingId);

    await db.bookingStatusHistory.create({
      data: {
        bookingId,
        oldStatus: previousStatus,
        newStatus: "CANCELLED",
        note: options.actorLabel ? `[${options.actorLabel}] ${note}` : note,
        changedByAdminId: null,
      },
    });

    return { ok: true, released: true, previousStatus };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
