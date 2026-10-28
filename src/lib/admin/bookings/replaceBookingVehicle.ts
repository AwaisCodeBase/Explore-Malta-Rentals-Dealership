import { Prisma, type BookingStatus, type VehicleUnitStatus } from "@/generated/prisma/index";

import { getAdminBookingById } from "@/lib/admin/bookings/getAdminBookingById";
import { recordBookingStatusChange } from "@/lib/admin/bookings/lifecycle/recordBookingStatusChange";
import type {
  ReplaceBookingVehicleFailure,
  ReplaceBookingVehicleInput,
  ReplaceBookingVehicleOptions,
  ReplacementVehicleUnitOption,
} from "@/lib/admin/bookings/replace-booking-vehicle-types";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { isBookableReplacementVehicle } from "@/lib/admin/bookings/vehicle-change-eligibility";
import {
  isVehicleReplacementBookingStatus,
  type ReplacementReason,
  type ReplacementUnitDisposition,
} from "@/lib/admin/bookings/vehicle-replacement-eligibility";
import { findConflictingBlocks } from "@/lib/availability/findConflictingBlocks";
import type { AvailabilityDbClient } from "@/lib/availability/types";
import { isLicenseAllowedForVehicle } from "@/features/booking-flow/lib/license-categories";
import { formatVehicleColorLabel } from "@/features/vehicles/lib/vehicle-color";
import { prisma } from "@/lib/prisma";
import {
  closeBookingUnitOccupancy,
  deleteOccupancyById,
  insertBookingOccupancy,
  isVehicleUnitOccupancyExclusionError,
} from "@/lib/vehicle-unit-occupancy";
import { batchFindAvailableVehicleUnits, findAvailableVehicleUnits } from "@/lib/vehicle-units";
import { isAssignableVehicleUnit } from "@/lib/vehicle-units/isAssignableVehicleUnit";

export type { ReplaceBookingVehicleOptions } from "@/lib/admin/bookings/replace-booking-vehicle-types";

export type ListReplaceBookingVehicleOptionsResult =
  | { ok: true; options: ReplaceBookingVehicleOptions }
  | ReplaceBookingVehicleFailure;

export type ReplaceBookingVehicleResult =
  | { ok: true; booking: AdminBookingDetail }
  | ReplaceBookingVehicleFailure;

const bookingSelect = {
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
  vehicleTypeSnapshot: true,
  pickupDateTime: true,
  returnDateTime: true,
  handoverDateTime: true,
  customerLicenseCategory: true,
  storageBoxSelected: true,
  subtotal: true,
  vehicleUnit: { select: { status: true } },
} satisfies Prisma.BookingSelect;

type ReplacementBooking = Prisma.BookingGetPayload<{ select: typeof bookingSelect }>;

const vehicleSelect = {
  id: true,
  name: true,
  brand: true,
  model: true,
  vehicleType: true,
  engineCc: true,
  isActive: true,
  catalogStatus: true,
  supportsStorageBox: true,
} satisfies Prisma.VehicleSelect;

type ReplacementVehicle = Prisma.VehicleGetPayload<{ select: typeof vehicleSelect }>;

type ReplacementDb = Prisma.TransactionClient;

const REASON_LABELS: Record<ReplacementReason, string> = {
  mechanical_issue: "Mechanical issue",
  damage: "Damage/problem",
  customer_requested: "Customer-requested replacement",
  other: "Other",
};

const DISPOSITION_LABELS: Record<ReplacementUnitDisposition, string> = {
  AVAILABLE: "Available",
  MAINTENANCE: "Maintenance",
  NOT_AVAILABLE: "Not available",
};

function failure(
  reason: ReplaceBookingVehicleFailure["reason"],
  status?: BookingStatus,
  returnDateTime?: Date,
): ReplaceBookingVehicleFailure {
  return {
    ok: false,
    reason,
    ...(status ? { status } : {}),
    ...(returnDateTime ? { returnDateTime } : {}),
  };
}

function euro(amount: number): string {
  return `EUR ${amount.toFixed(2)}`;
}

function unitText(plate: string | null, color: string | null): string {
  const parts = [plate, color].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(", ") : "no plate recorded";
}

function colorLabel(color: string | null | undefined): string | null {
  const label = formatVehicleColorLabel(color);
  return label || null;
}

function isTransactionWriteConflictError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code === "P2034") {
    return true;
  }
  if (error.code === "P2010") {
    const message = `${error.message} ${JSON.stringify(error.meta ?? {})}`;
    return message.includes("40001") || message.toLowerCase().includes("could not serialize");
  }
  return false;
}

function hasRemainingPeriod(replacementAt: Date, returnAt: Date): boolean {
  return replacementAt.getTime() < returnAt.getTime();
}

async function loadReplacementBooking(db: Pick<ReplacementDb, "booking">, bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    select: bookingSelect,
  });
}

function originalStartedAt(
  booking: ReplacementBooking,
  occupancyPickup: Date | null,
  replacementAt: Date,
): Date {
  const candidates = [booking.handoverDateTime, occupancyPickup, booking.pickupDateTime];
  for (const candidate of candidates) {
    if (candidate && candidate.getTime() < replacementAt.getTime()) {
      return candidate;
    }
  }
  return replacementAt;
}

/**
 * End every still-open lock on the unit the customer is giving back.
 * An interval that already started is closed at the replacement time.
 * An interval that has not started is removed, because that unit will not be used.
 */
async function releaseReplacedUnitOccupancy(
  db: ReplacementDb,
  bookingId: string,
  vehicleUnitId: string,
  replacementAt: Date,
): Promise<Date | null> {
  const rows = await db.vehicleUnitOccupancy.findMany({
    where: {
      bookingId,
      vehicleUnitId,
      returnAt: { gt: replacementAt },
    },
    select: { id: true, pickupAt: true },
    orderBy: { pickupAt: "asc" },
  });

  let earliestPickup: Date | null = null;
  for (const row of rows) {
    if (!earliestPickup || row.pickupAt.getTime() < earliestPickup.getTime()) {
      earliestPickup = row.pickupAt;
    }
    if (row.pickupAt.getTime() < replacementAt.getTime()) {
      const closed = await closeBookingUnitOccupancy(db, {
        occupancyId: row.id,
        returnAt: replacementAt,
      });
      if (closed === 0) {
        await deleteOccupancyById(db, row.id);
      }
    } else {
      await deleteOccupancyById(db, row.id);
    }
  }

  return earliestPickup;
}

async function replacementUnitIsFree(
  db: ReplacementDb,
  vehicleId: string,
  vehicleUnitId: string,
  replacementAt: Date,
  returnAt: Date,
  bookingId: string,
): Promise<boolean> {
  const units = await findAvailableVehicleUnits(
    {
      vehicleId,
      requestedStart: replacementAt,
      requestedEnd: returnAt,
      excludeBookingId: bookingId,
    },
    db,
  );
  const blocks = await findConflictingBlocks(
    {
      requestedStart: replacementAt,
      requestedEnd: returnAt,
      vehicleId,
    },
    db as unknown as AvailabilityDbClient,
  );

  if (blocks.some((block) => block.vehicleId === vehicleId)) {
    return false;
  }
  return units.some((unit) => unit.id === vehicleUnitId);
}

function auditNote(input: {
  previousName: string;
  previousPlate: string | null;
  previousColor: string | null;
  startedAt: Date;
  replacementAt: Date;
  returnAt: Date;
  disposition: ReplacementUnitDisposition;
  replacementName: string;
  replacementPlate: string;
  replacementColor: string | null;
  reason: ReplacementReason;
  note: string | null;
  subtotal: number;
}): string {
  const extra = input.note ? ` Note: ${input.note}.` : "";
  return [
    `Replaced the vehicle in use.`,
    `Previous: ${input.previousName} (${unitText(input.previousPlate, input.previousColor)}),`,
    `active from ${input.startedAt.toISOString()} until ${input.replacementAt.toISOString()},`,
    `then ${DISPOSITION_LABELS[input.disposition]}.`,
    `Replacement: ${input.replacementName} (${unitText(input.replacementPlate, input.replacementColor)}),`,
    `active from ${input.replacementAt.toISOString()} until scheduled return ${input.returnAt.toISOString()}.`,
    `Reason: ${REASON_LABELS[input.reason]}.${extra}`,
    `Booking price unchanged at ${euro(input.subtotal)}.`,
  ].join(" ");
}

export async function listReplaceBookingVehicleOptions(
  bookingId: string,
): Promise<ListReplaceBookingVehicleOptionsResult> {
  const booking = await loadReplacementBooking(prisma, bookingId);
  if (!booking) {
    return failure("not_found");
  }
  if (!isVehicleReplacementBookingStatus(booking.status)) {
    return failure("invalid_status", booking.status);
  }
  if (!booking.vehicleUnitId) {
    return failure("missing_vehicle_unit");
  }

  const replacementAt = new Date();
  if (!hasRemainingPeriod(replacementAt, booking.returnDateTime)) {
    return failure("no_remaining_period", undefined, booking.returnDateTime);
  }

  const candidates = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      catalogStatus: { in: ["AVAILABLE", "BOOKED"] },
    },
    select: vehicleSelect,
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  const compatible = candidates.filter((vehicle) => {
    if (!isBookableReplacementVehicle(vehicle)) return false;
    if (
      !isLicenseAllowedForVehicle(
        booking.customerLicenseCategory,
        vehicle.vehicleType,
        vehicle.name,
        vehicle.engineCc,
      )
    ) {
      return false;
    }
    if (booking.storageBoxSelected && !vehicle.supportsStorageBox) return false;
    return true;
  });

  const unitsByVehicle = await batchFindAvailableVehicleUnits({
    vehicleIds: compatible.map((vehicle) => vehicle.id),
    requestedStart: replacementAt,
    requestedEnd: booking.returnDateTime,
    excludeBookingId: booking.id,
  });
  const blocks = compatible.length
    ? await findConflictingBlocks({
        requestedStart: replacementAt,
        requestedEnd: booking.returnDateTime,
        vehicleIds: compatible.map((vehicle) => vehicle.id),
      })
    : [];
  const blockedVehicleIds = new Set(
    blocks.flatMap((block) => (block.vehicleId ? [block.vehicleId] : [])),
  );

  const vehiclesById = new Map(compatible.map((vehicle) => [vehicle.id, vehicle]));
  const units: ReplacementVehicleUnitOption[] = [];
  for (const [vehicleId, vehicleUnits] of unitsByVehicle) {
    if (blockedVehicleIds.has(vehicleId)) continue;
    const vehicle = vehiclesById.get(vehicleId);
    if (!vehicle) continue;
    for (const unit of vehicleUnits) {
      if (unit.id === booking.vehicleUnitId) continue;
      units.push({
        id: unit.id,
        licensePlate: unit.licensePlate,
        color: colorLabel(unit.color),
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        brand: vehicle.brand,
        model: vehicle.model,
        vehicleType: vehicle.vehicleType,
      });
    }
  }
  units.sort((left, right) => {
    const byName = left.vehicleName.localeCompare(right.vehicleName);
    if (byName !== 0) return byName;
    return left.licensePlate.localeCompare(right.licensePlate);
  });

  return {
    ok: true,
    options: {
      bookingReference: booking.bookingReference,
      currentVehicleName: booking.vehicleNameSnapshot ?? "Current vehicle",
      currentLicensePlate: booking.vehicleLicensePlateSnapshot,
      currentColor: booking.vehicleColorSnapshot,
      currentUnitStatus: booking.vehicleUnit?.status ?? null,
      replacementEffectiveAt: replacementAt.toISOString(),
      returnDateTime: booking.returnDateTime.toISOString(),
      subtotal: booking.subtotal.toNumber(),
      priceUnchanged: true,
      expectedUpdatedAt: booking.updatedAt.toISOString(),
      expectedVehicleUnitId: booking.vehicleUnitId,
      units,
    },
  };
}

async function replaceBookingVehicleOnce(
  bookingId: string,
  input: ReplaceBookingVehicleInput,
  adminUserId: string,
): Promise<ReplaceBookingVehicleResult> {
  try {
    const outcome = await prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "Booking" WHERE "id" = ${bookingId} FOR UPDATE
        `;
        if (locked.length === 0) {
          return failure("not_found");
        }

        const booking = await loadReplacementBooking(tx, bookingId);
        if (!booking) {
          return failure("not_found");
        }
        if (booking.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
          return failure("concurrent_update");
        }
        if (!isVehicleReplacementBookingStatus(booking.status)) {
          return failure("invalid_status", booking.status);
        }
        if (!booking.vehicleUnitId) {
          return failure("missing_vehicle_unit");
        }
        if (booking.vehicleUnitId !== input.expectedVehicleUnitId) {
          return failure("current_unit_changed");
        }

        const replacementAt = new Date();
        if (!hasRemainingPeriod(replacementAt, booking.returnDateTime)) {
          return failure("no_remaining_period", undefined, booking.returnDateTime);
        }
        if (input.vehicleUnitId === booking.vehicleUnitId) {
          return failure("same_unit");
        }

        const replacementUnit = await tx.vehicleUnit.findUnique({
          where: { id: input.vehicleUnitId },
          select: {
            id: true,
            licensePlate: true,
            color: true,
            status: true,
            isActive: true,
            vehicle: { select: vehicleSelect },
          },
        });
        if (!replacementUnit) {
          return failure("vehicle_not_found");
        }

        const vehicle = replacementUnit.vehicle;
        const rejected = validateReplacementVehicle(booking, vehicle, replacementUnit);
        if (rejected) {
          return rejected;
        }

        const free = await replacementUnitIsFree(
          tx,
          vehicle.id,
          replacementUnit.id,
          replacementAt,
          booking.returnDateTime,
          booking.id,
        );
        if (!free) {
          return failure("no_availability");
        }

        const occupancyPickup = await releaseReplacedUnitOccupancy(
          tx,
          booking.id,
          booking.vehicleUnitId,
          replacementAt,
        );
        const startedAt = originalStartedAt(booking, occupancyPickup, replacementAt);
        const nextColor = colorLabel(replacementUnit.color);
        const note = input.note?.trim() || null;

        await tx.vehicleUnit.update({
          where: { id: booking.vehicleUnitId },
          data: { status: input.previousUnitStatus },
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            vehicleId: vehicle.id,
            vehicleUnitId: replacementUnit.id,
            vehicleNameSnapshot: vehicle.name,
            vehicleLicensePlateSnapshot: replacementUnit.licensePlate,
            vehicleColorSnapshot: nextColor,
            vehicleType: vehicle.vehicleType,
            vehicleTypeSnapshot: vehicle.vehicleType,
          },
        });

        await insertBookingOccupancy(tx, {
          vehicleUnitId: replacementUnit.id,
          pickupAt: replacementAt,
          returnAt: booking.returnDateTime,
          bookingId: booking.id,
        });

        await tx.vehicleUnit.update({
          where: { id: replacementUnit.id },
          data: { status: "OUT_WITH_CUSTOMER" },
        });

        await recordAssignmentHistory(tx, {
          booking,
          vehicle,
          replacementUnitId: replacementUnit.id,
          replacementPlate: replacementUnit.licensePlate,
          replacementColor: nextColor,
          replacementAt,
          startedAt,
          disposition: input.previousUnitStatus,
          reason: input.reason,
          note,
          adminUserId,
        });

        await recordBookingStatusChange(tx, {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: booking.status,
          adminUserId,
          note: auditNote({
            previousName: booking.vehicleNameSnapshot ?? "Previous vehicle",
            previousPlate: booking.vehicleLicensePlateSnapshot,
            previousColor: booking.vehicleColorSnapshot,
            startedAt,
            replacementAt,
            returnAt: booking.returnDateTime,
            disposition: input.previousUnitStatus,
            replacementName: vehicle.name,
            replacementPlate: replacementUnit.licensePlate,
            replacementColor: nextColor,
            reason: input.reason,
            note,
            subtotal: booking.subtotal.toNumber(),
          }),
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

function validateReplacementVehicle(
  booking: ReplacementBooking,
  vehicle: ReplacementVehicle | null,
  unit: { isActive: boolean; status: VehicleUnitStatus },
): ReplaceBookingVehicleFailure | null {
  if (!vehicle || !isBookableReplacementVehicle(vehicle) || !isAssignableVehicleUnit(unit)) {
    return failure("no_availability");
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

async function recordAssignmentHistory(
  db: ReplacementDb,
  input: {
    booking: ReplacementBooking;
    vehicle: ReplacementVehicle;
    replacementUnitId: string;
    replacementPlate: string;
    replacementColor: string | null;
    replacementAt: Date;
    startedAt: Date;
    disposition: ReplacementUnitDisposition;
    reason: ReplacementReason;
    note: string | null;
    adminUserId: string;
  },
): Promise<void> {
  const open = await db.bookingVehicleAssignment.findFirst({
    where: { bookingId: input.booking.id, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  if (open) {
    await db.bookingVehicleAssignment.update({
      where: { id: open.id },
      data: {
        endedAt: input.replacementAt,
        endDisposition: input.disposition,
        reason: input.reason,
        note: input.note,
      },
    });
  } else if (input.booking.vehicleUnitId) {
    await db.bookingVehicleAssignment.create({
      data: {
        bookingId: input.booking.id,
        vehicleId: input.booking.vehicleId,
        vehicleUnitId: input.booking.vehicleUnitId,
        vehicleNameSnapshot: input.booking.vehicleNameSnapshot ?? "Previous vehicle",
        licensePlateSnapshot: input.booking.vehicleLicensePlateSnapshot,
        colorSnapshot: input.booking.vehicleColorSnapshot,
        vehicleTypeSnapshot: input.booking.vehicleTypeSnapshot ?? input.booking.vehicleType,
        startedAt: input.startedAt,
        endedAt: input.replacementAt,
        endDisposition: input.disposition,
        reason: input.reason,
        note: input.note,
        createdByAdminId: input.adminUserId,
      },
    });
  }

  await db.bookingVehicleAssignment.create({
    data: {
      bookingId: input.booking.id,
      vehicleId: input.vehicle.id,
      vehicleUnitId: input.replacementUnitId,
      vehicleNameSnapshot: input.vehicle.name,
      licensePlateSnapshot: input.replacementPlate,
      colorSnapshot: input.replacementColor,
      vehicleTypeSnapshot: input.vehicle.vehicleType,
      startedAt: input.replacementAt,
      endedAt: null,
      createdByAdminId: input.adminUserId,
    },
  });
}

export async function replaceBookingVehicle(
  bookingId: string,
  input: ReplaceBookingVehicleInput,
  adminUserId: string,
): Promise<ReplaceBookingVehicleResult> {
  const retryLimit = 3;
  for (let attempt = 0; attempt < retryLimit; attempt += 1) {
    try {
      return await replaceBookingVehicleOnce(bookingId, input, adminUserId);
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
