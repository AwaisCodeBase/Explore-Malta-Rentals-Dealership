/**
 * Authoritative insurance (CDW) plan configuration for Milestone 5 Step 3.
 * Daily rates and plan codes live here — do not hardcode €3 / €8 elsewhere.
 */

export const INSURANCE_PLAN_CODES = ["NO_INSURANCE", "BASIC", "FULL_COVERAGE"] as const;

export type InsurancePlanCode = (typeof INSURANCE_PLAN_CODES)[number];

/** Form / UI selection: null means the customer has not chosen yet. */
export type InsurancePlanSelection = InsurancePlanCode | null;

export type InsurancePlanMeta = Readonly<{
  code: InsurancePlanCode;
  /** Stable English label for admin/emails; UI should prefer i18n keys. */
  label: string;
  dailyRate: number;
  /** Stable English coverage summary; UI should prefer i18n keys. */
  coverageDescription: string;
}>;

export const INSURANCE_PLANS: Readonly<Record<InsurancePlanCode, InsurancePlanMeta>> = {
  NO_INSURANCE: {
    code: "NO_INSURANCE",
    label: "No Insurance",
    dailyRate: 0,
    coverageDescription:
      "Customers are fully liable. An excess of €800 applies in case of damage.",
  },
  BASIC: {
    code: "BASIC",
    label: "Basic Plan",
    dailyRate: 3,
    coverageDescription:
      "The company covers damage costs up to €500. The customer is responsible for the remaining excess.",
  },
  FULL_COVERAGE: {
    code: "FULL_COVERAGE",
    label: "Full Coverage",
    dailyRate: 8,
    coverageDescription:
      "All damages are fully covered by the insurance company. Zero customer liability.",
  },
} as const;

/** Prisma / API `CdwOption` values used for new bookings. */
export type StoredInsuranceCdwOption =
  | "NO_CDW"
  | "REDUCE_500_125CC"
  | "FULL_COVERAGE_50CC_125CC";

/**
 * Maps customer-facing insurance plans to persisted `CdwOption` values.
 * BASIC uses REDUCE_500_125CC (€3/day, €500 coverage semantics).
 * Historical options (REDUCE_350_50CC, REDUCE_800_ATV) remain readable on old bookings.
 */
export function mapInsurancePlanToStoredCdw(plan: InsurancePlanCode): StoredInsuranceCdwOption {
  switch (plan) {
    case "BASIC":
      return "REDUCE_500_125CC";
    case "FULL_COVERAGE":
      return "FULL_COVERAGE_50CC_125CC";
    case "NO_INSURANCE":
    default:
      return "NO_CDW";
  }
}

export function mapStoredCdwToInsurancePlan(
  cdwOption: string,
): InsurancePlanCode | null {
  switch (cdwOption) {
    case "NO_CDW":
      return "NO_INSURANCE";
    case "REDUCE_500_125CC":
    case "REDUCE_350_50CC":
      return "BASIC";
    case "FULL_COVERAGE_50CC_125CC":
      return "FULL_COVERAGE";
    case "REDUCE_800_ATV":
      // Historical ATV package — not one of the three current plans.
      return null;
    default:
      return null;
  }
}

export function isInsurancePlanCode(value: unknown): value is InsurancePlanCode {
  return (
    typeof value === "string" &&
    (INSURANCE_PLAN_CODES as readonly string[]).includes(value)
  );
}

export function getInsuranceDailyRate(plan: InsurancePlanCode): number {
  return INSURANCE_PLANS[plan].dailyRate;
}

export function calculateInsuranceTotal(
  plan: InsurancePlanCode,
  rentalDays: number,
): Readonly<{ dailyRate: number; total: number }> {
  const dailyRate = getInsuranceDailyRate(plan);
  const safeDays = Number.isFinite(rentalDays) && rentalDays > 0 ? rentalDays : 0;
  return {
    dailyRate,
    total: dailyRate * safeDays,
  };
}

export const BOOKABLE_STORED_CDW_OPTIONS: ReadonlySet<StoredInsuranceCdwOption> = new Set([
  "NO_CDW",
  "REDUCE_500_125CC",
  "FULL_COVERAGE_50CC_125CC",
]);
