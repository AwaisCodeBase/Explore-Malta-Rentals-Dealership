import { INSURANCE_PLANS, mapStoredCdwToInsurancePlan } from "@/lib/pricing/insurance-plans";

/**
 * Human-readable label for a stored booking `cdwOption` snapshot.
 * Prefer snapshot rates/totals for amounts; this is display-only.
 */
export function formatStoredCdwOptionLabel(cdwOption: string): string {
  const plan = mapStoredCdwToInsurancePlan(cdwOption);
  if (plan) {
    return INSURANCE_PLANS[plan].label;
  }

  switch (cdwOption) {
    case "REDUCE_800_ATV":
      return "ATV reduced liability (EUR 800)";
    default:
      return INSURANCE_PLANS.NO_INSURANCE.label;
  }
}
