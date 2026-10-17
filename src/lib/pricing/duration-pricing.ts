import {
  getPricingTierForDays,
  PRICING_TIERS,
  type PricingTier,
  type PricingTierKey,
} from "@/lib/pricing/pricing-tiers";

export type DurationPricingPreviewRow = Readonly<{
  key: PricingTierKey;
  minDays: number;
  maxDays: number | null;
  discountPercent: number;
  appliedDailyRate: number;
  label: string;
}>;

export type VehicleRentalPricingResult = Readonly<{
  baseDailyRate: number;
  rentalDays: number;
  tierKey: PricingTierKey;
  tierRange: string;
  durationDiscountPercent: number;
  discountAmountPerDay: number;
  appliedDailyRate: number;
  undiscountedRentalSubtotal: number;
  rentalSubtotal: number;
  totalDiscountAmount: number;
}>;

export function roundPricingAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatDurationRuleLabel(minDays: number, maxDays: number | null): string {
  if (maxDays == null) {
    return `${minDays}+ days`;
  }
  if (minDays === maxDays) {
    return minDays === 1 ? "1 day" : `${minDays} days`;
  }
  return `${minDays}–${maxDays} days`;
}

export function resolveDurationPricingTier(rentalDays: number): PricingTier | null {
  return getPricingTierForDays(rentalDays);
}

export function calculateDiscountedDailyRate(
  baseDailyRate: number,
  discountPercent: number,
): number {
  return roundPricingAmount(baseDailyRate * (1 - discountPercent / 100));
}

export function calculateVehicleRentalPricing(
  baseDailyRate: number,
  rentalDays: number,
): VehicleRentalPricingResult | null {
  if (baseDailyRate <= 0 || rentalDays <= 0) {
    return null;
  }

  const matchedTier = resolveDurationPricingTier(rentalDays);
  if (!matchedTier) {
    return null;
  }

  const roundedBaseDailyRate = roundPricingAmount(baseDailyRate);
  const durationDiscountPercent = matchedTier.discountPercent;
  const appliedDailyRate = calculateDiscountedDailyRate(roundedBaseDailyRate, durationDiscountPercent);
  const discountAmountPerDay = roundPricingAmount(roundedBaseDailyRate - appliedDailyRate);
  const undiscountedRentalSubtotal = roundPricingAmount(roundedBaseDailyRate * rentalDays);
  const rentalSubtotal = roundPricingAmount(appliedDailyRate * rentalDays);
  const totalDiscountAmount = roundPricingAmount(undiscountedRentalSubtotal - rentalSubtotal);

  return {
    baseDailyRate: roundedBaseDailyRate,
    rentalDays,
    tierKey: matchedTier.key,
    tierRange: formatDurationRuleLabel(matchedTier.minDays, matchedTier.maxDays),
    durationDiscountPercent: roundPricingAmount(durationDiscountPercent),
    discountAmountPerDay,
    appliedDailyRate,
    undiscountedRentalSubtotal,
    rentalSubtotal,
    totalDiscountAmount,
  };
}

export function buildDurationPricingPreview(baseDailyRate: number): DurationPricingPreviewRow[] {
  if (baseDailyRate <= 0) {
    return [];
  }

  const roundedBaseDailyRate = roundPricingAmount(baseDailyRate);

  return PRICING_TIERS.map((tier) => ({
    key: tier.key,
    minDays: tier.minDays,
    maxDays: tier.maxDays,
    discountPercent: tier.discountPercent,
    appliedDailyRate: calculateDiscountedDailyRate(roundedBaseDailyRate, tier.discountPercent),
    label: formatDurationRuleLabel(tier.minDays, tier.maxDays),
  }));
}
