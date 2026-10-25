import type { Prisma, ReviewRequestStatus } from "@/generated/prisma/index";

import { postRentalReviewSubject } from "@/lib/email/buildPostRentalReviewEmail";
import { isValidCustomerEmail, normalizeCustomerEmail } from "@/lib/reviews/customer-email";
import { reviewRequestScheduledAt } from "@/lib/reviews/review-request-timing";

type ReviewScheduleDb = Pick<Prisma.TransactionClient, "bookingReviewRequest" | "emailLog">;

export type ScheduleReviewRequestResult = {
  created: boolean;
  status: ReviewRequestStatus | "UNCHANGED";
  scheduledAt: Date | null;
};

/**
 * Persists the review-request intent inside the return transaction.
 * This function does not send email.
 */
export async function scheduleReviewRequestForReturnedBooking(
  db: ReviewScheduleDb,
  booking: {
    id: string;
    bookingReference: string;
    customerEmail: string;
  },
  now = new Date(),
): Promise<ScheduleReviewRequestResult> {
  const existing = await db.bookingReviewRequest.findUnique({
    where: { bookingId: booking.id },
    select: { id: true, status: true, scheduledAt: true },
  });
  if (existing) {
    return { created: false, status: "UNCHANGED", scheduledAt: existing.scheduledAt };
  }

  const email = normalizeCustomerEmail(booking.customerEmail);
  const valid = isValidCustomerEmail(email);
  const scheduledAt = reviewRequestScheduledAt(now);
  const status: ReviewRequestStatus = valid ? "PENDING" : "SKIPPED";

  await db.bookingReviewRequest.create({
    data: {
      bookingId: booking.id,
      status,
      scheduledAt,
      skippedReason: valid ? null : "invalid_customer_email",
      lastError: valid ? null : "Customer email is missing or invalid.",
    },
  });

  await db.emailLog.create({
    data: {
      bookingId: booking.id,
      emailType: "REVIEW_REQUEST",
      recipientEmail: email || "invalid",
      subject: postRentalReviewSubject(booking.bookingReference),
      status: valid ? "QUEUED" : "FAILED",
      errorMessage: valid
        ? null
        : "Customer email is missing or invalid. The review request was not queued for delivery.",
      failedAt: valid ? null : now,
    },
  });

  return { created: true, status, scheduledAt };
}
