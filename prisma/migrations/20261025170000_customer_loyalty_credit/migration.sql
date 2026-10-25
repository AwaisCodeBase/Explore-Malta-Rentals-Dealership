-- €5 next-rental loyalty credit.
-- Issued only for rentals returned after this migration. Historical bookings are not backfilled.

CREATE TYPE "LoyaltyCreditStatus" AS ENUM ('AVAILABLE', 'REDEEMED');

ALTER TABLE "Booking" ADD COLUMN "loyaltyCreditAmount" DECIMAL(10,2);

CREATE TABLE "CustomerLoyaltyCredit" (
    "id" TEXT NOT NULL,
    "sourceBookingId" TEXT NOT NULL,
    "customerEmailNormalized" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "LoyaltyCreditStatus" NOT NULL DEFAULT 'AVAILABLE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerLoyaltyCredit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerLoyaltyCredit_sourceBookingId_key" ON "CustomerLoyaltyCredit"("sourceBookingId");
CREATE UNIQUE INDEX "CustomerLoyaltyCredit_redeemedBookingId_key" ON "CustomerLoyaltyCredit"("redeemedBookingId");
CREATE INDEX "CustomerLoyaltyCredit_customerEmailNormalized_status_issuedAt_idx" ON "CustomerLoyaltyCredit"("customerEmailNormalized", "status", "issuedAt");

ALTER TABLE "CustomerLoyaltyCredit" ADD CONSTRAINT "CustomerLoyaltyCredit_sourceBookingId_fkey" FOREIGN KEY ("sourceBookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerLoyaltyCredit" ADD CONSTRAINT "CustomerLoyaltyCredit_redeemedBookingId_fkey" FOREIGN KEY ("redeemedBookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerLoyaltyCredit" ADD CONSTRAINT "CustomerLoyaltyCredit_amount_currency_check" CHECK ("amount" = 5.00 AND "currency" = 'EUR');
