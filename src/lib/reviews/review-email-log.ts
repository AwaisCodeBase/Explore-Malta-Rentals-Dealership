import type { ConfirmationEmailStatus, Prisma } from "@/generated/prisma/index";

import { postRentalReviewSubject } from "@/lib/email/buildPostRentalReviewEmail";
import { prisma } from "@/lib/prisma";

type ReviewEmailLogDb = Pick<Prisma.TransactionClient, "emailLog">;

export function reviewRequestErrorMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message.trim().slice(0, 500);
  }
  if (typeof cause === "string" && cause.trim()) {
    return cause.trim().slice(0, 500);
  }
  if (cause && typeof cause === "object" && "message" in cause) {
    const message = (cause as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim().slice(0, 500);
    }
  }
  return "Email delivery failed";
}

export async function writeReviewEmailLog(
  db: ReviewEmailLogDb,
  input: {
    bookingId: string;
    recipientEmail: string;
    bookingReference: string;
    status: ConfirmationEmailStatus;
    errorMessage?: string | null;
    providerMessageId?: string | null;
    initiatedByAdminId?: string | null;
    sentAt?: Date | null;
    failedAt?: Date | null;
  },
): Promise<void> {
  try {
    await db.emailLog.create({
      data: {
        bookingId: input.bookingId,
        emailType: "REVIEW_REQUEST",
        recipientEmail: input.recipientEmail,
        subject: postRentalReviewSubject(input.bookingReference),
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        providerMessageId: input.providerMessageId ?? null,
        initiatedByAdminId: input.initiatedByAdminId ?? null,
        sentAt: input.sentAt ?? null,
        failedAt: input.failedAt ?? null,
      },
    });
  } catch (error) {
    console.error("[review-request] failed to write email log", {
      bookingId: input.bookingId,
      status: input.status,
      error,
    });
  }
}

export async function writeReviewEmailLogNow(
  input: Parameters<typeof writeReviewEmailLog>[1],
): Promise<void> {
  await writeReviewEmailLog(prisma, input);
}
