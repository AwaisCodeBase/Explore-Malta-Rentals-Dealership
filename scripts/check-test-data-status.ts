import "dotenv/config";

import { prisma } from "../src/lib/prisma";

async function main() {
  const counts = {
    bookings: await prisma.booking.count(),
    bookingStatusHistory: await prisma.bookingStatusHistory.count(),
    bookingDocuments: await prisma.bookingDocument.count(),
    bookingEmailLogs: await prisma.emailLog.count({ where: { bookingId: { not: null } } }),
    reservationHolds: await prisma.reservationHold.count(),
    vehicles: await prisma.vehicle.count(),
    vehicleImages: await prisma.vehicleImage.count(),
    vehiclePricingRulesLinked: await prisma.vehiclePricingRule.count({
      where: { vehicleId: { not: null } },
    }),
    availabilityBlocksLinked: await prisma.availabilityBlock.count({
      where: { vehicleId: { not: null } },
    }),
    hotelPayments: await prisma.hotelMonthlySettlement.count(),
    hotelCodes: await prisma.hotelCode.count(),
    hotels: await prisma.hotelPartner.count(),
    durationPricingRulesTotal: await prisma.durationPricingRule.count(),
    durationPricingRulesActive: await prisma.durationPricingRule.count({
      where: { isActive: true },
    }),
    typeLevelVehiclePricingRules: await prisma.vehiclePricingRule.count({
      where: { vehicleId: null },
    }),
    contactInquiries: await prisma.contactInquiry.count(),
    allEmailLogs: await prisma.emailLog.count(),
  };

  console.log("Current test-related record counts:");
  console.log(counts);

  const bookingRelated = [
    counts.bookings,
    counts.bookingStatusHistory,
    counts.bookingDocuments,
    counts.bookingEmailLogs,
    counts.reservationHolds,
  ];
  const vehicleRelated = [
    counts.vehicles,
    counts.vehicleImages,
    counts.vehiclePricingRulesLinked,
    counts.availabilityBlocksLinked,
  ];
  const hotelRelated = [counts.hotelPayments, counts.hotelCodes, counts.hotels];

  const bookingClear = bookingRelated.every((n) => n === 0);
  const vehicleClear = vehicleRelated.every((n) => n === 0);
  const hotelClear = hotelRelated.every((n) => n === 0);

  console.log("");
  console.log(`Booking-related data cleared: ${bookingClear ? "yes" : "no"}`);
  console.log(`Vehicle-related data cleared: ${vehicleClear ? "yes" : "no"}`);
  console.log(`Hotel-related data cleared: ${hotelClear ? "yes" : "no"}`);
}

main()
  .catch((error) => {
    console.error("Failed to check data status:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
