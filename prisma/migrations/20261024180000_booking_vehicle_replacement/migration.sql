-- A booking can keep a closed occupancy on the unit already used and a new occupancy
-- on the replacement unit. The unique booking lock is replaced by a non-unique index.
DROP INDEX IF EXISTS "VehicleUnitOccupancy_bookingId_key";

CREATE INDEX IF NOT EXISTS "VehicleUnitOccupancy_bookingId_idx" ON "VehicleUnitOccupancy"("bookingId");

-- Durable handover history. Occupancy rows are calendar locks and are removed on completion.
CREATE TABLE "BookingVehicleAssignment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "vehicleUnitId" TEXT NOT NULL,
    "vehicleNameSnapshot" TEXT NOT NULL,
    "licensePlateSnapshot" TEXT,
    "colorSnapshot" TEXT,
    "vehicleTypeSnapshot" "VehicleType",
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "endDisposition" "VehicleUnitStatus",
    "reason" TEXT,
    "note" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingVehicleAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BookingVehicleAssignment" ADD CONSTRAINT "BookingVehicleAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingVehicleAssignment" ADD CONSTRAINT "BookingVehicleAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookingVehicleAssignment" ADD CONSTRAINT "BookingVehicleAssignment_vehicleUnitId_fkey" FOREIGN KEY ("vehicleUnitId") REFERENCES "VehicleUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookingVehicleAssignment" ADD CONSTRAINT "BookingVehicleAssignment_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "BookingVehicleAssignment_bookingId_startedAt_idx" ON "BookingVehicleAssignment"("bookingId", "startedAt");

CREATE INDEX "BookingVehicleAssignment_vehicleUnitId_idx" ON "BookingVehicleAssignment"("vehicleUnitId");

CREATE INDEX "BookingVehicleAssignment_vehicleId_idx" ON "BookingVehicleAssignment"("vehicleId");

CREATE INDEX "BookingVehicleAssignment_createdByAdminId_idx" ON "BookingVehicleAssignment"("createdByAdminId");
