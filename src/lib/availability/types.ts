import type {
  AvailabilityBlockType,
  BookingStatus,
  Prisma,
  ReservationHoldStatus,
  VehicleType,
} from "@/generated/prisma/index";

export const BLOCKING_BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "VEHICLE_HANDED_OVER",
  "RETURNED",
] as const;

export type BlockingBookingStatus = (typeof BLOCKING_BOOKING_STATUSES)[number];

export type AvailabilityDbClient = {
  booking: {
    findMany: (args: Prisma.BookingFindManyArgs) => Promise<ConflictingBooking[]>;
  };
  availabilityBlock: {
    findMany: (args: Prisma.AvailabilityBlockFindManyArgs) => Promise<ConflictingAvailabilityBlock[]>;
  };
  reservationHold: {
    findMany: (args: Prisma.ReservationHoldFindManyArgs) => Promise<ConflictingReservationHold[]>;
  };
  vehicle: {
    findUnique: (args: Prisma.VehicleFindUniqueArgs) => Promise<{
      vehicleType: VehicleType;
      isActive: boolean;
    } | null>;
    findMany: (args: Prisma.VehicleFindManyArgs) => Promise<Array<{ id: string }>>;
  };
};

export type AvailabilityWindow = {
  requestedStart: Date;
  requestedEnd: Date;
};

export type ConflictingBooking = {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  vehicleId: string | null;
  vehicleType: VehicleType;
  vehicleTypeSnapshot: VehicleType | null;
  pickupDateTime: Date;
  returnDateTime: Date;
};

export type ConflictingAvailabilityBlock = {
  id: string;
  vehicleId: string | null;
  vehicleType: VehicleType | null;
  blockType: AvailabilityBlockType;
  startDateTime: Date;
  endDateTime: Date;
  reason: string | null;
};

export type ConflictingReservationHold = {
  id: string;
  holdReference: string;
  vehicleId: string;
  vehicleUnitId: string | null;
  vehicleType: VehicleType;
  sessionKey: string;
  status: ReservationHoldStatus;
  pickupDateTime: Date;
  returnDateTime: Date;
  expiresAt: Date;
};

export type VehicleAvailabilityResult = {
  isAvailable: boolean;
  conflictingBookings: ConflictingBooking[];
  conflictingBlocks: ConflictingAvailabilityBlock[];
  conflictingReservationHolds: ConflictingReservationHold[];
  reason?: string;
};

export type VehicleTypeAvailabilityResult = {
  isAvailable: boolean;
  availableVehicleIds: string[];
  totalMatchingVehicles: number;
  availableCount: number;
  conflictingBookings: ConflictingBooking[];
  conflictingBlocks: ConflictingAvailabilityBlock[];
  conflictingReservationHolds: ConflictingReservationHold[];
  reason?: string;
};

export function assertValidAvailabilityWindow(window: AvailabilityWindow): void {
  if (Number.isNaN(window.requestedStart.getTime()) || Number.isNaN(window.requestedEnd.getTime())) {
    throw new Error("Availability window contains an invalid date");
  }

  if (window.requestedStart >= window.requestedEnd) {
    throw new Error("Availability window start must be before end");
  }
}

export function buildOverlappingRangeWhere(
  requestedStart: Date,
  requestedEnd: Date,
): Pick<Prisma.BookingWhereInput, "pickupDateTime" | "returnDateTime"> {
  // Overlap rule: requestedStart < existingEnd AND requestedEnd > existingStart.
  return {
    pickupDateTime: { lt: requestedEnd },
    returnDateTime: { gt: requestedStart },
  };
}
