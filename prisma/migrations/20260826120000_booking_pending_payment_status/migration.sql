-- Soft-reserve online bookings until Stripe payment succeeds.
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
