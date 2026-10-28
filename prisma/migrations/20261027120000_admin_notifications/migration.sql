-- CreateEnum
CREATE TYPE "AdminNotificationType" AS ENUM (
  'BOOKING_CREATED',
  'BOOKING_CANCELLED',
  'PAYMENT_RECEIVED',
  'BOOKING_EXTENDED',
  'VEHICLE_CHANGED',
  'VEHICLE_HANDED_OVER',
  'VEHICLE_REPLACED',
  'VEHICLE_RETURNED'
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" "AdminNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "bookingId" TEXT,
    "bookingReference" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNotification_isRead_createdAt_idx" ON "AdminNotification"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateIndex
CREATE INDEX "AdminNotification_bookingId_idx" ON "AdminNotification"("bookingId");

-- CreateIndex
CREATE INDEX "AdminNotification_createdByAdminId_idx" ON "AdminNotification"("createdByAdminId");

-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
