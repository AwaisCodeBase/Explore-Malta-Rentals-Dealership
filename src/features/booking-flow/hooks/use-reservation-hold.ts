"use client";

import { useCallback } from "react";
import { colorsMatch } from "@/features/vehicles/lib/vehicle-color";
import type { BookingFlowState, ReservationHoldState } from "@/features/booking-flow/lib/types";
import { createReservationHoldWithRetry, releaseReservationHold } from "@/features/booking-flow/lib/reservation-hold-api";

type UseReservationHoldInput = {
  bookingState: BookingFlowState;
  reservationHold: ReservationHoldState;
  setHold: (next: Partial<ReservationHoldState>) => void;
  clearHold: () => void;
  setError: (message: string | null) => void;
};

type HoldActionResult = {
  ok: boolean;
  message?: string;
};

function holdMatchesRental(hold: ReservationHoldState, booking: BookingFlowState["rental"]): boolean {
  return (
    hold.holdReference !== null &&
    hold.vehicleId !== null &&
    hold.vehicleId === booking.vehicleId &&
    hold.pickupDate === booking.pickupDate &&
    hold.pickupTime === booking.pickupTime &&
    hold.returnDate === booking.returnDate &&
    hold.returnTime === booking.returnTime &&
    colorsMatch(hold.selectedColor, booking.selectedColor)
  );
}

function optionalValidEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function useReservationHold({
  bookingState,
  reservationHold,
  setHold,
  clearHold,
  setError,
}: UseReservationHoldInput) {
  const createOrRefreshHold = useCallback(async (): Promise<HoldActionResult> => {
    const { rental, customer } = bookingState;
    if (!rental.vehicleId) {
      return {
        ok: false,
        message: "Please select a specific vehicle before continuing.",
      };
    }

    const existingActive =
      reservationHold.holdReference &&
      reservationHold.status === "ACTIVE" &&
      reservationHold.expiresAt &&
      new Date(reservationHold.expiresAt).getTime() > Date.now();
    if (existingActive && holdMatchesRental(reservationHold, rental)) {
      setError(null);
      return { ok: true };
    }

    if (reservationHold.holdReference && reservationHold.status === "ACTIVE") {
      await releaseReservationHold(reservationHold.holdReference);
      setHold({
        holdReference: null,
        status: null,
        expiresAt: null,
      });
    }

    const resolvedVehicleType = rental.vehicleType || reservationHold.vehicleType || undefined;
    const result = await createReservationHoldWithRetry({
      vehicleId: rental.vehicleId,
      ...(resolvedVehicleType ? { vehicleType: resolvedVehicleType } : {}),
      ...(rental.selectedColor ? { color: rental.selectedColor } : {}),
      pickupDate: rental.pickupDate,
      pickupTime: rental.pickupTime,
      returnDate: rental.returnDate,
      returnTime: rental.returnTime,
      sessionKey: reservationHold.sessionKey?.trim() || undefined,
      customerEmail: optionalValidEmail(customer.email),
      customerName: customer.fullName.trim() || undefined,
    });

    if (!result.ok) {
      if (result.status === 409) {
        setHold({
          holdReference: null,
          status: null,
          expiresAt: null,
          selectedColor: null,
        });
      }
      return {
        ok: false,
        message: result.message,
      };
    }

    const holdVehicleType = resolvedVehicleType ?? rental.vehicleType;
    setHold({
      holdReference: result.data.holdReference,
      sessionKey: result.data.sessionKey,
      expiresAt: result.data.expiresAt,
      status: result.data.status,
      vehicleId: rental.vehicleId,
      vehicleSlug: rental.vehicleSlug || null,
      vehicleType: holdVehicleType,
      selectedColor: rental.selectedColor,
      pickupDate: rental.pickupDate,
      pickupTime: rental.pickupTime,
      returnDate: rental.returnDate,
      returnTime: rental.returnTime,
    });
    setError(null);
    return { ok: true };
  }, [bookingState, clearHold, reservationHold, setError, setHold]);

  const releaseActiveHold = useCallback(async (): Promise<void> => {
    if (!reservationHold.holdReference) {
      clearHold();
      return;
    }
    await releaseReservationHold(reservationHold.holdReference);
    clearHold();
  }, [clearHold, reservationHold.holdReference]);

  return {
    createOrRefreshHold,
    releaseActiveHold,
    holdMatchesCurrentRental: holdMatchesRental(reservationHold, bookingState.rental),
  };
}
