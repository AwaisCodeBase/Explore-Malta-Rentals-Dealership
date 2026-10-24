-- Additive audit of admin booking extensions. Does not change existing booking rows.
CREATE TABLE "BookingExtension" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "previousReturnDateTime" TIMESTAMP(3) NOT NULL,
    "newReturnDateTime" TIMESTAMP(3) NOT NULL,
    "additionalBillableDays" INTEGER NOT NULL,
    "appliedDailyRate" DECIMAL(10,2) NOT NULL,
    "additionalRentalAmount" DECIMAL(10,2) NOT NULL,
    "additionalHotelDiscountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "additionalCdwAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "additionalDriverAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "additionalAmount" DECIMAL(10,2) NOT NULL,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingExtension_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BookingExtension" ADD CONSTRAINT "BookingExtension_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingExtension" ADD CONSTRAINT "BookingExtension_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "BookingExtension_bookingId_createdAt_idx" ON "BookingExtension"("bookingId", "createdAt");

CREATE INDEX "BookingExtension_createdByAdminId_idx" ON "BookingExtension"("createdByAdminId");
