/**
 * Seeds DurationPricingRule rows for historical reference only.
 * Runtime pricing uses fixed tiers in src/lib/pricing/pricing-tiers.ts.
 *
 * Run: node scripts/seed-duration-pricing-rules.mjs
 */
import "dotenv/config";

import { randomUUID } from "node:crypto";

import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

const VEHICLE_TYPES = ["Scooter", "Motorcycle", "Bicycle", "ATV"] as const;

/** Milestone 5 tier configuration — stored for audit only; runtime ignores inactive rows. */
const DEFAULT_RULES = VEHICLE_TYPES.flatMap((vehicleType) => [
  { vehicleType, minDays: 1, maxDays: 6, discountPercent: 0, displayOrder: 10 },
  { vehicleType, minDays: 7, maxDays: 13, discountPercent: 20, displayOrder: 20 },
  { vehicleType, minDays: 14, maxDays: 20, discountPercent: 28, displayOrder: 30 },
  { vehicleType, minDays: 21, maxDays: null, discountPercent: 40, displayOrder: 40 },
]);

const deleteTypeRulesSql = `
  DELETE FROM "DurationPricingRule"
  WHERE "vehicleType" = $1;
`;

const insertRuleSql = `
  INSERT INTO "DurationPricingRule" (
    "id",
    "vehicleType",
    "minDays",
    "maxDays",
    "discountPercent",
    "isActive",
    "displayOrder",
    "createdAt",
    "updatedAt"
  )
  VALUES ($1, $2, $3, $4, $5, false, $6, NOW(), NOW());
`;

async function main() {
  console.log(`Seeding ${DEFAULT_RULES.length} duration pricing rules (inactive, historical only)...`);

  for (const vehicleType of VEHICLE_TYPES) {
    await pool.query(deleteTypeRulesSql, [vehicleType]);
  }

  for (const rule of DEFAULT_RULES) {
    await pool.query(insertRuleSql, [
      randomUUID(),
      rule.vehicleType,
      rule.minDays,
      rule.maxDays,
      rule.discountPercent,
      rule.displayOrder,
    ]);
    console.log(
      `Seeded ${rule.vehicleType}: ${rule.minDays}${rule.maxDays == null ? "+" : `–${rule.maxDays}`} days @ ${rule.discountPercent}% off (inactive)`,
    );
  }

  console.log("Duration pricing rule seed complete (rows inactive — use PRICING_TIERS in code).");
}

try {
  await main();
} catch (error) {
  console.error("Duration pricing rule seed failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
