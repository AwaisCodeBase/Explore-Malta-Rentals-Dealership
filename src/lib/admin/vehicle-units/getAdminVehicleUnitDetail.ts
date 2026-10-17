import type { AdminVehicleUnitDetailDto } from "@/lib/admin/vehicle-units/types";
import { prisma } from "@/lib/prisma";

export async function getAdminVehicleUnitDetail(
  vehicleId: string,
  unitId: string,
): Promise<AdminVehicleUnitDetailDto | null> {
  const unit = await prisma.vehicleUnit.findFirst({
    where: { id: unitId, vehicleId },
    select: {
      id: true,
      vehicleId: true,
      licensePlate: true,
      color: true,
      status: true,
      isActive: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      vehicle: {
        select: { name: true },
      },
    },
  });

  if (!unit) {
    return null;
  }

  const [bookings, activeHolds] = await Promise.all([
    prisma.booking.findMany({
      where: { vehicleUnitId: unitId },
      orderBy: [{ pickupDateTime: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        bookingReference: true,
        status: true,
        pickupDateTime: true,
        returnDateTime: true,
        customerFullName: true,
        customerEmail: true,
      },
    }),
    prisma.reservationHold.findMany({
      where: {
        vehicleUnitId: unitId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      orderBy: [{ expiresAt: "asc" }],
      select: {
        holdReference: true,
        status: true,
        pickupDateTime: true,
        returnDateTime: true,
        expiresAt: true,
      },
    }),
  ]);

  return {
    id: unit.id,
    vehicleId: unit.vehicleId,
    licensePlate: unit.licensePlate,
    color: unit.color,
    status: unit.status,
    isActive: unit.isActive,
    notes: unit.notes,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString(),
    vehicleName: unit.vehicle.name,
    bookings: bookings.map((booking) => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      status: booking.status,
      pickupDateTime: booking.pickupDateTime.toISOString(),
      returnDateTime: booking.returnDateTime.toISOString(),
      customerFullName: booking.customerFullName,
      customerEmail: booking.customerEmail,
    })),
    activeHolds: activeHolds.map((hold) => ({
      holdReference: hold.holdReference,
      status: hold.status,
      pickupDateTime: hold.pickupDateTime.toISOString(),
      returnDateTime: hold.returnDateTime.toISOString(),
      expiresAt: hold.expiresAt.toISOString(),
    })),
  };
}
