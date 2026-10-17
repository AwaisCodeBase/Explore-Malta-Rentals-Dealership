"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { Vehicle } from "@/features/vehicles/data/vehicles";
import { buildBookingUrlWithVehicle } from "@/features/vehicles/lib/build-booking-url-with-vehicle";
import { createReservationHoldWithRetry } from "@/features/booking-flow/lib/reservation-hold-api";
import { RESERVATION_HOLD_STORAGE_KEY } from "@/features/booking-flow/lib/reservation-hold-storage";
import type { AvailableColorDto } from "@/lib/vehicle-units/types";

export const VEHICLE_TRIP_SEARCH_ANCHOR_ID = "vehicle-trip-search";

type BookNowButtonProps = {
  vehicle: Vehicle;
  bookingHref: string;
  /** When false, click scrolls to trip search instead of reserving or navigating with dates. */
  tripDatesCommitted: boolean;
  onTripDatesRequired?: () => void;
  pickupDate?: string | null;
  returnDate?: string | null;
  pickupTime?: string | null;
  returnTime?: string | null;
  /** Colors available for the selected trip window (from availability API). */
  availableColors?: readonly AvailableColorDto[];
  selectedColor?: string | null;
  /**
   * When provided (vehicle details), color must be chosen before creating a hold.
   * Listing cards omit this — Book now only navigates into the booking flow.
   */
  onColorRequired?: () => void;
  className: string;
  busyClassName?: string;
  /**
   * When set, holding dates is permitted.
   * If false with tripDatesCommitted=true, the button navigates instead of holding.
   */
  allowHold?: boolean;
  /** When set (and allowHold is false), button shows this message instead of the error. */
  holdBlockedMessage?: string | null;
  /** Disable while availability is still being checked. */
  disabled?: boolean;
};

export function BookNowButton({
  vehicle,
  bookingHref,
  tripDatesCommitted,
  onTripDatesRequired,
  pickupDate,
  returnDate,
  pickupTime,
  returnTime,
  availableColors,
  selectedColor,
  onColorRequired,
  className,
  busyClassName,
  allowHold,
  holdBlockedMessage,
  disabled = false,
}: BookNowButtonProps) {
  const router = useRouter();
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tripDatesCommitted) {
      setError(null);
    }
  }, [tripDatesCommitted]);

  const nextUrl = useMemo(
    () => buildBookingUrlWithVehicle(bookingHref, vehicle.slug, selectedColor),
    [bookingHref, selectedColor, vehicle.slug],
  );
  const canCreateHold = Boolean(
    pickupDate?.trim() &&
      returnDate?.trim() &&
      pickupTime?.trim() &&
      returnTime?.trim(),
  );
  const isDisabled = disabled || isReserving;

  const handleClick = async () => {
    if (isDisabled) {
      return;
    }
    setError(null);

    if (!tripDatesCommitted) {
      document
        .getElementById(VEHICLE_TRIP_SEARCH_ANCHOR_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      onTripDatesRequired?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("vehicle-trip-dates-required"));
      }
      setError(
        "Select trip dates and click Search available vehicles before booking.",
      );
      return;
    }

    // Listing cards (no color/hold UI): open booking for this vehicle + dates.
    if (!onColorRequired) {
      router.push(nextUrl);
      return;
    }

    // If availability was checked and vehicle is not available, block the hold.
    if (allowHold === false && holdBlockedMessage) {
      setError(holdBlockedMessage);
      return;
    }
    if (!canCreateHold) {
      router.push(nextUrl);
      return;
    }

    const colorsNeedingSelection = availableColors ?? [];
    if (colorsNeedingSelection.length > 0 && !selectedColor?.trim()) {
      onColorRequired();
      setError("Please select a color to continue");
      return;
    }

    setIsReserving(true);
    const result = await createReservationHoldWithRetry({
      vehicleId: vehicle.id,
      vehicleType: vehicle.apiVehicleType,
      ...(selectedColor?.trim() ? { color: selectedColor.trim() } : {}),
      pickupDate: pickupDate!.trim(),
      pickupTime: pickupTime!.trim(),
      returnDate: returnDate!.trim(),
      returnTime: returnTime!.trim(),
    });
    setIsReserving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    window.sessionStorage.setItem(
      RESERVATION_HOLD_STORAGE_KEY,
      JSON.stringify({
        holdReference: result.data.holdReference,
        sessionKey: result.data.sessionKey,
        expiresAt: result.data.expiresAt,
        status: result.data.status,
        vehicleId: vehicle.id,
        vehicleSlug: vehicle.slug,
        vehicleType: vehicle.apiVehicleType,
        selectedColor: selectedColor?.trim() || null,
        pickupDate: pickupDate!.trim(),
        pickupTime: pickupTime!.trim(),
        returnDate: returnDate!.trim(),
        returnTime: returnTime!.trim(),
      }),
    );
    router.push(nextUrl);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col items-stretch gap-1.5">
      <button
        type="button"
        onClick={() => {
          void handleClick();
        }}
        disabled={isDisabled}
        aria-busy={isReserving || disabled || undefined}
        className={
          isDisabled && busyClassName
            ? busyClassName
            : [
                className,
                disabled ? "cursor-not-allowed opacity-60" : "",
              ]
                .filter(Boolean)
                .join(" ")
        }
      >
        {isReserving ? "Reserving..." : disabled ? "Checking…" : "Book now"}
      </button>
      {error ? (
        <span className="text-[11px] font-medium leading-snug text-rose-700">{error}</span>
      ) : null}
    </div>
  );
}
