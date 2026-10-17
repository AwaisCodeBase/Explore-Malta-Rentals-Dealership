import type { Prisma } from "@/generated/prisma/index";

export const VEHICLE_DELETE_BLOCKED_REASONS = {
  HAS_BOOKINGS: "HAS_BOOKINGS",
  HAS_RESERVATION_HOLDS: "HAS_RESERVATION_HOLDS",
  HAS_AVAILABILITY_BLOCKS: "HAS_AVAILABILITY_BLOCKS",
} as const;

/** Holds that still block availability and vehicle deletion. */
export function activeReservationHoldWhere(now = new Date()): Prisma.ReservationHoldWhereInput {
  return {
    status: "ACTIVE",
    expiresAt: { gt: now },
  };
}

/** Cancelled bookings keep snapshots and must not block vehicle or unit deletion. */
export function vehicleDeleteBlockingBookingWhere(): Prisma.BookingWhereInput {
  return {
    status: { not: "CANCELLED" },
  };
}

export function vehicleDeleteRelationCountSelect(now = new Date()) {
  return {
    bookings: {
      where: vehicleDeleteBlockingBookingWhere(),
    },
    availabilityBlocks: true,
    reservationHolds: {
      where: activeReservationHoldWhere(now),
    },
  } as const;
}

export function vehicleUnitDeleteRelationCountSelect(now = new Date()) {
  return {
    bookings: {
      where: vehicleDeleteBlockingBookingWhere(),
    },
    reservationHolds: {
      where: activeReservationHoldWhere(now),
    },
  } as const;
}

export type VehicleDeleteBlockedReason =
  (typeof VEHICLE_DELETE_BLOCKED_REASONS)[keyof typeof VEHICLE_DELETE_BLOCKED_REASONS];

export type VehicleRelationCounts = {
  bookings: number;
  reservationHolds: number;
  availabilityBlocks: number;
};

export function vehicleDeleteBlockedReasons(
  counts: VehicleRelationCounts,
): VehicleDeleteBlockedReason[] {
  const reasons: VehicleDeleteBlockedReason[] = [];

  if (counts.bookings > 0) {
    reasons.push(VEHICLE_DELETE_BLOCKED_REASONS.HAS_BOOKINGS);
  }
  if (counts.reservationHolds > 0) {
    reasons.push(VEHICLE_DELETE_BLOCKED_REASONS.HAS_RESERVATION_HOLDS);
  }
  if (counts.availabilityBlocks > 0) {
    reasons.push(VEHICLE_DELETE_BLOCKED_REASONS.HAS_AVAILABILITY_BLOCKS);
  }

  return reasons;
}

export function vehicleCanDelete(counts: VehicleRelationCounts): boolean {
  return vehicleDeleteBlockedReasons(counts).length === 0;
}
