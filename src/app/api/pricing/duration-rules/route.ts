import { NextResponse } from "next/server";

import { getPricingTiers } from "@/lib/pricing/get-duration-pricing-rules";

/** @deprecated Prefer GET /api/pricing/tiers — returns static PRICING_TIERS config. */
export async function GET() {
  try {
    const rules = await getPricingTiers();
    return NextResponse.json({
      success: true as const,
      rules,
    });
  } catch (error) {
    console.error("[pricing/duration-rules] Failed to load pricing tiers", error);
    return NextResponse.json(
      {
        success: false as const,
        message: "Unable to load pricing tiers right now.",
      },
      { status: 500 },
    );
  }
}
