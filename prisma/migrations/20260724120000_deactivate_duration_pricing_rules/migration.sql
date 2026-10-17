-- Retire DB-driven duration pricing rules; tiers are now fixed in application code.
UPDATE "DurationPricingRule"
SET "isActive" = false,
    "updatedAt" = NOW()
WHERE "isActive" = true;
