-- Durable post-return Google review requests.
-- Email delivery is not part of the rental return transaction.

CREATE TYPE "ReviewRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');

ALTER TYPE "EmailType" ADD VALUE 'REVIEW_REQUEST';

CREATE TABLE "BookingReviewRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "ReviewRequestStatus" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "skippedReason" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "manualResendCount" INTEGER NOT NULL DEFAULT 0,
    "lastManualResendAt" TIMESTAMP(3),
    "lastManualResendByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingReviewRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingReviewRequest_bookingId_key" ON "BookingReviewRequest"("bookingId");
CREATE INDEX "BookingReviewRequest_status_scheduledAt_idx" ON "BookingReviewRequest"("status", "scheduledAt");
CREATE INDEX "BookingReviewRequest_lastManualResendByAdminId_idx" ON "BookingReviewRequest"("lastManualResendByAdminId");

ALTER TABLE "BookingReviewRequest" ADD CONSTRAINT "BookingReviewRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingReviewRequest" ADD CONSTRAINT "BookingReviewRequest_lastManualResendByAdminId_fkey" FOREIGN KEY ("lastManualResendByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailLog" ADD COLUMN "initiatedByAdminId" TEXT;
CREATE INDEX "EmailLog_initiatedByAdminId_idx" ON "EmailLog"("initiatedByAdminId");
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_initiatedByAdminId_fkey" FOREIGN KEY ("initiatedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
