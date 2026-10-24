import type { DepositMethod } from "@/generated/prisma/index";

import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { formatStoredCdwOptionLabel } from "@/lib/admin/bookings/format-stored-cdw-option";
import {
  buildBookingPaymentSummary,
  type BookingPaymentSummary,
} from "@/lib/booking/build-booking-payment-summary";

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export type AdminBookingPriceBuildup = {
  rental: {
    baseDailyRate: number | null;
    billableDays: number;
    originalRentalBeforeDiscount: number | null;
    durationDiscountPercent: number | null;
    durationDiscountAmount: number | null;
    appliedDailyRate: number | null;
    rentalSubtotal: number;
  };
  hotel: {
    used: boolean;
    hotelCode: string | null;
    hotelName: string | null;
    discountPercent: number | null;
    discountAmount: number | null;
    rentalAfterHotelDiscount: number;
  };
  delivery: {
    pickupFee: number;
    dropoffFee: number;
    combinedBeforeAdjustment: number;
    adjustment: number;
    hasAdjustment: boolean;
    deliveryTotal: number;
  };
  cdw: {
    option: string;
    optionLabel: string;
    dailyRate: number;
    billableDays: number;
    total: number;
  };
  addons: {
    additionalDriverEnabled: boolean;
    additionalDriverTotal: number;
    storageBoxSelected: boolean;
    storageBoxCost: number;
  };
  subtotal: {
    rentalAfterHotelDiscount: number;
    deliveryTotal: number;
    cdwTotal: number;
    additionalDriverTotal: number;
    storageBoxCost: number;
    subtotal: number;
  };
  deposit: {
    amount: number;
    method: DepositMethod;
    totalDueOnline: number;
    totalDueLater: number;
    depositIncludedInOnlineTotal: boolean;
    depositDueAtPickup: boolean;
  };
  paymentSummary: BookingPaymentSummary;
  extensionAmountDue: number;
};

/** Display-only breakdown from stored booking snapshots. Does not recalculate pricing rules. */
export function buildAdminBookingPriceBuildup(booking: AdminBookingDetail): AdminBookingPriceBuildup {
  const originalRentalBeforeDiscount =
    booking.baseDailyRateSnapshot !== null
      ? roundMoney(booking.baseDailyRateSnapshot * booking.billableDays)
      : null;

  const durationDiscountAmount =
    originalRentalBeforeDiscount !== null
      ? roundMoney(originalRentalBeforeDiscount - booking.rentalCost)
      : null;

  const hasHotelCode = Boolean(booking.hotelCode?.trim());
  const rentalAfterHotelDiscount =
    booking.subtotalAfterHotelDiscountSnapshot ?? booking.rentalCost;

  const combinedBeforeAdjustment = roundMoney(booking.deliveryFee + booking.dropoffFee);
  const adjustment = roundMoney(combinedBeforeAdjustment - booking.deliveryTotal);

  return {
    rental: {
      baseDailyRate: booking.baseDailyRateSnapshot,
      billableDays: booking.billableDays,
      originalRentalBeforeDiscount,
      durationDiscountPercent: booking.durationDiscountPercentSnapshot,
      durationDiscountAmount:
        durationDiscountAmount !== null && durationDiscountAmount > 0
          ? durationDiscountAmount
          : durationDiscountAmount === 0
            ? 0
            : null,
      appliedDailyRate: booking.appliedDailyRateSnapshot,
      rentalSubtotal: booking.rentalCost,
    },
    hotel: {
      used: hasHotelCode,
      hotelCode: booking.hotelCode,
      hotelName: booking.hotelName,
      discountPercent: booking.hotelDiscountPercentSnapshot,
      discountAmount: booking.hotelDiscountAmountSnapshot,
      rentalAfterHotelDiscount,
    },
    delivery: {
      pickupFee: booking.deliveryFee,
      dropoffFee: booking.dropoffFee,
      combinedBeforeAdjustment,
      adjustment,
      hasAdjustment: adjustment > 0,
      deliveryTotal: booking.deliveryTotal,
    },
    cdw: {
      option: booking.cdwOption,
      optionLabel: formatStoredCdwOptionLabel(booking.cdwOption),
      dailyRate: booking.cdwDailyRate,
      billableDays: booking.billableDays,
      total: booking.cdwTotal,
    },
    addons: {
      additionalDriverEnabled: booking.additionalDriverEnabled,
      additionalDriverTotal: booking.additionalDriverTotal,
      storageBoxSelected: booking.storageBoxSelected,
      storageBoxCost: booking.storageBoxSelected ? booking.storageBoxCost : 0,
    },
    subtotal: {
      rentalAfterHotelDiscount,
      deliveryTotal: booking.deliveryTotal,
      cdwTotal: booking.cdwTotal,
      additionalDriverTotal: booking.additionalDriverTotal,
      storageBoxCost: booking.storageBoxSelected ? booking.storageBoxCost : 0,
      subtotal: booking.subtotal,
    },
    deposit: {
      amount: booking.depositAmount,
      method: booking.depositMethod,
      totalDueOnline: booking.totalDueOnline,
      totalDueLater: booking.totalDueLater,
      depositIncludedInOnlineTotal: booking.depositMethod === "ONLINE",
      depositDueAtPickup: booking.depositMethod === "IN_PERSON",
    },
    paymentSummary: buildBookingPaymentSummary({
      subtotal: booking.subtotal,
      depositAmount: booking.depositAmount,
      depositMethod: booking.depositMethod,
      totalDueOnline: booking.totalDueOnline,
      totalDueLater: booking.totalDueLater,
    }),
    extensionAmountDue: roundMoney(
      booking.extensions.reduce((total, extension) => total + extension.additionalAmount, 0),
    ),
  };
}
