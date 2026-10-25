-- Add XL to the helmet size enum.
-- S (Small) is retained so historical bookings continue to load and display.
ALTER TYPE "HelmetSize" ADD VALUE 'XL';
