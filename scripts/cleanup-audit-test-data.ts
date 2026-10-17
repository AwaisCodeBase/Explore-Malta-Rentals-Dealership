/**
 * Removes leftover availability-audit test vehicles/bookings from the database.
 *
 * Run: npm run cleanup:audit-test-data
 */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";

const TEST_EMAIL = "availability-audit@test.local";

async function main(): Promise<void> {
  const auditVehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { slug: { startsWith: "audit-test-" } },
        { slug: { startsWith: "handover-patch-" } },
        { name: { startsWith: "Audit " } },
        { name: { startsWith: "Handover Patch Test " } },
      ],
    },
    select: { id: true, name: true, slug: true },
  });

  const auditVehicleIds = auditVehicles.map((vehicle) => vehicle.id);

  const deletedOccupancy = await prisma.$executeRaw`
    DELETE FROM "VehicleUnitOccupancy"
    WHERE "bookingId" IN (SELECT "id" FROM "Booking" WHERE "customerEmail" = ${TEST_EMAIL})
       OR "reservationHoldId" IN (SELECT "id" FROM "ReservationHold" WHERE "customerEmail" LIKE '%@test.local')
  `;

  const deletedBookings = await prisma.booking.deleteMany({
    where: {
      OR: [
        { customerEmail: TEST_EMAIL },
        { customerEmail: { endsWith: "@test.local" } },
        ...(auditVehicleIds.length > 0 ? [{ vehicleId: { in: auditVehicleIds } }] : []),
      ],
    },
  });

  const deletedHolds = await prisma.reservationHold.deleteMany({
    where: { customerEmail: { endsWith: "@test.local" } },
  });

  const deletedUnits = auditVehicleIds.length
    ? await prisma.vehicleUnit.deleteMany({ where: { vehicleId: { in: auditVehicleIds } } })
    : { count: 0 };

  const deletedVehicles = auditVehicleIds.length
    ? await prisma.vehicle.deleteMany({ where: { id: { in: auditVehicleIds } } })
    : { count: 0 };

  const deletedAdmins = await prisma.adminUser.deleteMany({
    where: { email: { endsWith: "@test.local" } },
  });

  console.log("Audit test data cleanup summary:");
  console.log(`  Vehicles removed: ${deletedVehicles.count}`);
  for (const vehicle of auditVehicles) {
    console.log(`    - ${vehicle.name} (${vehicle.slug})`);
  }
  console.log(`  Vehicle units removed: ${deletedUnits.count}`);
  console.log(`  Bookings removed: ${deletedBookings.count}`);
  console.log(`  Reservation holds removed: ${deletedHolds.count}`);
  console.log(`  Occupancy rows removed: ${Number(deletedOccupancy)}`);
  console.log(`  Test admin users removed: ${deletedAdmins.count}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
