export type PricingTierKey = "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4";

export type PricingTier = Readonly<{
  key: PricingTierKey;
  minDays: number;
  maxDays: number | null;
  discountPercent: number;
}>;

export const PRICING_TIERS: readonly PricingTier[] = [
  { key: "TIER_1", minDays: 1, maxDays: 6, discountPercent: 0 },
  { key: "TIER_2", minDays: 7, maxDays: 13, discountPercent: 20 },
  { key: "TIER_3", minDays: 14, maxDays: 20, discountPercent: 28 },
  { key: "TIER_4", minDays: 21, maxDays: null, discountPercent: 40 },
] as const;

export function getPricingTierForDays(rentalDays: number): PricingTier | null {
  if (rentalDays <= 0) {
    return null;
  }

  return (
    PRICING_TIERS.find(
      (tier) =>
        rentalDays >= tier.minDays && (tier.maxDays == null || rentalDays <= tier.maxDays),
    ) ?? null
  );
}
