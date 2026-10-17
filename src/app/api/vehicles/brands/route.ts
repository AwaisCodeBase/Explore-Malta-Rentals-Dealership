import { NextResponse } from "next/server";

import { getDistinctActiveVehicleBrands } from "@/lib/vehicles/getDistinctActiveVehicleBrands";

export async function GET() {
  try {
    const brands = await getDistinctActiveVehicleBrands();
    return NextResponse.json({
      success: true as const,
      brands,
    });
  } catch (error) {
    console.error("[vehicles/brands] Failed to fetch brands", error);
    return NextResponse.json(
      {
        success: false as const,
        message: "Unable to load vehicle brands right now.",
      },
      { status: 500 },
    );
  }
}
