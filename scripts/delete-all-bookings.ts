import "dotenv/config";

import { prisma } from "../src/lib/prisma";

async function main() {
  const before = {
    bookings: await prisma.booking.count(),
    statusHistory: await prisma.bookingStatusHistory.count(),
    documents: await prisma.bookingDocument.count(),
    emailLogs: await prisma.emailLog.count({ where: { bookingId: { not: null } } }),
    reservationHolds: await prisma.reservationHold.count(),
  };

  console.log("Records before deletion:");
  console.log(before);

  if (before.bookings === 0) {
    console.log("No bookings found. Nothing to delete.");
    return;
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.customerLoyaltyCredit.deleteMany();
    const emailLogs = await tx.emailLog.deleteMany({
      where: { bookingId: { not: null } },
    });
    const reservationHolds = await tx.reservationHold.deleteMany();
    const bookings = await tx.booking.deleteMany();

    return {
      emailLogs: emailLogs.count,
      reservationHolds: reservationHolds.count,
      bookings: bookings.count,
    };
  });

  const after = {
    bookings: await prisma.booking.count(),
    statusHistory: await prisma.bookingStatusHistory.count(),
    documents: await prisma.bookingDocument.count(),
    emailLogs: await prisma.emailLog.count({ where: { bookingId: { not: null } } }),
    reservationHolds: await prisma.reservationHold.count(),
  };

  console.log("Deleted:");
  console.log(deleted);
  console.log("Records after deletion:");
  console.log(after);
}

main()
  .catch((error) => {
    console.error("Failed to delete bookings:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
