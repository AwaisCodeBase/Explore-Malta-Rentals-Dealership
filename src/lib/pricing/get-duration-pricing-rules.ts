import { PRICING_TIERS } from "@/lib/pricing/pricing-tiers";

/** Static tier config returned by pricing APIs — not loaded from the database. */
export type PricingTierDto = Readonly<{
  key: string;
  minDays: number;
  maxDays: number | null;
  discountPercent: number;
  displayOrder: number;
}>;

/** @deprecated Use {@link PricingTierDto} */
export type DurationPricingRuleDto = PricingTierDto;

function mapPricingTierToDto(
  tier: (typeof PRICING_TIERS)[number],
  displayOrder: number,
): PricingTierDto {
  return {
    key: tier.key,
    minDays: tier.minDays,
    maxDays: tier.maxDays,
    discountPercent: tier.discountPercent,
    displayOrder,
  };
}

/** Returns the static PRICING_TIERS configuration (not database rows). */
export async function getPricingTiers(): Promise<PricingTierDto[]> {
  return PRICING_TIERS.map((tier, index) => mapPricingTierToDto(tier, (index + 1) * 10));
}

/** @deprecated Use {@link getPricingTiers} — name retained for backward compatibility. */
export async function getDurationPricingRules(): Promise<PricingTierDto[]> {
  return getPricingTiers();
}

/** @deprecated Use {@link getPricingTiers} */
export async function getDurationPricingRulesForType(): Promise<PricingTierDto[]> {
  return getPricingTiers();
}
