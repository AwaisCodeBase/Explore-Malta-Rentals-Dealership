import type { DepositMethod } from "@/generated/prisma/index";

import { calculateHotelDiscount } from "@/lib/hotel-codes/calculate-hotel-discount";
import { calculateVehicleRentalPricing, roundPricingAmount } from "@/lib/pricing/duration-pricing";

export type VehicleChangePriceMode = "keep_existing" | "apply_catalog";

export type VehicleChangePriceInput = {
  priceMode: VehicleChangePriceMode;
  hasExtensions: boolean;
  billableDays: number;
  currentRentalCost: number;
  currentSubtotal: number;
  currentTotalDueOnline: number;
  currentTotalDueLater: number;
  depositAmount: number;
  depositMethod: DepositMethod;
  hotelDiscountPercentSnapshot: number | null;
  hotelDiscountAmountSnapshot: number | null;
  replacementBaseDailyRate: number;
  /** €5 loyalty discount already stored on the booking. Deposit is not part of this amount. */
  loyaltyCreditAmount?: number;
};

export type VehicleChangePricing = {
  priceMode: VehicleChangePriceMode;
  currentRentalCost: number;
  calculatedBaseDailyRate: number;
  calculatedDurationDiscountPercent: number;
  calculatedAppliedDailyRate: number;
  calculatedRentalCost: number;
  currentHotelDiscountAmount: number;
  calculatedHotelDiscountAmount: number;
  currentSubtotal: number;
  calculatedSubtotal: number;
  priceDifference: number;
  finalRentalCost: number;
  finalSubtotal: number;
  finalTotalDueOnline: number;
  finalTotalDueLater: number;
  duesUpdated: boolean;
  hotelDiscountApplied: boolean;
  finalBaseDailyRate: number | null;
  finalDurationDiscountPercent: number | null;
  finalAppliedDailyRate: number | null;
  finalHotelDiscountAmount: number | null;
  finalRentalAfterHotelDiscount: number | null;
};

export type VehicleChangePriceResult =
  | { ok: true; pricing: VehicleChangePricing }
  | { ok: false; reason: "invalid_pricing" | "price_mode_unavailable" };

function moneyEquals(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.001;
}

function chargesAfterStoredLoyalty(subtotal: number, loyaltyCreditAmount: number | undefined): number {
  const loyalty = roundPricingAmount(Math.max(0, loyaltyCreditAmount ?? 0));
  return roundPricingAmount(Math.max(0, subtotal - loyalty));
}

function duesMatchStoredSubtotal(input: VehicleChangePriceInput): boolean {
  const charges = chargesAfterStoredLoyalty(input.currentSubtotal, input.loyaltyCreditAmount);
  const expectedOnline =
    input.depositMethod === "ONLINE"
      ? roundPricingAmount(charges + input.depositAmount)
      : charges;
  const expectedLater = input.depositMethod === "IN_PERSON" ? input.depositAmount : 0;
  return (
    moneyEquals(input.currentTotalDueOnline, expectedOnline) &&
    moneyEquals(input.currentTotalDueLater, expectedLater)
  );
}

/**
 * Catalog pricing is calculated for the admin preview.
 * The stored booking total changes only when the admin explicitly applies it.
 * Extensions keep the agreed total, because that total already includes the original-rate extension.
 */
export function calculateVehicleChangePrice(input: VehicleChangePriceInput): VehicleChangePriceResult {
  if (input.priceMode === "apply_catalog" && input.hasExtensions) {
    return { ok: false, reason: "price_mode_unavailable" };
  }
  if (!Number.isInteger(input.billableDays) || input.billableDays <= 0) {
    return { ok: false, reason: "invalid_pricing" };
  }
  if (!Number.isFinite(input.replacementBaseDailyRate) || input.replacementBaseDailyRate <= 0) {
    return { ok: false, reason: "invalid_pricing" };
  }
  if (!Number.isFinite(input.currentRentalCost) || input.currentRentalCost < 0) {
    return { ok: false, reason: "invalid_pricing" };
  }
  if (!Number.isFinite(input.currentSubtotal) || input.currentSubtotal < 0) {
    return { ok: false, reason: "invalid_pricing" };
  }

  const calculated = calculateVehicleRentalPricing(input.replacementBaseDailyRate, input.billableDays);
  if (!calculated) {
    return { ok: false, reason: "invalid_pricing" };
  }

  const percent = input.hotelDiscountPercentSnapshot ?? 0;
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { ok: false, reason: "invalid_pricing" };
  }

  const hotelDiscountApplied = input.hotelDiscountPercentSnapshot !== null || input.hotelDiscountAmountSnapshot !== null;
  const currentHotelDiscountAmount =
    input.hotelDiscountAmountSnapshot ??
    (percent > 0 ? calculateHotelDiscount(input.currentRentalCost, percent).discountAmount : 0);
  const calculatedHotelDiscountAmount =
    percent > 0
      ? calculateHotelDiscount(calculated.rentalSubtotal, percent).discountAmount
      : currentHotelDiscountAmount;

  const currentRentalAfterHotel = roundPricingAmount(input.currentRentalCost - currentHotelDiscountAmount);
  const calculatedRentalAfterHotel = roundPricingAmount(calculated.rentalSubtotal - calculatedHotelDiscountAmount);
  const calculatedSubtotal = roundPricingAmount(
    input.currentSubtotal + (calculatedRentalAfterHotel - currentRentalAfterHotel),
  );
  const priceDifference = roundPricingAmount(calculatedSubtotal - input.currentSubtotal);

  const keepExisting = input.priceMode === "keep_existing";
  const finalRentalCost = keepExisting ? input.currentRentalCost : calculated.rentalSubtotal;
  const finalSubtotal = keepExisting ? input.currentSubtotal : calculatedSubtotal;
  const duesUpdated = !keepExisting && duesMatchStoredSubtotal(input);
  const finalCharges = chargesAfterStoredLoyalty(finalSubtotal, input.loyaltyCreditAmount);
  const finalTotalDueOnline = duesUpdated
    ? input.depositMethod === "ONLINE"
      ? roundPricingAmount(finalCharges + input.depositAmount)
      : finalCharges
    : input.currentTotalDueOnline;
  const finalTotalDueLater = duesUpdated
    ? input.depositMethod === "IN_PERSON"
      ? input.depositAmount
      : 0
    : input.currentTotalDueLater;

  return {
    ok: true,
    pricing: {
      priceMode: input.priceMode,
      currentRentalCost: input.currentRentalCost,
      calculatedBaseDailyRate: calculated.baseDailyRate,
      calculatedDurationDiscountPercent: calculated.durationDiscountPercent,
      calculatedAppliedDailyRate: calculated.appliedDailyRate,
      calculatedRentalCost: calculated.rentalSubtotal,
      currentHotelDiscountAmount,
      calculatedHotelDiscountAmount,
      currentSubtotal: input.currentSubtotal,
      calculatedSubtotal,
      priceDifference,
      finalRentalCost,
      finalSubtotal,
      finalTotalDueOnline,
      finalTotalDueLater,
      duesUpdated,
      hotelDiscountApplied,
      finalBaseDailyRate: keepExisting ? null : calculated.baseDailyRate,
      finalDurationDiscountPercent: keepExisting ? null : calculated.durationDiscountPercent,
      finalAppliedDailyRate: keepExisting ? null : calculated.appliedDailyRate,
      finalHotelDiscountAmount: keepExisting || !hotelDiscountApplied ? null : calculatedHotelDiscountAmount,
      finalRentalAfterHotelDiscount: keepExisting || !hotelDiscountApplied ? null : calculatedRentalAfterHotel,
    },
  };
}
