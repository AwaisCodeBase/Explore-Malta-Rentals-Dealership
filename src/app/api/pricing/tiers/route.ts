import { NextResponse } from "next/server";

import { getPricingTiers } from "@/lib/pricing/get-duration-pricing-rules";

export async function GET() {
  try {
    const tiers = await getPricingTiers();
    return NextResponse.json({
      success: true as const,
      tiers,
    });
  } catch (error) {
    console.error("[pricing/tiers] Failed to load pricing tiers", error);
    return NextResponse.json(
      {
        success: false as const,
        message: "Unable to load pricing tiers right now.",
      },
      { status: 500 },
    );
  }
}
