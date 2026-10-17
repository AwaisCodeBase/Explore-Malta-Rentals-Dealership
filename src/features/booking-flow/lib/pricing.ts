import { calculateVehicleRentalPricing } from "@/lib/pricing/duration-pricing";
import { getBillableRentalDays } from "@/lib/pricing/rental-duration";

export type BookingPricingBreakdown = Readonly<{
  billableDays: number;
  baseDailyRateEur: number;
  tierKey: string;
  tierRange: string;
  durationDiscountPercent: number;
  appliedDailyRateEur: number;
  totalEur: number;
}>;

export { getBillableRentalDays };

export function getBookingPricingBreakdown(
  baseDailyRate: number,
  pickupDate: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string,
): BookingPricingBreakdown | null {
  const billableDays = getBillableRentalDays(pickupDate, pickupTime, returnDate, returnTime);
  if (billableDays <= 0) {
    return null;
  }

  const pricing = calculateVehicleRentalPricing(baseDailyRate, billableDays);
  if (!pricing) {
    return null;
  }

  return {
    billableDays,
    baseDailyRateEur: pricing.baseDailyRate,
    tierKey: pricing.tierKey,
    tierRange: pricing.tierRange,
    durationDiscountPercent: pricing.durationDiscountPercent,
    appliedDailyRateEur: pricing.appliedDailyRate,
    totalEur: pricing.rentalSubtotal,
  };
}
