import { combineDateAndTime } from "@/lib/booking/bookingSubmissionSchema";
import { findConflictingBlocks } from "@/lib/availability/findConflictingBlocks";
import { findConflictingReservationHolds } from "@/lib/availability/findConflictingReservationHolds";
import type { VehicleAvailabilityResult } from "@/lib/availability/types";
import { availableColorsFromUnitsMap } from "@/lib/vehicle-units/batchGetAvailableColorsForVehicles";
import { batchFindAvailableVehicleUnits } from "@/lib/vehicle-units/findAvailableVehicleUnits";
import type { VehicleListItemDto, VehicleRentalWindowStatus } from "@/lib/vehicles/types";

function holdsOnlyConflict(result: VehicleAvailabilityResult): boolean {
  return (
    result.conflictingReservationHolds.length > 0 &&
    result.conflictingBookings.length === 0 &&
    result.conflictingBlocks.length === 0
  );
}

function classifyRentalWindow(
  result: VehicleAvailabilityResult,
  viewerSessionKey: string | undefined,
): VehicleRentalWindowStatus {
  if (result.isAvailable) {
    return "available";
  }
  if (!holdsOnlyConflict(result)) {
    return "unavailable";
  }
  if (
    viewerSessionKey &&
    result.conflictingReservationHolds.length > 0 &&
    result.conflictingReservationHolds.every((h) => h.sessionKey === viewerSessionKey)
  ) {
    return "reserved_you";
  }
  return "reserved_other";
}

function buildAvailabilityResult(
  hasAvailableUnit: boolean,
  blocks: VehicleAvailabilityResult["conflictingBlocks"],
  holds: VehicleAvailabilityResult["conflictingReservationHolds"],
): VehicleAvailabilityResult {
  const listingWideHolds = holds.filter((hold) => !hold.vehicleUnitId);
  const hasVehicleWideBlock = blocks.some((block) => block.vehicleId !== null);
  const isAvailable = hasAvailableUnit && !hasVehicleWideBlock && listingWideHolds.length === 0;

  const isReservedByActiveHold =
    !isAvailable && hasAvailableUnit && !hasVehicleWideBlock && holds.length > 0;

  return {
    isAvailable,
    conflictingBookings: [],
    conflictingBlocks: blocks,
    conflictingReservationHolds: holds,
    reason: isAvailable
      ? "Available"
      : isReservedByActiveHold
        ? "Selected vehicle is temporarily reserved by another customer"
        : hasAvailableUnit
          ? "Selected vehicle is not available for the chosen dates"
          : "No physical units are available for the chosen dates",
  };
}

export type EnrichVehicleListRentalWindowInput = {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  viewerSessionKey?: string | null;
};

export async function enrichVehicleListWithRentalWindow(
  vehicles: VehicleListItemDto[],
  input: EnrichVehicleListRentalWindowInput,
): Promise<VehicleListItemDto[]> {
  const pickupDate = input.pickupDate.trim();
  const pickupTime = input.pickupTime.trim();
  const returnDate = input.returnDate.trim();
  const returnTime = input.returnTime.trim();

  const requestedStart = combineDateAndTime(pickupDate, pickupTime);
  const requestedEnd = combineDateAndTime(returnDate, returnTime);
  if (!requestedStart || !requestedEnd || requestedStart >= requestedEnd) {
    return vehicles;
  }

  const viewerSessionKey = input.viewerSessionKey?.trim() || undefined;
  const active = vehicles.filter((v) => v.isActive);
  const ids = active.map((v) => v.id);
  const uniqueTypes = [...new Set(active.map((v) => v.vehicleType))];

  // One batched unit query + conflict queries — colors reuse the same unit map.
  const [allBlocks, allHolds, availableUnitsByVehicle] = await Promise.all([
    findConflictingBlocks({
      requestedStart,
      requestedEnd,
      vehicleIds: ids,
      vehicleTypes: uniqueTypes,
    }),
    findConflictingReservationHolds({
      requestedStart,
      requestedEnd,
      vehicleIds: ids,
    }),
    batchFindAvailableVehicleUnits({
      vehicleIds: ids,
      requestedStart,
      requestedEnd,
      excludeSessionKey: viewerSessionKey,
    }),
  ]);

  const colorsByVehicleId = availableColorsFromUnitsMap(ids, availableUnitsByVehicle);

  return vehicles.map((vehicle) => {
    if (!vehicle.isActive) {
      return {
        ...vehicle,
        rentalWindowStatus: "unavailable" as const,
        availableColors: [],
      };
    }

    const availableUnits = availableUnitsByVehicle.get(vehicle.id) ?? [];
    const holds = allHolds.filter((h) => h.vehicleId === vehicle.id);
    const blocks = allBlocks.filter(
      (b) => b.vehicleId === vehicle.id || b.vehicleType === vehicle.vehicleType,
    );
    const result = buildAvailabilityResult(availableUnits.length > 0, blocks, holds);

    return {
      ...vehicle,
      rentalWindowStatus: classifyRentalWindow(result, viewerSessionKey),
      availableColors: colorsByVehicleId.get(vehicle.id) ?? [],
    };
  });
}
