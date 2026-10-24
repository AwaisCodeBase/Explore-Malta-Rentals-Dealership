import { roundPricingAmount } from "@/lib/pricing/duration-pricing";

export type BookingExtensionChargeInput = {
  additionalBillableDays: number;
  billableDays: number;
  rentalCost: number;
  appliedDailyRateSnapshot: number | null;
  hotelDiscountPercentSnapshot: number | null;
  cdwDailyRate: number;
  additionalDriverEnabled: boolean;
  additionalDriverDailyRate: number;
  /**
   * Today's vehicle catalog rate. Never used. Callers pass it so a mistaken
   * reprice from the live vehicle is visible in tests and reviews.
   */
  currentVehicleDailyRate?: number | null;
};

export type BookingExtensionCharge = {
  appliedDailyRate: number;
  additionalRentalAmount: number;
  additionalHotelDiscountAmount: number;
  additionalCdwAmount: number;
  additionalDriverAmount: number;
  additionalAmount: number;
};

export type BookingExtensionChargeResult =
  | { ok: true; charge: BookingExtensionCharge }
  | { ok: false; reason: "invalid_pricing" };

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/** Incremental charge from the booking's stored daily rates. Does not re-tier the stay. */
export function calculateBookingExtensionCharge(
  input: BookingExtensionChargeInput,
): BookingExtensionChargeResult {
  if (!Number.isInteger(input.additionalBillableDays) || input.additionalBillableDays < 0) {
    return { ok: false, reason: "invalid_pricing" };
  }

  // Today's catalog rate is intentionally unused. Extensions keep the stored booking rate.
  void input.currentVehicleDailyRate;

  const derivedRate =
    input.billableDays > 0 && isNonNegativeFinite(input.rentalCost)
      ? input.rentalCost / input.billableDays
      : null;
  const snapshotRate = input.appliedDailyRateSnapshot;
  const appliedDailyRate =
    snapshotRate !== null && isNonNegativeFinite(snapshotRate) ? snapshotRate : derivedRate;

  if (appliedDailyRate === null || !isNonNegativeFinite(appliedDailyRate)) {
    if (input.additionalBillableDays === 0) {
      return {
        ok: true,
        charge: {
          appliedDailyRate: 0,
          additionalRentalAmount: 0,
          additionalHotelDiscountAmount: 0,
          additionalCdwAmount: 0,
          additionalDriverAmount: 0,
          additionalAmount: 0,
        },
      };
    }
    return { ok: false, reason: "invalid_pricing" };
  }

  const hotelPercent = input.hotelDiscountPercentSnapshot ?? 0;
  if (!isNonNegativeFinite(hotelPercent) || hotelPercent > 100) {
    return { ok: false, reason: "invalid_pricing" };
  }
  if (!isNonNegativeFinite(input.cdwDailyRate) || !isNonNegativeFinite(input.additionalDriverDailyRate)) {
    return { ok: false, reason: "invalid_pricing" };
  }

  const days = input.additionalBillableDays;
  const additionalRentalAmount = roundPricingAmount(appliedDailyRate * days);
  const additionalHotelDiscountAmount = roundPricingAmount(additionalRentalAmount * (hotelPercent / 100));
  const additionalCdwAmount = roundPricingAmount(input.cdwDailyRate * days);
  const additionalDriverAmount = input.additionalDriverEnabled
    ? roundPricingAmount(input.additionalDriverDailyRate * days)
    : 0;
  const additionalAmount = roundPricingAmount(
    additionalRentalAmount - additionalHotelDiscountAmount + additionalCdwAmount + additionalDriverAmount,
  );

  if (
    !isNonNegativeFinite(additionalRentalAmount) ||
    !isNonNegativeFinite(additionalHotelDiscountAmount) ||
    !isNonNegativeFinite(additionalCdwAmount) ||
    !isNonNegativeFinite(additionalDriverAmount) ||
    !isNonNegativeFinite(additionalAmount)
  ) {
    return { ok: false, reason: "invalid_pricing" };
  }

  return {
    ok: true,
    charge: {
      appliedDailyRate: roundPricingAmount(appliedDailyRate),
      additionalRentalAmount,
      additionalHotelDiscountAmount,
      additionalCdwAmount,
      additionalDriverAmount,
      additionalAmount,
    },
  };
}
