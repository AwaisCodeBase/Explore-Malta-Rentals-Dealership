import { buildPostRentalReviewEmail } from "@/lib/email/buildPostRentalReviewEmail";
import { sendEmail } from "@/lib/email/emailClient";
import type { SendEmailResult } from "@/lib/email/types";
import { buildLoyaltyCreditEmailSection } from "@/lib/loyalty/loyalty-credit";
import { prisma } from "@/lib/prisma";
import { resolveGoogleReviewUrl } from "@/lib/reviews/google-review-url";
import { reviewRequestErrorMessage, writeReviewEmailLogNow } from "@/lib/reviews/review-email-log";

export type ReviewEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type ReviewEmailSender = (input: ReviewEmailPayload) => Promise<SendEmailResult>;

export type ReviewEmailBooking = {
  id: string;
  bookingReference: string;
  customerEmail: string;
  customerFullName: string;
  vehicleName: string | null;
};

export type DeliverReviewEmailResult =
  | { ok: true; deliveryMode: "resend" | "development_console"; providerMessageId: string | null }
  | { ok: false; message: string };

export async function defaultReviewEmailSender(input: ReviewEmailPayload): Promise<SendEmailResult> {
  return sendEmail(input);
}

export async function deliverReviewRequestEmail(
  booking: ReviewEmailBooking,
  options?: {
    send?: ReviewEmailSender;
    initiatedByAdminId?: string | null;
    now?: Date;
  },
): Promise<DeliverReviewEmailResult> {
  const now = options?.now ?? new Date();
  const reviewUrl = resolveGoogleReviewUrl();
  if (!reviewUrl.ok) {
    const message = reviewUrl.reason;
    await writeReviewEmailLogNow({
      bookingId: booking.id,
      recipientEmail: booking.customerEmail.trim(),
      bookingReference: booking.bookingReference,
      status: "FAILED",
      errorMessage: message,
      initiatedByAdminId: options?.initiatedByAdminId,
      failedAt: now,
    });
    return { ok: false, message };
  }

  let content: { subject: string; html: string; text: string };
  try {
    const loyaltyCredit = await prisma.customerLoyaltyCredit.findUnique({
      where: { sourceBookingId: booking.id },
      select: { id: true },
    });
    const loyaltySection = loyaltyCredit ? buildLoyaltyCreditEmailSection() : null;
    content = buildPostRentalReviewEmail({
      customerFullName: booking.customerFullName,
      bookingReference: booking.bookingReference,
      vehicleName: booking.vehicleName ?? "",
      reviewUrl: reviewUrl.url,
      additionalHtml: loyaltySection?.html,
      additionalText: loyaltySection?.text,
    });
  } catch (error) {
    const message = reviewRequestErrorMessage(error);
    await writeReviewEmailLogNow({
      bookingId: booking.id,
      recipientEmail: booking.customerEmail.trim(),
      bookingReference: booking.bookingReference,
      status: "FAILED",
      errorMessage: message,
      initiatedByAdminId: options?.initiatedByAdminId,
      failedAt: now,
    });
    return { ok: false, message };
  }

  const send = options?.send ?? defaultReviewEmailSender;
  let result: SendEmailResult;
  try {
    result = await send({
      to: booking.customerEmail.trim(),
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  } catch (error) {
    result = { ok: false, reason: "send_failed", cause: error };
  }

  if (!result.ok) {
    const message = reviewRequestErrorMessage(result.cause);
    await writeReviewEmailLogNow({
      bookingId: booking.id,
      recipientEmail: booking.customerEmail.trim(),
      bookingReference: booking.bookingReference,
      status: "FAILED",
      errorMessage: message,
      initiatedByAdminId: options?.initiatedByAdminId,
      failedAt: now,
    });
    console.error("[review-request] email delivery failed", {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      reason: result.reason,
    });
    return { ok: false, message };
  }

  const providerMessageId = result.providerMessageId ?? null;
  await writeReviewEmailLogNow({
    bookingId: booking.id,
    recipientEmail: booking.customerEmail.trim(),
    bookingReference: booking.bookingReference,
    status: "SENT",
    providerMessageId,
    initiatedByAdminId: options?.initiatedByAdminId,
    sentAt: now,
  });
  console.log("[review-request] email sent", {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    deliveryMode: result.deliveryMode,
    manual: Boolean(options?.initiatedByAdminId),
  });
  return { ok: true, deliveryMode: result.deliveryMode, providerMessageId };
}
