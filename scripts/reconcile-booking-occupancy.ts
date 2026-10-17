/**
 * Repairs booking calendar locks that no longer match the assigned vehicle unit.
 *
 * Run: npm run reconcile:booking-occupancy
 */
import "dotenv/config";

import { reconcileMismatchedBookingOccupancies } from "../src/lib/vehicle-unit-occupancy";

async function main(): Promise<void> {
  const result = await reconcileMismatchedBookingOccupancies();

  console.log("Booking occupancy reconciliation summary:");
  console.log(`  Blocking bookings scanned: ${result.scanned}`);
  console.log(`  Calendar locks repaired: ${result.repaired}`);
  console.log(`  Stale locks released: ${result.staleLocksReleased}`);

  if (result.conflicts.length > 0) {
    console.warn(`  Manual review needed: ${result.conflicts.length}`);
    for (const conflict of result.conflicts) {
      console.warn(`    ${conflict.bookingReference}: ${conflict.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
