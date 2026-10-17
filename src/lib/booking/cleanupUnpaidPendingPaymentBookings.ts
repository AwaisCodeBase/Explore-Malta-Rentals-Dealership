import type { Prisma } from "@/generated/prisma/index";
import { releaseUnpaidBooking } from "@/lib/booking/releaseUnpaidBooking";
import { prisma } from "@/lib/prisma";

/** Matches Stripe Checkout session expiry in payment-service.ts */
export const UNPAID_BOOKING_CHECKOUT_WINDOW_MS = 30 * 60 * 1000;

export type CleanupUnpaidPendingPaymentBookingsResult = {
  candidatesFound: number;
  bookingsReleased: number;
  errors: Array<{ bookingId?: string; message: string }>;
};

type CleanupDb = typeof prisma | Prisma.TransactionClient;

/**
 * Cancels PENDING_PAYMENT bookings whose Stripe checkout window has expired
 * and releases their vehicle occupancy. Safe to run repeatedly.
 */
export async function cleanupUnpaidPendingPaymentBookings(
  options: { db?: typeof prisma; now?: Date; olderThanMs?: number } = {},
): Promise<CleanupUnpaidPendingPaymentBookingsResult> {
  const db = options.db ?? prisma;
  const now = options.now ?? new Date();
  const olderThanMs = options.olderThanMs ?? UNPAID_BOOKING_CHECKOUT_WINDOW_MS;
  const cutoff = new Date(now.getTime() - olderThanMs);

  const result: CleanupUnpaidPendingPaymentBookingsResult = {
    candidatesFound: 0,
    bookingsReleased: 0,
    errors: [],
  };

  const candidates = await db.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      paymentStatus: { in: ["PENDING", "FAILED"] },
      createdAt: { lte: cutoff },
      totalDueOnline: { gt: 0 },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  result.candidatesFound = candidates.length;

  for (const candidate of candidates) {
    try {
      if (db === prisma) {
        const released = await prisma.$transaction(async (tx) => {
          const outcome = await releaseUnpaidBooking(tx, candidate.id, {
            actorLabel: "unpaid-booking-sweeper",
            note: "Auto-cancelled after Stripe checkout window expired without payment",
          });
          return outcome.ok && outcome.released;
        });
        if (released) result.bookingsReleased += 1;
      } else {
        const outcome = await releaseUnpaidBooking(db, candidate.id, {
          actorLabel: "unpaid-booking-sweeper",
          note: "Auto-cancelled after Stripe checkout window expired without payment",
        });
        if (outcome.ok && outcome.released) result.bookingsReleased += 1;
      }
    } catch (error) {
      result.errors.push({
        bookingId: candidate.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
