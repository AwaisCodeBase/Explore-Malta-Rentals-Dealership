/**
 * Create 3 confirmed + paid test bookings for zakirmatloob149@gmail.com
 *
 * Run: npx tsx scripts/create-test-bookings-zakir.ts
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { addDays } from "date-fns";

import { prisma } from "../src/lib/prisma";
import { insertBookingOccupancy } from "../src/lib/vehicle-unit-occupancy";

const CUSTOMER_EMAIL = "zakirmatloob149@gmail.com";

async function main() {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      units: { some: { isActive: true, status: "AVAILABLE" } },
    },
    include: {
      units: {
        where: { isActive: true, status: "AVAILABLE" },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  const specs = [
    {
      label: "TEST-ZAKIR-001",
      pickup: addDays(new Date(), 7),
      days: 2,
      vehicleType: "Scooter" as const,
    },
    {
      label: "TEST-ZAKIR-002",
      pickup: addDays(new Date(), 14),
      days: 3,
      vehicleType: "Scooter" as const,
    },
    {
      label: "TEST-ZAKIR-003",
      pickup: addDays(new Date(), 21),
      days: 1,
      vehicleType: "Motorcycle" as const,
    },
  ];

  const created = [];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i]!;
    const vehicle = vehicles[i] ?? vehicles[0] ?? null;
    const unit = vehicle?.units[0] ?? null;
    const pickup = new Date(spec.pickup);
    pickup.setUTCHours(10, 0, 0, 0);
    const returnAt = addDays(pickup, spec.days);
    const actualDurationHours = spec.days * 24;
    const dailyRate = vehicle ? Number(vehicle.baseDailyRate) : 30;
    const rentalCost = dailyRate * spec.days;
    const depositAmount = 250;
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const bookingReference = `${spec.label}-${suffix}`;

    const booking = await prisma.booking.create({
      data: {
        bookingReference,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        vehicleId: vehicle?.id,
        vehicleUnitId: unit?.id,
        vehicleNameSnapshot: vehicle?.name ?? `Test ${spec.vehicleType}`,
        vehicleLicensePlateSnapshot: unit?.licensePlate ?? null,
        vehicleColorSnapshot: unit?.color ?? null,
        vehicleType: vehicle?.vehicleType ?? spec.vehicleType,
        vehicleTypeSnapshot: vehicle?.vehicleType ?? spec.vehicleType,
        pickupDateTime: pickup,
        returnDateTime: returnAt,
        actualDurationHours,
        billableDays: spec.days,
        pickupOption: "OFFICE",
        dropoffOption: "OFFICE",
        customerFullName: "Zakir Matloob",
        customerPhone: "+35699000149",
        customerEmail: CUSTOMER_EMAIL,
        customerNationality: "Maltese",
        customerDateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
        customerLicenseCategory: "B",
        customerSpecialNotes: "TEST BOOKING — safe to delete",
        depositMethod: "IN_PERSON",
        depositAmount,
        baseDailyRateSnapshot: dailyRate,
        appliedDailyRateSnapshot: dailyRate,
        durationDiscountPercentSnapshot: 0,
        rentalCost,
        cdwOption: "NO_CDW",
        cdwDailyRate: 0,
        cdwTotal: 0,
        additionalDriverEnabled: false,
        additionalDriverDailyRate: 0,
        additionalDriverTotal: 0,
        storageBoxSelected: false,
        subtotal: rentalCost,
        totalDueOnline: rentalCost,
        totalDueLater: depositAmount,
      },
    });

    if (unit) {
      await insertBookingOccupancy(prisma, {
        vehicleUnitId: unit.id,
        pickupAt: pickup,
        returnAt,
        bookingId: booking.id,
      });
    }

    created.push({
      id: booking.id,
      bookingReference: booking.bookingReference,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      vehicle: booking.vehicleNameSnapshot,
      pickup: booking.pickupDateTime.toISOString(),
      return: booking.returnDateTime.toISOString(),
    });
  }

  console.log(`Created ${created.length} test bookings for ${CUSTOMER_EMAIL}:`);
  for (const row of created) {
    console.log(
      `- ${row.bookingReference} | ${row.status} / ${row.paymentStatus} | ${row.vehicle} | ${row.pickup} → ${row.return}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
