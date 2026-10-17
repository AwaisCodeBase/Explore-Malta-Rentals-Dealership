import { Prisma } from "@/generated/prisma/client";

import type { AdminVehicleUnitDto } from "@/lib/admin/vehicle-units/types";
import type {
  AdminVehicleUnitCreateInput,
  AdminVehicleUnitUpdateInput,
} from "@/lib/admin/vehicle-units/vehicle-unit-schema";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/availability/types";
import { vehicleUnitDeleteRelationCountSelect } from "@/lib/admin/vehicles/vehicle-delete-errors";
import { prisma } from "@/lib/prisma";

export class DuplicateVehicleUnitLicensePlateError extends Error {
  constructor() {
    super("A vehicle unit with this license plate already exists.");
    this.name = "DuplicateVehicleUnitLicensePlateError";
  }
}

export class VehicleUnitHasActiveBookingError extends Error {
  constructor() {
    super("This unit is assigned to an active booking and cannot be deactivated or marked unavailable.");
    this.name = "VehicleUnitHasActiveBookingError";
  }
}

function isLicensePlateUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes("licensePlate");
  }

  if (typeof target === "string") {
    return target.includes("licensePlate");
  }

  return false;
}

const unitSelect = {
  id: true,
  vehicleId: true,
  licensePlate: true,
  color: true,
  status: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function ensureVehicleExists(vehicleId: string): Promise<boolean> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true },
  });
  return Boolean(vehicle);
}

async function assertUnitNotBlockingStatusChange(
  unitId: string,
  input: AdminVehicleUnitCreateInput | AdminVehicleUnitUpdateInput,
): Promise<void> {
  const becomingUnavailable =
    !input.isActive ||
    input.status === "MAINTENANCE" ||
    input.status === "NOT_AVAILABLE";

  if (!becomingUnavailable) {
    return;
  }

  const activeBooking = await prisma.booking.findFirst({
    where: {
      vehicleUnitId: unitId,
      status: { in: [...BLOCKING_BOOKING_STATUSES] },
    },
    select: { bookingReference: true },
  });

  if (activeBooking) {
    throw new VehicleUnitHasActiveBookingError();
  }
}

export async function createAdminVehicleUnit(
  vehicleId: string,
  input: AdminVehicleUnitCreateInput,
): Promise<AdminVehicleUnitDto | null> {
  if (!(await ensureVehicleExists(vehicleId))) {
    return null;
  }

  try {
    const unit = await prisma.vehicleUnit.create({
      data: {
        vehicleId,
        licensePlate: input.licensePlate,
        color: input.color,
        status: input.status,
        isActive: input.isActive,
        notes: input.notes ?? null,
      },
      select: unitSelect,
    });

    return {
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
    };
  } catch (error) {
    if (isLicensePlateUniqueConstraintError(error)) {
      throw new DuplicateVehicleUnitLicensePlateError();
    }
    throw error;
  }
}

export async function updateAdminVehicleUnit(
  vehicleId: string,
  unitId: string,
  input: AdminVehicleUnitUpdateInput,
): Promise<AdminVehicleUnitDto | null> {
  const existing = await prisma.vehicleUnit.findFirst({
    where: { id: unitId, vehicleId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await assertUnitNotBlockingStatusChange(unitId, input);

  try {
    const unit = await prisma.vehicleUnit.update({
      where: { id: unitId },
      data: {
        licensePlate: input.licensePlate,
        ...(input.color !== undefined ? { color: input.color } : {}),
        status: input.status,
        isActive: input.isActive,
        notes: input.notes ?? null,
      },
      select: unitSelect,
    });

    return {
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
    };
  } catch (error) {
    if (isLicensePlateUniqueConstraintError(error)) {
      throw new DuplicateVehicleUnitLicensePlateError();
    }
    throw error;
  }
}

export type DeleteAdminVehicleUnitResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "has_related_records" };

export async function deleteAdminVehicleUnit(
  vehicleId: string,
  unitId: string,
): Promise<DeleteAdminVehicleUnitResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.vehicleUnit.findFirst({
      where: { id: unitId, vehicleId },
      select: {
        id: true,
        _count: {
          select: vehicleUnitDeleteRelationCountSelect(),
        },
      },
    });

    if (!existing) {
      return { ok: false, reason: "not_found" };
    }

    if (existing._count.bookings > 0 || existing._count.reservationHolds > 0) {
      return { ok: false, reason: "has_related_records" };
    }

    await tx.booking.updateMany({
      where: { vehicleUnitId: unitId, status: "CANCELLED" },
      data: { vehicleUnitId: null },
    });

    await tx.vehicleUnit.delete({ where: { id: unitId } });

    return { ok: true };
  });
}
