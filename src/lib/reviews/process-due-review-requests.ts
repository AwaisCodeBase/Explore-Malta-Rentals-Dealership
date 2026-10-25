import { Prisma } from "@/generated/prisma/index";

import { prisma } from "@/lib/prisma";
import { isValidCustomerEmail, normalizeCustomerEmail } from "@/lib/reviews/customer-email";
import {
  defaultReviewEmailSender,
  deliverReviewRequestEmail,
  type ReviewEmailSender,
} from "@/lib/reviews/deliver-review-request-email";
import { writeReviewEmailLogNow } from "@/lib/reviews/review-email-log";
import {
  REVIEW_REQUEST_MAX_ATTEMPTS,
  REVIEW_REQUEST_STALE_MS,
  reviewRequestDelayMs,
} from "@/lib/reviews/review-request-timing";

export type ProcessDueReviewRequestsResult = {
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
};

type ClaimedReviewRequest = {
  id: string;
  bookingId: string;
  attempts: number;
  sentAt: Date | null;
  scheduledAt: Date;
};

/**
 * Sends due review requests that were stored when a booking was marked returned.
 * Safe to run from more than one server: each due row is claimed with a row lock.
 */
export async function processDueReviewRequests(options?: {
  now?: Date;
  limit?: number;
  send?: ReviewEmailSender;
  bookingId?: string;
}): Promise<ProcessDueReviewRequestsResult> {
  const now = options?.now ?? new Date();
  const limit = options?.limit ?? 20;
  const send = options?.send ?? defaultReviewEmailSender;
  const result: ProcessDueReviewRequestsResult = { claimed: 0, sent: 0, failed: 0, skipped: 0 };

  for (let index = 0; index < limit; index += 1) {
    const claimed = await claimNextDueReviewRequest(now, options?.bookingId);
    if (!claimed) break;
    if (claimed === "closed") {
      result.failed += 1;
      continue;
    }

    result.claimed += 1;
    const outcome = await sendClaimedReviewRequest(claimed, now, send);
    result[outcome] += 1;
  }

  return result;
}

async function claimNextDueReviewRequest(
  now: Date,
  bookingId?: string,
): Promise<ClaimedReviewRequest | "closed" | null> {
  const staleBefore = new Date(now.getTime() - REVIEW_REQUEST_STALE_MS);
  const bookingFilter = bookingId ? Prisma.sql`AND "bookingId" = ${bookingId}` : Prisma.empty;

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "BookingReviewRequest"
      WHERE (
        (
          "status" = 'PENDING'::"ReviewRequestStatus"
          AND "scheduledAt" <= ${now}
        ) OR (
          "status" = 'PROCESSING'::"ReviewRequestStatus"
          AND "processingStartedAt" IS NOT NULL
          AND "processingStartedAt" <= ${staleBefore}
        )
      )
      ${bookingFilter}
      ORDER BY "scheduledAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    const id = rows[0]?.id;
    if (!id) return null;

    const current = await tx.bookingReviewRequest.findUnique({ where: { id } });
    if (!current) return null;

    if (current.status === "PROCESSING" && current.attempts >= REVIEW_REQUEST_MAX_ATTEMPTS) {
      await tx.bookingReviewRequest.update({
        where: { id },
        data: {
          status: "FAILED",
          processingStartedAt: null,
          lastError: current.lastError ?? "Review email was not confirmed after the last attempt.",
        },
      });
      return "closed";
    }

    const updated = await tx.bookingReviewRequest.update({
      where: { id },
      data: {
        status: "PROCESSING",
        processingStartedAt: now,
        attempts: { increment: 1 },
      },
      select: {
        id: true,
        bookingId: true,
        attempts: true,
        sentAt: true,
        scheduledAt: true,
      },
    });
    return updated;
  });
}

async function sendClaimedReviewRequest(
  claimed: ClaimedReviewRequest,
  now: Date,
  send: ReviewEmailSender,
): Promise<"sent" | "failed" | "skipped"> {
  const booking = await prisma.booking.findUnique({
    where: { id: claimed.bookingId },
    select: {
      id: true,
      status: true,
      bookingReference: true,
      customerEmail: true,
      customerFullName: true,
      vehicleNameSnapshot: true,
    },
  });

  if (!booking || (booking.status !== "RETURNED" && booking.status !== "COMPLETED")) {
    await prisma.bookingReviewRequest.update({
      where: { id: claimed.id },
      data: {
        status: "SKIPPED",
        skippedReason: "booking_not_returned",
        lastError: "Booking is no longer returned.",
        processingStartedAt: null,
      },
    });
    return "skipped";
  }

  const email = normalizeCustomerEmail(booking.customerEmail);
  if (!isValidCustomerEmail(email)) {
    await prisma.bookingReviewRequest.update({
      where: { id: claimed.id },
      data: {
        status: "SKIPPED",
        skippedReason: "invalid_customer_email",
        lastError: "Customer email is missing or invalid.",
        processingStartedAt: null,
      },
    });
    await writeReviewEmailLogNow({
      bookingId: booking.id,
      recipientEmail: email || "invalid",
      bookingReference: booking.bookingReference,
      status: "FAILED",
      errorMessage: "Customer email is missing or invalid.",
      failedAt: now,
    });
    return "skipped";
  }

  const delivery = await deliverReviewRequestEmail(
    {
      id: booking.id,
      bookingReference: booking.bookingReference,
      customerEmail: email,
      customerFullName: booking.customerFullName,
      vehicleName: booking.vehicleNameSnapshot,
    },
    { send, now },
  );

  if (delivery.ok) {
    await prisma.bookingReviewRequest.update({
      where: { id: claimed.id },
      data: {
        status: "SENT",
        sentAt: claimed.sentAt ?? now,
        lastSentAt: now,
        lastError: null,
        skippedReason: null,
        processingStartedAt: null,
      },
    });
    return "sent";
  }

  const failedPermanently = claimed.attempts >= REVIEW_REQUEST_MAX_ATTEMPTS;
  await prisma.bookingReviewRequest.update({
    where: { id: claimed.id },
    data: {
      status: failedPermanently ? "FAILED" : "PENDING",
      scheduledAt: failedPermanently ? claimed.scheduledAt : new Date(now.getTime() + reviewRequestDelayMs()),
      lastError: delivery.message,
      processingStartedAt: null,
    },
  });
  return "failed";
}
