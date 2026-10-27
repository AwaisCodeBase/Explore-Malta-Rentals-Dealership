import { differenceInMinutes } from "date-fns";

import type { Prisma } from "@/generated/prisma/index";

import { isExtendableBookingStatus } from "@/lib/admin/bookings/booking-extension-eligibility";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/availability/types";
import { getAdminBookingById } from "@/lib/admin/bookings/getAdminBookingById";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { calculateBookingExtensionCharge } from "@/lib/admin/bookings/calculate-booking-extension-charge";
import { notifyBookingExtended } from "@/lib/admin/notifications";
import { additionalBillableCalendarDays } from "@/lib/admin/bookings/extension-calendar-days";
import {
  findUnitExtensionConflict,
  listUnitExtensionBlocks,
  type ExtensionConflictWindow,
} from "@/lib/admin/bookings/find-unit-extension-conflict";
import { prisma } from "@/lib/prisma";
import { roundPricingAmount } from "@/lib/pricing/duration-pricing";
import { MAX_BILLABLE_RENTAL_DAYS } from "@/lib/pricing/rental-duration";
import {
  extendBookingOccupancyReturnAt,
  insertBookingOccupancy,
  isVehicleUnitOccupancyExclusionError,
} from "@/lib/vehicle-unit-occupancy";

export type BookingExtensionFailureReason =
  | "not_found"
  | "invalid_status"
  | "missing_vehicle_unit"
  | "invalid_return"
  | "exceeds_max_days"
  | "invalid_pricing"
  | "unit_conflict"
  | "concurrent_update";

export type BookingExtensionConflict = {
  pickupAt: string;
  returnAt: string;
};

export type BookingExtensionPreview = {
  bookingReference: string;
  vehicleName: string;
  vehicleUnitLabel: string | null;
  pickupDateTime: string;
  currentReturnDateTime: string;
  proposedReturnDateTime: string;
  currentBillableDays: number;
  additionalBillableDays: number;
  proposedBillableDays: number;
  appliedDailyRate: number;
  additionalRentalAmount: number;
  additionalHotelDiscountAmount: number;
  additionalCdwAmount: number;
  additionalDriverAmount: number;
  additionalAmount: number;
  currentSubtotal: number;
  updatedSubtotal: number;
  deliveryTotal: number;
  storageBoxCost: number;
  available: boolean;
  conflict: BookingExtensionConflict | null;
  expectedUpdatedAt: string;
};

export type PreviewBookingExtensionResult =
  | { ok: true; preview: BookingExtensionPreview }
  | { ok: false; reason: BookingExtensionFailureReason; conflict?: BookingExtensionConflict };

export type ExtendBookingResult =
  | { ok: true; booking: AdminBookingDetail }
  | { ok: false; reason: BookingExtensionFailureReason; conflict?: BookingExtensionConflict };

const extensionBookingSelect = {
  id: true,
  bookingReference: true,
  status: true,
  updatedAt: true,
  vehicleUnitId: true,
  vehicleNameSnapshot: true,
  vehicleLicensePlateSnapshot: true,
  pickupDateTime: true,
  returnDateTime: true,
  billableDays: true,
  rentalCost: true,
  appliedDailyRateSnapshot: true,
  hotelDiscountPercentSnapshot: true,
  hotelDiscountAmountSnapshot: true,
  subtotalAfterHotelDiscountSnapshot: true,
  cdwDailyRate: true,
  cdwTotal: true,
  additionalDriverEnabled: true,
  additionalDriverDailyRate: true,
  additionalDriverTotal: true,
  deliveryTotal: true,
  storageBoxCost: true,
  subtotal: true,
} satisfies Prisma.BookingSelect;

type ExtensionBookingRow = Prisma.BookingGetPayload<{ select: typeof extensionBookingSelect }>;

type ExtensionDb = Pick<
  Prisma.TransactionClient,
  "booking" | "vehicleUnitOccupancy" | "reservationHold" | "bookingExtension" | "$queryRaw" | "$executeRaw"
>;

function money(value: { toNumber: () => number } | null | undefined): number | null {
  return value ? value.toNumber() : null;
}

function toConflict(window: ExtensionConflictWindow): BookingExtensionConflict {
  return {
    pickupAt: window.pickupAt.toISOString(),
    returnAt: window.returnAt.toISOString(),
  };
}

type PreparedExtension =
  | {
      ok: true;
      additionalBillableDays: number;
      proposedBillableDays: number;
      actualDurationHours: number;
      charge: ReturnType<typeof calculateBookingExtensionCharge> & { ok: true };
    }
  | { ok: false; reason: BookingExtensionFailureReason };

function prepareExtension(booking: ExtensionBookingRow, proposedReturn: Date): PreparedExtension {
  if (!isExtendableBookingStatus(booking.status)) {
    return { ok: false, reason: "invalid_status" };
  }
  if (!booking.vehicleUnitId) {
    return { ok: false, reason: "missing_vehicle_unit" };
  }
  if (Number.isNaN(proposedReturn.getTime()) || proposedReturn.getTime() <= booking.returnDateTime.getTime()) {
    return { ok: false, reason: "invalid_return" };
  }
  if (proposedReturn.getTime() <= booking.pickupDateTime.getTime()) {
    return { ok: false, reason: "invalid_return" };
  }

  const additionalBillableDays = additionalBillableCalendarDays(booking.returnDateTime, proposedReturn);
  if (additionalBillableDays === null || additionalBillableDays < 0) {
    return { ok: false, reason: "invalid_return" };
  }

  const proposedBillableDays = booking.billableDays + additionalBillableDays;
  if (proposedBillableDays > MAX_BILLABLE_RENTAL_DAYS) {
    return { ok: false, reason: "exceeds_max_days" };
  }

  const durationMinutes = differenceInMinutes(proposedReturn, booking.pickupDateTime);
  if (durationMinutes <= 0) {
    return { ok: false, reason: "invalid_return" };
  }

  const charge = calculateBookingExtensionCharge({
    additionalBillableDays,
    billableDays: booking.billableDays,
    rentalCost: booking.rentalCost.toNumber(),
    appliedDailyRateSnapshot: money(booking.appliedDailyRateSnapshot),
    hotelDiscountPercentSnapshot: money(booking.hotelDiscountPercentSnapshot),
    cdwDailyRate: booking.cdwDailyRate.toNumber(),
    additionalDriverEnabled: booking.additionalDriverEnabled,
    additionalDriverDailyRate: booking.additionalDriverDailyRate.toNumber(),
  });
  if (!charge.ok) {
    return { ok: false, reason: "invalid_pricing" };
  }

  return {
    ok: true,
    additionalBillableDays,
    proposedBillableDays,
    actualDurationHours: Number((durationMinutes / 60).toFixed(2)),
    charge,
  };
}

function buildPreview(
  booking: ExtensionBookingRow,
  proposedReturn: Date,
  prepared: Extract<PreparedExtension, { ok: true }>,
  conflict: ExtensionConflictWindow | null,
): BookingExtensionPreview {
  const charge = prepared.charge.charge;
  const storageBoxCost = booking.storageBoxCost.toNumber();
  const subtotal = booking.subtotal.toNumber();

  return {
    bookingReference: booking.bookingReference,
    vehicleName: booking.vehicleNameSnapshot ?? "—",
    vehicleUnitLabel: booking.vehicleLicensePlateSnapshot,
    pickupDateTime: booking.pickupDateTime.toISOString(),
    currentReturnDateTime: booking.returnDateTime.toISOString(),
    proposedReturnDateTime: proposedReturn.toISOString(),
    currentBillableDays: booking.billableDays,
    additionalBillableDays: prepared.additionalBillableDays,
    proposedBillableDays: prepared.proposedBillableDays,
    appliedDailyRate: charge.appliedDailyRate,
    additionalRentalAmount: charge.additionalRentalAmount,
    additionalHotelDiscountAmount: charge.additionalHotelDiscountAmount,
    additionalCdwAmount: charge.additionalCdwAmount,
    additionalDriverAmount: charge.additionalDriverAmount,
    additionalAmount: charge.additionalAmount,
    currentSubtotal: subtotal,
    updatedSubtotal: roundPricingAmount(subtotal + charge.additionalAmount),
    deliveryTotal: booking.deliveryTotal.toNumber(),
    storageBoxCost,
    available: conflict === null,
    conflict: conflict ? toConflict(conflict) : null,
    expectedUpdatedAt: booking.updatedAt.toISOString(),
  };
}

async function loadExtensionBooking(db: Pick<ExtensionDb, "booking">, bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    select: extensionBookingSelect,
  });
}

export async function previewBookingExtension(
  bookingId: string,
  proposedReturn: Date,
): Promise<PreviewBookingExtensionResult> {
  const booking = await loadExtensionBooking(prisma, bookingId);
  if (!booking) {
    return { ok: false, reason: "not_found" };
  }

  const prepared = prepareExtension(booking, proposedReturn);
  if (!prepared.ok) {
    return prepared;
  }

  const conflict = await findUnitExtensionConflict(prisma, {
    vehicleUnitId: booking.vehicleUnitId!,
    bookingId: booking.id,
    requestedStart: booking.pickupDateTime,
    requestedEnd: proposedReturn,
  });

  return { ok: true, preview: buildPreview(booking, proposedReturn, prepared, conflict) };
}

export async function extendBooking(
  bookingId: string,
  proposedReturn: Date,
  adminUserId: string,
  expectedUpdatedAt: Date,
): Promise<ExtendBookingResult> {
  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Booking" WHERE "id" = ${bookingId} FOR UPDATE
      `;
      if (locked.length === 0) {
        return { ok: false as const, reason: "not_found" as const };
      }

      const booking = await loadExtensionBooking(tx, bookingId);
      if (!booking) {
        return { ok: false as const, reason: "not_found" as const };
      }

      if (booking.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return { ok: false as const, reason: "concurrent_update" as const };
      }

      const prepared = prepareExtension(booking, proposedReturn);
      if (!prepared.ok) {
        return prepared;
      }

      const conflict = await findUnitExtensionConflict(tx, {
        vehicleUnitId: booking.vehicleUnitId!,
        bookingId: booking.id,
        requestedStart: booking.pickupDateTime,
        requestedEnd: proposedReturn,
      });
      if (conflict) {
        return { ok: false as const, reason: "unit_conflict" as const, conflict: toConflict(conflict) };
      }

      const updatedOccupancy = await extendBookingOccupancyReturnAt(tx, {
        bookingId: booking.id,
        vehicleUnitId: booking.vehicleUnitId!,
        returnAt: proposedReturn,
      });
      if (updatedOccupancy === 0) {
        await insertBookingOccupancy(tx, {
          vehicleUnitId: booking.vehicleUnitId!,
          pickupAt: booking.pickupDateTime,
          returnAt: proposedReturn,
          bookingId: booking.id,
        });
      }

      const charge = prepared.charge.charge;
      const rentalCost = roundPricingAmount(booking.rentalCost.toNumber() + charge.additionalRentalAmount);
      const cdwTotal = roundPricingAmount(booking.cdwTotal.toNumber() + charge.additionalCdwAmount);
      const additionalDriverTotal = roundPricingAmount(
        booking.additionalDriverTotal.toNumber() + charge.additionalDriverAmount,
      );
      const subtotal = roundPricingAmount(booking.subtotal.toNumber() + charge.additionalAmount);

      const existingHotelDiscount = money(booking.hotelDiscountAmountSnapshot);
      const existingRentalAfterHotel = money(booking.subtotalAfterHotelDiscountSnapshot);
      const hotelDiscountTouched = existingHotelDiscount !== null || charge.additionalHotelDiscountAmount > 0;
      const rentalAfterHotelTouched = existingRentalAfterHotel !== null || charge.additionalHotelDiscountAmount > 0;

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          returnDateTime: proposedReturn,
          billableDays: prepared.proposedBillableDays,
          actualDurationHours: prepared.actualDurationHours,
          rentalCost,
          cdwTotal,
          additionalDriverTotal,
          subtotal,
          hotelDiscountAmountSnapshot: hotelDiscountTouched
            ? roundPricingAmount((existingHotelDiscount ?? 0) + charge.additionalHotelDiscountAmount)
            : undefined,
          subtotalAfterHotelDiscountSnapshot: rentalAfterHotelTouched
            ? roundPricingAmount(
                (existingRentalAfterHotel ?? booking.rentalCost.toNumber()) +
                  charge.additionalRentalAmount -
                  charge.additionalHotelDiscountAmount,
              )
            : undefined,
        },
      });

      await tx.bookingExtension.create({
        data: {
          bookingId: booking.id,
          previousReturnDateTime: booking.returnDateTime,
          newReturnDateTime: proposedReturn,
          additionalBillableDays: prepared.additionalBillableDays,
          appliedDailyRate: charge.appliedDailyRate,
          additionalRentalAmount: charge.additionalRentalAmount,
          additionalHotelDiscountAmount: charge.additionalHotelDiscountAmount,
          additionalCdwAmount: charge.additionalCdwAmount,
          additionalDriverAmount: charge.additionalDriverAmount,
          additionalAmount: charge.additionalAmount,
          createdByAdminId: adminUserId,
        },
      });

      return { ok: true as const };
    });

    if (!outcome.ok) {
      return outcome;
    }

    const booking = await getAdminBookingById(bookingId);
    if (!booking) {
      return { ok: false, reason: "not_found" };
    }

    await notifyBookingExtended(booking, adminUserId);

    return { ok: true, booking };
  } catch (error) {
    if (isVehicleUnitOccupancyExclusionError(error)) {
      return { ok: false, reason: "unit_conflict" };
    }
    throw error;
  }
}

export type BookingExtensionUnitBooking = {
  id: string;
  bookingReference: string;
  status: string;
  pickupAt: string;
  returnAt: string;
  isCurrent: boolean;
};

export type BookingExtensionAvailability = {
  currentReturnDateTime: string;
  pickupDateTime: string;
  billableDays: number;
  blocks: BookingExtensionConflict[];
  unitBookings: BookingExtensionUnitBooking[];
};

export async function getBookingExtensionAvailability(
  bookingId: string,
): Promise<
  | { ok: true; availability: BookingExtensionAvailability }
  | { ok: false; reason: BookingExtensionFailureReason }
> {
  const booking = await loadExtensionBooking(prisma, bookingId);
  if (!booking) {
    return { ok: false, reason: "not_found" };
  }
  if (!isExtendableBookingStatus(booking.status)) {
    return { ok: false, reason: "invalid_status" };
  }
  if (!booking.vehicleUnitId) {
    return { ok: false, reason: "missing_vehicle_unit" };
  }

  const horizon = new Date(booking.returnDateTime.getTime() + 40 * 24 * 60 * 60 * 1000);
  const displayStart = new Date(booking.pickupDateTime.getTime() - 60 * 24 * 60 * 60 * 1000);
  const displayEnd = new Date(booking.returnDateTime.getTime() + 90 * 24 * 60 * 60 * 1000);
  const [blocks, unitBookings] = await Promise.all([
    listUnitExtensionBlocks(prisma, {
      vehicleUnitId: booking.vehicleUnitId,
      bookingId: booking.id,
      after: booking.returnDateTime,
      before: horizon,
    }),
    prisma.booking.findMany({
      where: {
        vehicleUnitId: booking.vehicleUnitId,
        status: { in: [...BLOCKING_BOOKING_STATUSES] },
        returnDateTime: { gt: displayStart },
        pickupDateTime: { lt: displayEnd },
      },
      select: {
        id: true,
        bookingReference: true,
        status: true,
        pickupDateTime: true,
        returnDateTime: true,
      },
      orderBy: { pickupDateTime: "asc" },
    }),
  ]);

  return {
    ok: true,
    availability: {
      currentReturnDateTime: booking.returnDateTime.toISOString(),
      pickupDateTime: booking.pickupDateTime.toISOString(),
      billableDays: booking.billableDays,
      blocks: blocks.map((block) => ({
        pickupAt: block.pickupAt.toISOString(),
        returnAt: block.returnAt.toISOString(),
      })),
      unitBookings: unitBookings.map((row) => ({
        id: row.id,
        bookingReference: row.bookingReference,
        status: row.status,
        pickupAt: row.pickupDateTime.toISOString(),
        returnAt: row.returnDateTime.toISOString(),
        isCurrent: row.id === booking.id,
      })),
    },
  };
}
