import { VehicleType } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { enrichVehicleListWithRentalWindow } from "@/lib/vehicles/enrichVehicleListWithRentalWindow";
import { isBookableRentalWindowStatus } from "@/lib/vehicles/types";
import { getDistinctActiveVehicleBrands } from "@/lib/vehicles/getDistinctActiveVehicleBrands";
import { getVehicles, type GetVehiclesFilters } from "@/lib/vehicles";

const vehicleTypes = new Set<string>(Object.values(VehicleType));

function parseActiveFilter(activeRaw: string | null): boolean | undefined | null {
  if (activeRaw === null) {
    return undefined;
  }

  const normalized = activeRaw.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeRaw = url.searchParams.get("type");
  const activeRaw = url.searchParams.get("active");
  const pickupDate = url.searchParams.get("pickupDate")?.trim() ?? "";
  const pickupTime = url.searchParams.get("pickupTime")?.trim() ?? "";
  const returnDate = url.searchParams.get("returnDate")?.trim() ?? "";
  const returnTime = url.searchParams.get("returnTime")?.trim() ?? "";
  const sessionKey = url.searchParams.get("sessionKey")?.trim() ?? "";

  const filters: GetVehiclesFilters = {};

  if (typeRaw) {
    if (!vehicleTypes.has(typeRaw)) {
      return NextResponse.json(
        {
          success: false as const,
          message: "Invalid vehicle type filter",
        },
        { status: 400 },
      );
    }
    filters.type = typeRaw as GetVehiclesFilters["type"];
  }

  const activeFilter = parseActiveFilter(activeRaw);
  if (activeFilter === null) {
    return NextResponse.json(
      {
        success: false as const,
        message: "Invalid active filter. Use true or false.",
      },
      { status: 400 },
    );
  }
  if (activeFilter !== undefined) {
    filters.active = activeFilter;
  }

  try {
    const result = await getVehicles(filters);
    const hasFullRentalWindow =
      pickupDate.length > 0 &&
      pickupTime.length > 0 &&
      returnDate.length > 0 &&
      returnTime.length > 0;

    let vehicles = result.vehicles;

    if (hasFullRentalWindow) {
      // Race the availability enrichment against a 12-second client-side timeout.
      // The pg pool's statement_timeout (30 s) and connectionTimeoutMillis (15 s)
      // are the primary guards, but this ensures the route never hangs beyond 12 s.
      const enrichPromise = enrichVehicleListWithRentalWindow(result.vehicles, {
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
        viewerSessionKey: sessionKey || undefined,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Availability check timed out")), 12_000),
      );

      try {
        const enriched = await Promise.race([enrichPromise, timeoutPromise]);
        vehicles = enriched.filter((v) =>
          isBookableRentalWindowStatus(v.rentalWindowStatus),
        );
      } catch (enrichError) {
        // Availability enrichment timed out or failed — fall back to returning all vehicles
        // without rental-window status so the UI is still usable.
        console.warn("[vehicles] Availability enrichment failed, returning unenriched list", enrichError);
        vehicles = result.vehicles;
      }
    }

    return NextResponse.json({
      success: true as const,
      vehicles,
      brands: await getDistinctActiveVehicleBrands(),
    });
  } catch (error) {
    console.error("[vehicles] Failed to fetch vehicles", error);
    return NextResponse.json(
      {
        success: false as const,
        message: "Unable to load vehicles right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
