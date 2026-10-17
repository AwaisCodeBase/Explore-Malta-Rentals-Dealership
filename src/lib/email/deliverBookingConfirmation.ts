import { prisma } from "@/lib/prisma";

import { sendBookingConfirmation } from "./sendBookingConfirmation";
import type { SendBookingConfirmationResult } from "./types";

const QUEUED_RETRY_AFTER_MS = 2 * 60 * 1000;

/**
 * Sends the booking confirmation email at most once.
 * Callers should invoke this after the booking is ready to confirm
 * (no online payment due, or Stripe has marked the payment paid).
 */
export async function deliverBookingConfirmationIfNeeded(
  bookingId: string,
): Promise<SendBookingConfirmationResult> {
  const staleQueuedBefore = new Date(Date.now() - QUEUED_RETRY_AFTER_MS);

  const claimed = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      OR: [
        { confirmationEmailStatus: { in: ["NOT_SENT", "FAILED"] } },
        {
          confirmationEmailStatus: "QUEUED",
          updatedAt: { lt: staleQueuedBefore },
        },
      ],
    },
    data: { confirmationEmailStatus: "QUEUED" },
  });

  if (claimed.count === 0) {
    return { success: true, deliveryMode: "already_sent" };
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, reason: "template_build_failed" };
  }

  try {
    const emailResult = await sendBookingConfirmation(booking);
    await prisma.booking.update({
      where: { id: bookingId },
      data: emailResult.success
        ? {
            confirmationEmailStatus: "SENT",
            confirmationEmailSentAt: new Date(),
          }
        : {
            confirmationEmailStatus: "FAILED",
            confirmationEmailSentAt: null,
          },
    });

    if (!emailResult.success) {
      console.error("[email] Confirmation email was not sent", {
        bookingId,
        bookingReference: booking.bookingReference,
        reason: emailResult.reason,
      });
    } else {
      console.log("[email] Confirmation email sent", {
        bookingId,
        bookingReference: booking.bookingReference,
        deliveryMode: emailResult.deliveryMode,
      });
    }

    return emailResult;
  } catch (error) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        confirmationEmailStatus: "FAILED",
        confirmationEmailSentAt: null,
      },
    }).catch(() => null);

    console.error("[email] Confirmation email delivery threw", { bookingId, error });
    return { success: false, reason: "send_failed", cause: error };
  }
}
