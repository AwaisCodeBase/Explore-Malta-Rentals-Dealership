-- Store engine size independently of vehicle type so scooters and motorcycles
-- can each be 50cc or 125cc.

ALTER TABLE "Vehicle" ADD COLUMN "engineCc" INTEGER;

UPDATE "Vehicle" SET "engineCc" = 50 WHERE "vehicleType" = 'Scooter';
UPDATE "Vehicle" SET "engineCc" = 125 WHERE "vehicleType" = 'Motorcycle';
