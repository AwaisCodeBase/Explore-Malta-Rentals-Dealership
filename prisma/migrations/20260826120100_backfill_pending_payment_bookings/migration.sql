-- Reclassify unpaid online bookings that were incorrectly left as CONFIRMED.
-- Recent unpaid Stripe bookings become PENDING_PAYMENT (still soft-locked).
-- Older unpaid / failed online bookings are cancelled and occupancy is released.

UPDATE "Booking" AS b
SET status = 'PENDING_PAYMENT'
WHERE b.status = 'CONFIRMED'
  AND b."paymentStatus" = 'PENDING'
  AND b."totalDueOnline" > 0
  AND b."createdAt" > NOW() - INTERVAL '30 minutes'
  AND NOT EXISTS (
    SELECT 1
    FROM "StripePayment" sp
    WHERE sp."bookingId" = b.id
      AND sp."stripeStatus" = 'SUCCEEDED'
  );

-- Cancel abandoned / failed online bookings older than the checkout window.
UPDATE "Booking" AS b
SET
  status = 'CANCELLED',
  "paymentStatus" = CASE
    WHEN b."paymentStatus" = 'PAID' THEN b."paymentStatus"
    ELSE 'FAILED'
  END
WHERE b.status = 'CONFIRMED'
  AND b."paymentStatus" IN ('PENDING', 'FAILED')
  AND b."totalDueOnline" > 0
  AND b."createdAt" <= NOW() - INTERVAL '30 minutes'
  AND NOT EXISTS (
    SELECT 1
    FROM "StripePayment" sp
    WHERE sp."bookingId" = b.id
      AND sp."stripeStatus" = 'SUCCEEDED'
  );

-- Release occupancy for bookings cancelled by the backfill above.
DELETE FROM "VehicleUnitOccupancy" AS o
USING "Booking" AS b
WHERE o."bookingId" = b.id
  AND b.status = 'CANCELLED'
  AND b."paymentStatus" = 'FAILED'
  AND b."totalDueOnline" > 0;
