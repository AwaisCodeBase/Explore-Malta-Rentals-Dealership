import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { getAdminBookingById } from "@/lib/admin/bookings/getAdminBookingById";
import type { HandOverVehicleInput } from "@/lib/admin/bookings/lifecycle/booking-lifecycle-schema";
import { recordBookingStatusChange } from "@/lib/admin/bookings/lifecycle/recordBookingStatusChange";
import { prisma } from "@/lib/prisma";
import {
  isVehicleUnitOccupancyExclusionError,
  syncBookingOccupancyToAssignedUnit,
} from "@/lib/vehicle-unit-occupancy";

export type HandOverVehicleResult =
  | { ok: true; booking: AdminBookingDetail }
  | {
      ok: false;
      reason:
        | "not_found"
        | "invalid_status"
        | "missing_vehicle_unit"
        | "vehicle_unit_mismatch"
        | "vehicle_unit_not_assignable"
        | "occupancy_conflict";
    };

export async function handOverVehicle(
  bookingId: string,
  input: HandOverVehicleInput,
  adminUserId: string,
): Promise<HandOverVehicleResult> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      vehicleId: true,
      vehicleUnitId: true,
      pickupDateTime: true,
      returnDateTime: true,
    },
  });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  if (existing.status !== "CONFIRMED") {
    return { ok: false, reason: "invalid_status" };
  }

  const targetUnitId = input.vehicleUnitId ?? existing.vehicleUnitId;
  if (!targetUnitId) {
    return { ok: false, reason: "missing_vehicle_unit" };
  }

  const unit = await prisma.vehicleUnit.findUnique({
    where: { id: targetUnitId },
    select: {
      id: true,
      vehicleId: true,
      licensePlate: true,
      isActive: true,
      status: true,
    },
  });

  if (!unit || (existing.vehicleId && unit.vehicleId !== existing.vehicleId)) {
    return { ok: false, reason: "vehicle_unit_mismatch" };
  }

  if (
    !unit.isActive ||
    (unit.status !== "AVAILABLE" &&
      !(unit.status === "RESERVED" && unit.id === existing.vehicleUnitId))
  ) {
    return { ok: false, reason: "vehicle_unit_not_assignable" };
  }

  const previousUnitId = existing.vehicleUnitId;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "VEHICLE_HANDED_OVER",
          paymentStatus: input.paymentConfirmed ? "PAID" : "PENDING",
          securityDepositStatus: input.depositCollectedConfirmed ? "COLLECTED" : "PENDING",
          vehicleUnitId: unit.id,
          vehicleLicensePlateSnapshot: unit.licensePlate,
          paymentReceivedAmount: input.paymentReceivedAmount,
          paymentMethod: input.paymentMethod,
          securityDepositCollectedAmount: input.securityDepositCollectedAmount,
          handoverDateTime: input.handoverDateTime,
          handoverNotes: input.handoverNotes?.trim() || null,
        },
      });

      await syncBookingOccupancyToAssignedUnit(tx, {
        bookingId,
        vehicleUnitId: unit.id,
        pickupAt: existing.pickupDateTime,
        returnAt: existing.returnDateTime,
      });

      if (previousUnitId && previousUnitId !== unit.id) {
        const previousUnit = await tx.vehicleUnit.findUnique({
          where: { id: previousUnitId },
          select: { status: true },
        });
        if (previousUnit?.status === "RESERVED") {
          await tx.vehicleUnit.update({
            where: { id: previousUnitId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      await tx.vehicleUnit.update({
        where: { id: unit.id },
        data: { status: "OUT_WITH_CUSTOMER" },
      });

      await recordBookingStatusChange(tx, {
        bookingId,
        oldStatus: existing.status,
        newStatus: "VEHICLE_HANDED_OVER",
        adminUserId,
        note: input.note,
      });
    });
  } catch (error) {
    if (isVehicleUnitOccupancyExclusionError(error)) {
      return { ok: false, reason: "occupancy_conflict" };
    }
    throw error;
  }

  const booking = await getAdminBookingById(bookingId);
  if (!booking) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, booking };
}
