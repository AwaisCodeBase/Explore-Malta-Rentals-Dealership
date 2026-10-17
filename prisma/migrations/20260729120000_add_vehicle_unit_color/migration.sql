-- AlterTable
ALTER TABLE "VehicleUnit" ADD COLUMN "color" TEXT;

-- AlterTable
ALTER TABLE "ReservationHold" ADD COLUMN "selectedColor" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "vehicleColorSnapshot" TEXT;

-- CreateIndex
CREATE INDEX "VehicleUnit_vehicleId_color_isActive_status_idx" ON "VehicleUnit"("vehicleId", "color", "isActive", "status");
