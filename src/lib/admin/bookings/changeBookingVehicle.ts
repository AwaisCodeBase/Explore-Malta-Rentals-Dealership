import { Prisma, type BookingStatus } from "@/generated/prisma/index";

import { getAdminBookingById } from "@/lib/admin/bookings/getAdminBookingById";
import {
  calculateVehicleChangePrice,
  type VehicleChangePriceMode,
  type VehicleChangePricing,
} from "@/lib/admin/bookings/calculate-vehicle-change-price";
import type {
  ChangeBookingVehicleFailure,
  ChangeBookingVehicleOption,
  ChangeBookingVehicleOptions,
  ChangeBookingVehiclePreview,
} from "@/lib/admin/bookings/change-booking-vehicle-types";
import {
  isBookableReplacementVehicle,
  isVehicleChangeBookingStatus,
} from "@/lib/admin/bookings/vehicle-change-eligibility";
import { recordBookingStatusChange } from "@/lib/admin/bookings/lifecycle/recordBookingStatusChange";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { checkVehicleAvailability } from "@/lib/availability/checkVehicleAvailability";
import { batchCheckVehicleAvailabilityForList } from "@/lib/availability/batchCheckVehicleAvailabilityForList";
import { BLOCKING_BOOKING_STATUSES, type AvailabilityDbClient } from "@/lib/availability/types";
import { isLicenseAllowedForVehicle } from "@/features/booking-flow/lib/license-categories";
import {
  colorsMatch,
  formatVehicleColorLabel,
  parseVehicleColorValue,
} from "@/features/vehicles/lib/vehicle-color";
import type { VehicleListItemDto } from "@/lib/vehicles/types";
import { roundPricingAmount } from "@/lib/pricing/duration-pricing";
import { prisma } from "@/lib/prisma";
import {
  deleteOccupancyForBooking,
  insertBookingOccupancy,
  isVehicleUnitOccupancyExclusionError,
} from "@/lib/vehicle-unit-occupancy";
import {
  assignAvailableVehicleUnit,
  batchGetAvailableColorsForVehicles,
  findAvailableVehicleUnits,
  getAvailableColorsForVehicle,
  NoAvailableVehicleUnitError,
  type AvailableColorDto,
} from "@/lib/vehicle-units";

export type { ChangeBookingVehicleOptions, ChangeBookingVehiclePreview } from "@/lib/admin/bookings/change-booking-vehicle-types";
export type { VehicleChangePriceMode } from "@/lib/admin/bookings/calculate-vehicle-change-price";

export type ListChangeBookingVehicleOptionsResult =
  | { ok: true; options: ChangeBookingVehicleOptions }
  | ChangeBookingVehicleFailure;

export type PreviewChangeBookingVehicleResult =
  | { ok: true; preview: ChangeBookingVehiclePreview }
  | ChangeBookingVehicleFailure;

export type ChangeBookingVehicleResult =
  | { ok: true; booking: AdminBookingDetail }
  | ChangeBookingVehicleFailure;

const changeBookingSelect = {
  id: true,
  bookingReference: true,
  status: true,
  updatedAt: true,
  vehicleId: true,
  vehicleUnitId: true,
  vehicleNameSnapshot: true,
  vehicleLicensePlateSnapshot: true,
  vehicleColorSnapshot: true,
  vehicleType: true,
  pickupDateTime: true,
  returnDateTime: true,
  billableDays: true,
  customerLicenseCategory: true,
  storageBoxSelected: true,
  rentalCost: true,
  subtotal: true,
  totalDueOnline: true,
  totalDueLater: true,
  depositAmount: true,
  depositMethod: true,
  hotelDiscountPercentSnapshot: true,
  hotelDiscountAmountSnapshot: true,
  baseDailyRateSnapshot: true,
  appliedDailyRateSnapshot: true,
  extensions: { select: { id: true } },
} satisfies Prisma.BookingSelect;

type ChangeBookingRow = Prisma.BookingGetPayload<{ select: typeof changeBookingSelect }>;

const replacementVehicleSelect = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  model: true,
  vehicleType: true,
  engineCc: true,
  isActive: true,
  catalogStatus: true,
  baseDailyRate: true,
  supportsStorageBox: true,
  displayOrder: true,
} satisfies Prisma.VehicleSelect;

type ReplacementVehicle = Prisma.VehicleGetPayload<{ select: typeof replacementVehicleSelect }>;

type ChangeDb = Prisma.TransactionClient;

type ProposedUnit = {
  id: string;
  licensePlate: string;
  color: string | null;
};

type PreparedChange =
  | {
      ok: true;
      booking: ChangeBookingRow;
      vehicle: ReplacementVehicle;
      colorLabel: string | null;
      assignsUnitNow: boolean;
      proposedUnit: ProposedUnit | null;
      pricing: VehicleChangePricing;
    }
  | ChangeBookingVehicleFailure;

function failure(reason: ChangeBookingVehicleFailure["reason"], status?: BookingStatus): ChangeBookingVehicleFailure {
  return status ? { ok: false, reason, status } : { ok: false, reason };
}

function money(value: { toNumber(): number } | null | undefined): number | null {
  return value == null ? null : value.toNumber();
}

function euro(amount: number): string {
  return `EUR ${amount.toFixed(2)}`;
}

function unitText(plate: string | null, color: string | null): string {
  const parts = [plate, color].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(", ") : "no unit assigned";
}

function isTransactionWriteConflictError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

function requestedColorLabel(color: string | null | undefined): string | null {
  const trimmed = color?.trim();
  if (!trimmed) return null;
  return formatVehicleColorLabel(trimmed) || null;
}

function colorIsListed(color: string, colors: readonly AvailableColorDto[]): boolean {
  return colors.some((option) => colorsMatch(option.value, color) || colorsMatch(option.label, color));
}

function toListItem(vehicle: ReplacementVehicle): VehicleListItemDto {
  return {
    id: vehicle.id,
    name: vehicle.name,
    slug: vehicle.slug,
    vehicleType: vehicle.vehicleType,
    engineCc: vehicle.engineCc,
    brand: vehicle.brand,
    model: vehicle.model,
    color: null,
    shortDescription: null,
    description: null,
    mainImageUrl: null,
    isActive: vehicle.isActive,
    displayOrder: vehicle.displayOrder,
    baseDailyRate: vehicle.baseDailyRate.toNumber(),
    helmetIncludedCount: 0,
    supportsStorageBox: vehicle.supportsStorageBox,
  };
}

async function loadChangeBooking(db: Pick<ChangeDb, "booking">, bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    select: changeBookingSelect,
  });
}

function replacementRejection(
  booking: ChangeBookingRow,
  vehicle: ReplacementVehicle | null,
): ChangeBookingVehicleFailure | null {
  if (!vehicle) {
    return failure("vehicle_not_found");
  }
  if (booking.vehicleId && vehicle.id === booking.vehicleId) {
    return failure("same_vehicle");
  }
  if (!isBookableReplacementVehicle(vehicle)) {
    return failure("vehicle_inactive");
  }
  if (
    !isLicenseAllowedForVehicle(
      booking.customerLicenseCategory,
      vehicle.vehicleType,
      vehicle.name,
      vehicle.engineCc,
    )
  ) {
    return failure("incompatible_license");
  }
  if (booking.storageBoxSelected && !vehicle.supportsStorageBox) {
    return failure("incompatible_storage");
  }
  return null;
}

async function prepareVehicleChange(
  db: ChangeDb,
  booking: ChangeBookingRow,
  vehicleId: string,
  requestedColor: string | null | undefined,
  priceMode: VehicleChangePriceMode,
): Promise<PreparedChange> {
  if (!isVehicleChangeBookingStatus(booking.status)) {
    return failure("invalid_status", booking.status);
  }

  const vehicle = await db.vehicle.findUnique({
    where: { id: vehicleId },
    select: replacementVehicleSelect,
  });
  const rejected = replacementRejection(booking, vehicle);
  if (rejected || !vehicle) {
    return rejected ?? failure("vehicle_not_found");
  }

  const colors = await getAvailableColorsForVehicle(
    {
      vehicleId: vehicle.id,
      requestedStart: booking.pickupDateTime,
      requestedEnd: booking.returnDateTime,
    },
    db,
  );
  const colorLabel = requestedColorLabel(requestedColor);
  if (colors.length > 0) {
    if (!colorLabel || !colorIsListed(colorLabel, colors)) {
      return failure("invalid_color");
    }
  } else if (colorLabel) {
    const anyUnit = await checkVehicleAvailability(
      {
        vehicleId: vehicle.id,
        requestedStart: booking.pickupDateTime,
        requestedEnd: booking.returnDateTime,
        excludeBookingId: booking.id,
      },
      db as unknown as AvailabilityDbClient,
      db,
    );
    return failure(anyUnit.isAvailable ? "invalid_color" : "no_availability");
  }

  const availabilityColor = colorLabel ? parseVehicleColorValue(colorLabel) ?? undefined : undefined;
  const availability = await checkVehicleAvailability(
    {
      vehicleId: vehicle.id,
      requestedStart: booking.pickupDateTime,
      requestedEnd: booking.returnDateTime,
      color: availabilityColor,
      excludeBookingId: booking.id,
    },
    db as unknown as AvailabilityDbClient,
    db,
  );
  if (!availability.isAvailable) {
    return failure("no_availability");
  }

  const assignsUnitNow = Boolean(booking.vehicleUnitId);
  let proposedUnit: ProposedUnit | null = null;
  if (assignsUnitNow) {
    const units = await findAvailableVehicleUnits(
      {
        vehicleId: vehicle.id,
        requestedStart: booking.pickupDateTime,
        requestedEnd: booking.returnDateTime,
        color: availabilityColor,
        excludeBookingId: booking.id,
      },
      db,
    );
    const nextUnit = units[0];
    if (!nextUnit) {
      return failure(colorLabel ? "invalid_color" : "no_availability");
    }
    proposedUnit = {
      id: nextUnit.id,
      licensePlate: nextUnit.licensePlate,
      color: nextUnit.color,
    };
  }

  const priced = calculateVehicleChangePrice({
    priceMode,
    hasExtensions: booking.extensions.length > 0,
    billableDays: booking.billableDays,
    currentRentalCost: booking.rentalCost.toNumber(),
    currentSubtotal: booking.subtotal.toNumber(),
    currentTotalDueOnline: booking.totalDueOnline.toNumber(),
    currentTotalDueLater: booking.totalDueLater.toNumber(),
    depositAmount: booking.depositAmount.toNumber(),
    depositMethod: booking.depositMethod,
    hotelDiscountPercentSnapshot: money(booking.hotelDiscountPercentSnapshot),
    hotelDiscountAmountSnapshot: money(booking.hotelDiscountAmountSnapshot),
    replacementBaseDailyRate: vehicle.baseDailyRate.toNumber(),
  });
  if (!priced.ok) {
    return failure(priced.reason);
  }

  return {
    ok: true,
    booking,
    vehicle,
    colorLabel,
    assignsUnitNow,
    proposedUnit,
    pricing: priced.pricing,
  };
}

function buildPreview(prepared: Extract<PreparedChange, { ok: true }>): ChangeBookingVehiclePreview {
  const { booking, vehicle, pricing, proposedUnit, colorLabel } = prepared;
  const proposedColor = proposedUnit?.color
    ? formatVehicleColorLabel(proposedUnit.color) || null
    : colorLabel;

  return {
    bookingReference: booking.bookingReference,
    currentVehicleName: booking.vehicleNameSnapshot ?? "Current vehicle",
    currentColor: booking.vehicleColorSnapshot,
    currentUnitLabel: booking.vehicleLicensePlateSnapshot,
    replacementVehicleId: vehicle.id,
    replacementVehicleName: vehicle.name,
    replacementVehicleType: vehicle.vehicleType,
    vehicleTypeChanged: booking.vehicleType !== vehicle.vehicleType,
    selectedColor: colorLabel,
    pickupDateTime: booking.pickupDateTime.toISOString(),
    returnDateTime: booking.returnDateTime.toISOString(),
    assignsUnitNow: prepared.assignsUnitNow,
    proposedUnitLabel: proposedUnit?.licensePlate ?? null,
    proposedColor,
    priceMode: pricing.priceMode,
    currentSubtotal: pricing.currentSubtotal,
    calculatedSubtotal: pricing.calculatedSubtotal,
    priceDifference: pricing.priceDifference,
    finalSubtotal: pricing.finalSubtotal,
    calculatedAppliedDailyRate: pricing.calculatedAppliedDailyRate,
    duesUpdated: pricing.duesUpdated,
    canApplyCatalogPrice: booking.extensions.length === 0,
    expectedUpdatedAt: booking.updatedAt.toISOString(),
  };
}

/**
 * A reserved unit is released only when nothing else still occupies it.
 * Available units stay available: date locks live on occupancy, not on that status.
 * Maintenance and out-with-customer states are left untouched.
 */
async function releaseReservedUnitIfIdle(db: ChangeDb, vehicleUnitId: string, bookingId: string): Promise<void> {
  const unit = await db.vehicleUnit.findUnique({
    where: { id: vehicleUnitId },
    select: { status: true },
  });
  if (!unit || unit.status !== "RESERVED") {
    return;
  }

  const [occupancyCount, bookingCount, holdCount] = await Promise.all([
    db.vehicleUnitOccupancy.count({ where: { vehicleUnitId } }),
    db.booking.count({
      where: {
        id: { not: bookingId },
        vehicleUnitId,
        status: { in: [...BLOCKING_BOOKING_STATUSES] },
      },
    }),
    db.reservationHold.count({
      where: {
        vehicleUnitId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  if (occupancyCount === 0 && bookingCount === 0 && holdCount === 0) {
    await db.vehicleUnit.update({
      where: { id: vehicleUnitId },
      data: { status: "AVAILABLE" },
    });
  }
}

function auditNote(
  booking: ChangeBookingRow,
  vehicleName: string,
  nextPlate: string | null,
  nextColor: string | null,
  pricing: VehicleChangePricing,
): string {
  const priceSentence =
    pricing.priceMode === "keep_existing"
      ? `Agreed booking price kept at ${euro(pricing.finalSubtotal)}.`
      : `Booking charges changed from ${euro(pricing.currentSubtotal)} to ${euro(pricing.finalSubtotal)}.`;

  return `Changed booked vehicle from ${booking.vehicleNameSnapshot ?? "previous vehicle"} (${unitText(
    booking.vehicleLicensePlateSnapshot,
    booking.vehicleColorSnapshot,
  )}) to ${vehicleName} (${unitText(nextPlate, nextColor)}). ${priceSentence}`;
}

export async function listChangeBookingVehicleOptions(
  bookingId: string,
): Promise<ListChangeBookingVehicleOptionsResult> {
  const booking = await loadChangeBooking(prisma, bookingId);
  if (!booking) {
    return failure("not_found");
  }
  if (!isVehicleChangeBookingStatus(booking.status)) {
    return failure("invalid_status", booking.status);
  }

  const candidates = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      catalogStatus: { in: ["AVAILABLE", "BOOKED"] },
      ...(booking.vehicleId ? { id: { not: booking.vehicleId } } : {}),
    },
    select: replacementVehicleSelect,
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  const compatible = candidates.filter((vehicle) => replacementRejection(booking, vehicle) === null);
  const availability = await batchCheckVehicleAvailabilityForList(
    compatible.map(toListItem),
    booking.pickupDateTime,
    booking.returnDateTime,
  );
  const available = compatible.filter((vehicle) => availability.get(vehicle.id)?.isAvailable);
  const colorsByVehicle = await batchGetAvailableColorsForVehicles({
    vehicleIds: available.map((vehicle) => vehicle.id),
    requestedStart: booking.pickupDateTime,
    requestedEnd: booking.returnDateTime,
  });

  const vehicles: ChangeBookingVehicleOption[] = available.map((vehicle) => {
    const colors = colorsByVehicle.get(vehicle.id) ?? [];
    return {
      id: vehicle.id,
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      vehicleType: vehicle.vehicleType,
      engineCc: vehicle.engineCc,
      baseDailyRate: vehicle.baseDailyRate.toNumber(),
      supportsStorageBox: vehicle.supportsStorageBox,
      requiresColor: colors.length > 0,
      colors,
    };
  });

  return {
    ok: true,
    options: {
      bookingReference: booking.bookingReference,
      currentVehicleId: booking.vehicleId,
      currentVehicleName: booking.vehicleNameSnapshot ?? "Current vehicle",
      currentColor: booking.vehicleColorSnapshot,
      currentUnitLabel: booking.vehicleLicensePlateSnapshot,
      hasAssignedUnit: Boolean(booking.vehicleUnitId),
      pickupDateTime: booking.pickupDateTime.toISOString(),
      returnDateTime: booking.returnDateTime.toISOString(),
      currentSubtotal: booking.subtotal.toNumber(),
      canApplyCatalogPrice: booking.extensions.length === 0,
      expectedUpdatedAt: booking.updatedAt.toISOString(),
      vehicles,
    },
  };
}

export async function previewChangeBookingVehicle(
  bookingId: string,
  vehicleId: string,
  color: string | null | undefined,
  priceMode: VehicleChangePriceMode,
): Promise<PreviewChangeBookingVehicleResult> {
  const booking = await loadChangeBooking(prisma, bookingId);
  if (!booking) {
    return failure("not_found");
  }

  const prepared = await prepareVehicleChange(
    prisma as unknown as ChangeDb,
    booking,
    vehicleId,
    color,
    priceMode,
  );
  if (!prepared.ok) {
    return prepared;
  }

  return { ok: true, preview: buildPreview(prepared) };
}

async function changeBookingVehicleOnce(
  bookingId: string,
  vehicleId: string,
  color: string | null | undefined,
  priceMode: VehicleChangePriceMode,
  adminUserId: string,
  expectedUpdatedAt: Date,
): Promise<ChangeBookingVehicleResult> {
  try {
    const outcome = await prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "Booking" WHERE "id" = ${bookingId} FOR UPDATE
        `;
        if (locked.length === 0) {
          return failure("not_found");
        }

        const booking = await loadChangeBooking(tx, bookingId);
        if (!booking) {
          return failure("not_found");
        }
        if (booking.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
          return failure("concurrent_update");
        }

        const prepared = await prepareVehicleChange(tx, booking, vehicleId, color, priceMode);
        if (!prepared.ok) {
          return prepared;
        }

        const availabilityColor = prepared.colorLabel
          ? parseVehicleColorValue(prepared.colorLabel) ?? undefined
          : undefined;
        let assignedLicensePlate: string | null = null;
        let assignedColor: string | null = prepared.colorLabel;
        let assignedUnitId: string | null = null;

        if (prepared.assignsUnitNow && booking.vehicleUnitId) {
          await deleteOccupancyForBooking(tx, booking.id);
          await releaseReservedUnitIfIdle(tx, booking.vehicleUnitId, booking.id);
          const assigned = await assignAvailableVehicleUnit(
            {
              vehicleId: prepared.vehicle.id,
              requestedStart: booking.pickupDateTime,
              requestedEnd: booking.returnDateTime,
              color: availabilityColor,
              excludeBookingId: booking.id,
            },
            tx,
          );
          assignedUnitId = assigned.vehicleUnitId;
          assignedLicensePlate = assigned.licensePlate;
          assignedColor = assigned.color ? formatVehicleColorLabel(assigned.color) || prepared.colorLabel : prepared.colorLabel;
        }

        const pricing = prepared.pricing;
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            vehicleId: prepared.vehicle.id,
            vehicleUnitId: assignedUnitId,
            vehicleNameSnapshot: prepared.vehicle.name,
            vehicleLicensePlateSnapshot: assignedLicensePlate,
            vehicleColorSnapshot: assignedColor,
            vehicleType: prepared.vehicle.vehicleType,
            vehicleTypeSnapshot: prepared.vehicle.vehicleType,
            ...(pricing.priceMode === "apply_catalog"
              ? {
                  baseDailyRateSnapshot: pricing.calculatedBaseDailyRate,
                  durationDiscountPercentSnapshot: pricing.calculatedDurationDiscountPercent,
                  appliedDailyRateSnapshot: pricing.calculatedAppliedDailyRate,
                  rentalCost: pricing.calculatedRentalCost,
                  subtotal: pricing.finalSubtotal,
                  totalDueOnline: pricing.finalTotalDueOnline,
                  totalDueLater: pricing.finalTotalDueLater,
                  ...(pricing.hotelDiscountApplied
                    ? {
                        hotelDiscountAmountSnapshot: pricing.calculatedHotelDiscountAmount,
                        subtotalAfterHotelDiscountSnapshot:
                          pricing.finalRentalAfterHotelDiscount ??
                          roundPricingAmount(pricing.calculatedRentalCost - pricing.calculatedHotelDiscountAmount),
                      }
                    : {}),
                }
              : {}),
          },
        });

        if (assignedUnitId) {
          await insertBookingOccupancy(tx, {
            vehicleUnitId: assignedUnitId,
            pickupAt: booking.pickupDateTime,
            returnAt: booking.returnDateTime,
            bookingId: booking.id,
          });
        }

        await recordBookingStatusChange(tx, {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: booking.status,
          adminUserId,
          note: auditNote(booking, prepared.vehicle.name, assignedLicensePlate, assignedColor, pricing),
        });

        return { ok: true as const };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20_000,
      },
    );

    if (!outcome.ok) {
      return outcome;
    }
  } catch (error) {
    if (error instanceof NoAvailableVehicleUnitError) {
      return failure(error.color ? "invalid_color" : "no_availability");
    }
    if (isVehicleUnitOccupancyExclusionError(error)) {
      return failure("no_availability");
    }
    throw error;
  }

  const booking = await getAdminBookingById(bookingId);
  if (!booking) {
    return failure("not_found");
  }
  return { ok: true, booking };
}

export async function changeBookingVehicle(
  bookingId: string,
  vehicleId: string,
  color: string | null | undefined,
  priceMode: VehicleChangePriceMode,
  adminUserId: string,
  expectedUpdatedAt: Date,
): Promise<ChangeBookingVehicleResult> {
  const retryLimit = 3;
  for (let attempt = 0; attempt < retryLimit; attempt += 1) {
    try {
      return await changeBookingVehicleOnce(
        bookingId,
        vehicleId,
        color,
        priceMode,
        adminUserId,
        expectedUpdatedAt,
      );
    } catch (error) {
      if (!isTransactionWriteConflictError(error) || attempt + 1 >= retryLimit) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 40 * (attempt + 1));
      });
    }
  }

  return failure("concurrent_update");
}
