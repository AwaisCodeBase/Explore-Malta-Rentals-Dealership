import { VehicleType } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { checkVehicleAvailability, checkVehicleTypeAvailability } from "@/lib/availability";
import { combineDateAndTime } from "@/lib/booking/bookingSubmissionSchema";
import { parseVehicleColorValue } from "@/features/vehicles/lib/vehicle-color";
import { getAvailableColorsForVehicle } from "@/lib/vehicle-units";

const vehicleTypes = new Set<string>(Object.values(VehicleType));

function normalizeQueryValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseAvailabilityRange(url: URL): { requestedStart: Date; requestedEnd: Date } | null {
  const pickupDate = normalizeQueryValue(url.searchParams.get("pickupDate"));
  const pickupTime = normalizeQueryValue(url.searchParams.get("pickupTime"));
  const returnDate = normalizeQueryValue(url.searchParams.get("returnDate"));
  const returnTime = normalizeQueryValue(url.searchParams.get("returnTime"));

  if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
    return null;
  }

  const requestedStart = combineDateAndTime(pickupDate, pickupTime);
  const requestedEnd = combineDateAndTime(returnDate, returnTime);
  if (!requestedStart || !requestedEnd || requestedStart >= requestedEnd) {
    return null;
  }

  return { requestedStart, requestedEnd };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vehicleId = normalizeQueryValue(url.searchParams.get("vehicleId"));
  const vehicleTypeRaw = normalizeQueryValue(url.searchParams.get("vehicleType"));
  const colorRaw = normalizeQueryValue(url.searchParams.get("color"));
  const sessionKey = normalizeQueryValue(url.searchParams.get("sessionKey"));
  const range = parseAvailabilityRange(url);

  if (!range) {
    return NextResponse.json(
      {
        success: false as const,
        message: "Invalid or missing pickup/return date and time",
      },
      { status: 400 },
    );
  }

  if (!vehicleId && !vehicleTypeRaw) {
    return NextResponse.json(
      {
        success: false as const,
        message: "Provide either vehicleId or vehicleType",
      },
      { status: 400 },
    );
  }

  if (vehicleTypeRaw && !vehicleTypes.has(vehicleTypeRaw)) {
    return NextResponse.json(
      {
        success: false as const,
        message: "Invalid vehicleType",
      },
      { status: 400 },
    );
  }

  try {
    if (vehicleId) {
      const parsedColor = colorRaw ? parseVehicleColorValue(colorRaw) : undefined;
      if (colorRaw && !parsedColor) {
        return NextResponse.json(
          {
            success: false as const,
            message: "Invalid color",
          },
          { status: 400 },
        );
      }

      const result = await checkVehicleAvailability({
        vehicleId,
        requestedStart: range.requestedStart,
        requestedEnd: range.requestedEnd,
        vehicleType: vehicleTypeRaw ? (vehicleTypeRaw as VehicleType) : undefined,
        color: parsedColor ?? undefined,
        excludeSessionKey: sessionKey ?? undefined,
      });

      const availableColors = await getAvailableColorsForVehicle({
        vehicleId,
        requestedStart: range.requestedStart,
        requestedEnd: range.requestedEnd,
        excludeSessionKey: sessionKey ?? undefined,
      });

      const availabilityStatus = result.isAvailable
        ? "available"
        : result.conflictingReservationHolds.length > 0 &&
            result.conflictingBookings.length === 0 &&
            result.conflictingBlocks.length === 0
          ? "reserved_temporarily"
          : "unavailable";

      return NextResponse.json({
        success: true as const,
        isAvailable: result.isAvailable,
        availabilityStatus,
        availableColors,
        message: result.reason ?? (result.isAvailable ? "Available" : "Selected vehicle is not available"),
      });
    }

    const result = await checkVehicleTypeAvailability({
      vehicleType: vehicleTypeRaw as VehicleType,
      requestedStart: range.requestedStart,
      requestedEnd: range.requestedEnd,
    });

    const availabilityStatus = result.isAvailable
      ? "available"
      : result.conflictingReservationHolds.length > 0 &&
          result.conflictingBookings.length === 0 &&
          result.conflictingBlocks.length === 0
        ? "reserved_temporarily"
        : "unavailable";

    return NextResponse.json({
      success: true as const,
      isAvailable: result.isAvailable,
      availabilityStatus,
      availableVehicleIds: result.availableVehicleIds,
      availableCount: result.availableCount,
      totalMatchingVehicles: result.totalMatchingVehicles,
      message: result.reason ?? (result.isAvailable ? "Available" : "Not available"),
    });
  } catch (error) {
    console.error("[availability] Failed to resolve availability", error);
    return NextResponse.json(
      {
        success: false as const,
        message: "Unable to check availability right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
