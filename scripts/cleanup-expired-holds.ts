/**
 * Sweeps expired reservation holds and unpaid Stripe soft-reservations.
 *
 * Run: npm run cleanup:expired-holds
 */
import "dotenv/config";

import { cleanupExpiredHolds } from "../src/lib/reservation-holds/cleanupExpiredHolds";
import { cleanupUnpaidPendingPaymentBookings } from "../src/lib/booking/cleanupUnpaidPendingPaymentBookings";

async function main(): Promise<void> {
  const holdResult = await cleanupExpiredHolds();
  const unpaidResult = await cleanupUnpaidPendingPaymentBookings();

  console.log("Expired holds cleanup summary:");
  console.log(`  Expired holds found: ${holdResult.expiredHoldsFound}`);
  console.log(`  Holds marked expired: ${holdResult.holdsExpired}`);
  console.log(`  Hold occupancy rows released: ${holdResult.occupancyRowsReleased}`);
  console.log(`  Orphan hold occupancy rows released: ${holdResult.orphanOccupancyReleased}`);

  console.log("Unpaid pending-payment bookings cleanup summary:");
  console.log(`  Candidates found: ${unpaidResult.candidatesFound}`);
  console.log(`  Bookings released: ${unpaidResult.bookingsReleased}`);

  const errors = [
    ...holdResult.errors.map((error) => ({
      scope: "hold" as const,
      id: error.holdId,
      message: error.message,
    })),
    ...unpaidResult.errors.map((error) => ({
      scope: "booking" as const,
      id: error.bookingId,
      message: error.message,
    })),
  ];

  if (errors.length > 0) {
    console.error(`  Errors: ${errors.length}`);
    for (const error of errors) {
      console.error(`    - ${error.scope}=${error.id ?? "unknown"}: ${error.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Cleanup completed successfully.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
