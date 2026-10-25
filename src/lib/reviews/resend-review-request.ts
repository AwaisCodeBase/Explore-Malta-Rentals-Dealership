import { prisma } from "@/lib/prisma";
import { isValidCustomerEmail, normalizeCustomerEmail } from "@/lib/reviews/customer-email";
import {
  deliverReviewRequestEmail,
  type ReviewEmailSender,
} from "@/lib/reviews/deliver-review-request-email";
import { REVIEW_REQUEST_STALE_MS } from "@/lib/reviews/review-request-timing";

export type ResendReviewRequestResult =
  | { ok: true; deliveryMode: "resend" | "development_console" }
  | {
      ok: false;
      reason: "not_found" | "invalid_status" | "invalid_email" | "in_progress" | "send_failed";
      message: string;
    };

function isStaleProcessing(processingStartedAt: Date | null, now: Date): boolean {
  if (!processingStartedAt) return true;
  return now.getTime() - processingStartedAt.getTime() >= REVIEW_REQUEST_STALE_MS;
}

/**
 * Sends the review email again from the booking stored in the database.
 * Does not change rental, vehicle, payment, or the original sentAt timestamp.
 */
export async function resendBookingReviewRequest(
  bookingId: string,
  adminUserId: string,
  options?: { send?: ReviewEmailSender; now?: Date },
): Promise<ResendReviewRequestResult> {
  const now = options?.now ?? new Date();
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      bookingReference: true,
      customerEmail: true,
      customerFullName: true,
      vehicleNameSnapshot: true,
    },
  });

  if (!booking) {
    return { ok: false, reason: "not_found", message: "Booking not found" };
  }
  if (booking.status !== "RETURNED" && booking.status !== "COMPLETED") {
    return {
      ok: false,
      reason: "invalid_status",
      message: "Review requests can only be sent after the vehicle has been returned.",
    };
  }

  const email = normalizeCustomerEmail(booking.customerEmail);
  if (!isValidCustomerEmail(email)) {
    return {
      ok: false,
      reason: "invalid_email",
      message: "This booking does not have a valid customer email. The review request was not sent.",
    };
  }

  const existing = await prisma.bookingReviewRequest.findUnique({ where: { bookingId } });
  if (
    existing?.status === "PROCESSING" &&
    !isStaleProcessing(existing.processingStartedAt, now)
  ) {
    return {
      ok: false,
      reason: "in_progress",
      message: "A review email is already being sent. Refresh the booking and try again.",
    };
  }

  const previousSentAt = existing?.sentAt ?? null;
  const previousManualCount = existing?.manualResendCount ?? 0;

  if (!existing) {
    try {
      await prisma.bookingReviewRequest.create({
        data: {
          bookingId,
          status: "PROCESSING",
          scheduledAt: now,
          processingStartedAt: now,
          attempts: 1,
        },
      });
    } catch (error) {
      if (!isUniqueConstraint(error)) throw error;
      return {
        ok: false,
        reason: "in_progress",
        message: "A review email is already being sent. Refresh the booking and try again.",
      };
    }
  } else {
    const claimed = await prisma.bookingReviewRequest.updateMany({
      where: {
        id: existing.id,
        status: existing.status,
        updatedAt: existing.updatedAt,
      },
      data: {
        status: "PROCESSING",
        processingStartedAt: now,
      },
    });
    if (claimed.count === 0) {
      return {
        ok: false,
        reason: "in_progress",
        message: "A review email is already being sent. Refresh the booking and try again.",
      };
    }
  }

  const delivery = await deliverReviewRequestEmail(
    {
      id: booking.id,
      bookingReference: booking.bookingReference,
      customerEmail: email,
      customerFullName: booking.customerFullName,
      vehicleName: booking.vehicleNameSnapshot,
    },
    { send: options?.send, initiatedByAdminId: adminUserId, now },
  );

  if (!delivery.ok) {
    await prisma.bookingReviewRequest.update({
      where: { bookingId },
      data: {
        status: previousSentAt ? "SENT" : "FAILED",
        lastError: delivery.message,
        processingStartedAt: null,
      },
    });
    return { ok: false, reason: "send_failed", message: delivery.message };
  }

  await prisma.bookingReviewRequest.update({
    where: { bookingId },
    data: {
      status: "SENT",
      sentAt: previousSentAt ?? now,
      lastSentAt: now,
      lastError: null,
      skippedReason: null,
      processingStartedAt: null,
      manualResendCount: previousSentAt ? previousManualCount + 1 : previousManualCount,
      lastManualResendAt: now,
      lastManualResendByAdminId: adminUserId,
    },
  });

  return { ok: true, deliveryMode: delivery.deliveryMode };
}

function isUniqueConstraint(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002",
  );
}
