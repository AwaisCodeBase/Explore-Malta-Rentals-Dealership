import type { Prisma } from "@/generated/prisma/index";
import { notifyPaymentReceived } from "@/lib/admin/notifications";
import { prisma } from "@/lib/prisma";
import { deliverBookingConfirmationIfNeeded } from "@/lib/email/deliverBookingConfirmation";

type BookingDb = Pick<Prisma.TransactionClient, "booking" | "bookingStatusHistory">;

/**
 * Marks the booking paid and promotes a soft-reserve to Confirmed.
 * Safe to call repeatedly: already-confirmed/cancelled bookings are left as-is.
 * Returns whether payment status newly transitioned to PAID.
 */
export async function markBookingPaidAndConfirmIfPending(
  db: BookingDb,
  bookingId: string,
  note: string,
): Promise<{ paymentNewlyPaid: boolean }> {
  const paid = await db.booking.updateMany({
    where: { id: bookingId, paymentStatus: { not: "PAID" } },
    data: { paymentStatus: "PAID" },
  });

  const confirmed = await db.booking.updateMany({
    where: { id: bookingId, status: "PENDING_PAYMENT" },
    data: { status: "CONFIRMED", paymentStatus: "PAID" },
  });

  if (confirmed.count > 0) {
    await db.bookingStatusHistory.create({
      data: {
        bookingId,
        oldStatus: "PENDING_PAYMENT",
        newStatus: "CONFIRMED",
        note,
        changedByAdminId: null,
      },
    });
  }

  return { paymentNewlyPaid: paid.count > 0 };
}

/**
 * Marks the booking and Stripe payment as paid, confirms a pending booking,
 * then sends the confirmation email if it has not already been delivered.
 * Safe to call from webhooks, the success-page verifier, and reconciliation.
 */
export async function syncPaidBookingAndSendConfirmation(input: {
  bookingId: string;
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
}): Promise<void> {
  let paymentNewlyPaid = false;

  await prisma.$transaction(async (tx) => {
    await tx.stripePayment.updateMany({
      where: { bookingId: input.bookingId, stripeStatus: { not: "SUCCEEDED" } },
      data: {
        stripeStatus: "SUCCEEDED",
        updatedAt: new Date(),
        ...(input.paymentIntentId ? { stripePaymentIntentId: input.paymentIntentId } : {}),
        ...(input.checkoutSessionId ? { stripeCheckoutSessionId: input.checkoutSessionId } : {}),
      },
    });

    const result = await markBookingPaidAndConfirmIfPending(
      tx,
      input.bookingId,
      "[stripe] Payment succeeded — booking confirmed",
    );
    paymentNewlyPaid = result.paymentNewlyPaid;
  });

  await deliverBookingConfirmationIfNeeded(input.bookingId);

  if (paymentNewlyPaid) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        bookingReference: true,
        customerFullName: true,
        vehicleNameSnapshot: true,
      },
    });
    if (booking) {
      await notifyPaymentReceived({
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        customerFullName: booking.customerFullName,
        vehicleName: booking.vehicleNameSnapshot,
      });
    }
  }
}
