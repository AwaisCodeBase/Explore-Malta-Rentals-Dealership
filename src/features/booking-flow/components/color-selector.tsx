"use client";

import { useEffect, useMemo } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { StepShell } from "@/features/booking-flow/components/step-shell";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import {
  colorsMatch,
  formatVehicleColorLabel,
  parseVehicleColorValue,
} from "@/features/vehicles/lib/vehicle-color";
import { useVehicles } from "@/features/vehicles/lib/use-vehicles";

export function ColorSelectorStep() {
  const t = useTranslations("BookingSteps.color");
  const { state, reservationHold, updateSection, getFieldError } = useBookingFlow();

  const rentalWindow = useMemo(() => {
    const { pickupDate, pickupTime, returnDate, returnTime } = state.rental;
    if (!pickupDate.trim() || !pickupTime.trim() || !returnDate.trim() || !returnTime.trim()) {
      return null;
    }
    return {
      pickupDate: pickupDate.trim(),
      pickupTime: pickupTime.trim(),
      returnDate: returnDate.trim(),
      returnTime: returnTime.trim(),
      sessionKey: reservationHold.sessionKey?.trim() || undefined,
    };
  }, [
    reservationHold.sessionKey,
    state.rental.pickupDate,
    state.rental.pickupTime,
    state.rental.returnDate,
    state.rental.returnTime,
  ]);

  const { vehicles, isLoading } = useVehicles({ rentalWindow });

  const selectedVehicle = useMemo(() => {
    if (!state.rental.vehicleId) {
      return null;
    }
    return vehicles.find((vehicle) => vehicle.id === state.rental.vehicleId) ?? null;
  }, [state.rental.vehicleId, vehicles]);

  const availableColors = selectedVehicle?.availableColors ?? [];
  const showSelector = Boolean(state.rental.vehicleId && rentalWindow && availableColors.length > 0);
  const colorError = getFieldError("rental.selectedColor");

  // Normalize incoming color (URL / hold) to the canonical label once options are known.
  useEffect(() => {
    if (!showSelector || !state.rental.selectedColor) {
      return;
    }
    const match = availableColors.find((option) =>
      colorsMatch(option.label, state.rental.selectedColor),
    );
    if (match && match.label !== state.rental.selectedColor) {
      updateSection("rental", { selectedColor: match.label });
    }
  }, [availableColors, showSelector, state.rental.selectedColor, updateSection]);

  useEffect(() => {
    // Wait until the rental window vehicle list has loaded — clearing while loading
    // would wipe a color carried from the vehicle details page.
    if (isLoading || !rentalWindow || !state.rental.vehicleId) {
      return;
    }

    if (!showSelector) {
      if (state.rental.selectedColor) {
        updateSection("rental", { selectedColor: null });
      }
      return;
    }

    const current = state.rental.selectedColor;
    if (!current) {
      return;
    }

    const stillAvailable = availableColors.some((option) => colorsMatch(option.label, current));
    if (!stillAvailable) {
      updateSection("rental", { selectedColor: null });
    }
  }, [
    availableColors,
    isLoading,
    rentalWindow,
    showSelector,
    state.rental.selectedColor,
    state.rental.vehicleId,
    updateSection,
  ]);

  // Prefer hold/URL color even before vehicle list finishes loading (for display readiness).
  useEffect(() => {
    if (state.rental.selectedColor || !reservationHold.selectedColor) {
      return;
    }
    const canonical =
      parseVehicleColorValue(reservationHold.selectedColor) ??
      formatVehicleColorLabel(reservationHold.selectedColor);
    if (canonical) {
      updateSection("rental", { selectedColor: canonical });
    }
  }, [reservationHold.selectedColor, state.rental.selectedColor, updateSection]);

  if (!showSelector) {
    return null;
  }

  return (
    <StepShell title={t("title")} description={t("description")}>
      <fieldset className="space-y-3">
        <legend className="sr-only">{t("title")}</legend>
        <div className="flex flex-wrap gap-2.5">
          {availableColors.map((option) => {
            const isSelected = colorsMatch(state.rental.selectedColor, option.label);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => updateSection("rental", { selectedColor: option.label })}
                className={[
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold tracking-[-0.01em] transition duration-[var(--dur-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/25 shadow-[var(--elev-2)]"
                    : "border-[var(--line)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-[var(--elev-1)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                    isSelected
                      ? "bg-blue-500 text-white"
                      : "border border-[var(--line-strong)] bg-transparent text-transparent",
                  ].join(" ")}
                  aria-hidden
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={4} />
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
        {colorError ? (
          <p
            className="rounded-[var(--r-field)] border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            role="alert"
          >
            {colorError}
          </p>
        ) : null}
      </fieldset>
    </StepShell>
  );
}
