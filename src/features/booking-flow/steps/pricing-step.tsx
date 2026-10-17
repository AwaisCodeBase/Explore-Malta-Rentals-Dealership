"use client";

import { useMemo } from "react";
import { StepShell } from "@/features/booking-flow/components/step-shell";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import { useVehicle, useVehicles } from "@/features/vehicles/lib/use-vehicles";
import {
  calculateBookingPrice,
  formatEur,
} from "@/lib/pricing/calculate-booking-price";

export function PricingStep() {
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

  const { vehicles } = useVehicles({ rentalWindow });
  const incomingSlug = state.rental.vehicleSlug?.trim() ?? "";
  const { vehicle: slugVehicle } = useVehicle(incomingSlug);

  const selectedVehicle = useMemo(() => {
    if (state.rental.vehicleId) {
      const byId = vehicles.find((vehicle) => vehicle.id === state.rental.vehicleId);
      if (byId) {
        return byId;
      }
    }
    if (incomingSlug) {
      const bySlug = vehicles.find((vehicle) => vehicle.slug === incomingSlug);
      if (bySlug) {
        return bySlug;
      }
    }
    return slugVehicle;
  }, [incomingSlug, slugVehicle, state.rental.vehicleId, vehicles]);

  const pricing = useMemo(() => {
    if (!selectedVehicle || selectedVehicle.baseDailyRate <= 0) {
      return null;
    }

    const vehicleType = state.rental.vehicleType || selectedVehicle.apiVehicleType;
    if (!vehicleType) {
      return null;
    }

    return calculateBookingPrice({
      rental: {
        vehicle: {
          id: state.rental.vehicleId || selectedVehicle.id,
          slug: state.rental.vehicleSlug || selectedVehicle.slug,
          name: state.rental.vehicleName || selectedVehicle.name,
          type: vehicleType,
        },
        pickupDate: state.rental.pickupDate,
        returnDate: state.rental.returnDate,
        pickupTime: state.rental.pickupTime,
        returnTime: state.rental.returnTime,
      },
      delivery: {
        pickupOption: "office",
        dropoffOption: "office",
      },
      addons: {
        additionalDriver: false,
        storageBox: false,
        cdwOption: "no_cdw",
      },
      additionalDriver: {
        enabled: false,
      },
      deposit: {
        method: "",
      },
      vehiclePricing: {
        baseDailyRate: selectedVehicle.baseDailyRate,
        vehicleType: selectedVehicle.apiVehicleType,
        supportsStorageBox: selectedVehicle.supportsStorageBox,
      },
    });
  }, [selectedVehicle, state]);

  const emptyReason = (() => {
    if (!selectedVehicle) {
      return "Select a vehicle with pricing and valid pickup/return date-time to see the pricing summary.";
    }
    if (selectedVehicle.baseDailyRate <= 0) {
      return "This vehicle does not have a published daily rate yet.";
    }
    if (
      !state.rental.pickupDate.trim() ||
      !state.rental.pickupTime.trim() ||
      !state.rental.returnDate.trim() ||
      !state.rental.returnTime.trim()
    ) {
      return "Select valid pickup and return date-times to see the pricing summary.";
    }
    return "Unable to calculate pricing for the selected trip. Check that return is after pickup.";
  })();

  return (
    <StepShell title="Pricing" description="Section: Pricing Preview">
      <div className="space-y-4 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-sunken)] p-4 text-sm text-[var(--text-secondary)] sm:p-5">
        <p>
          Vehicle:{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            {state.rental.vehicleName || selectedVehicle?.name || "Not selected yet"}
            {(state.rental.vehicleType || selectedVehicle?.apiVehicleType)
              ? ` (${state.rental.vehicleType || selectedVehicle?.apiVehicleType})`
              : ""}
          </span>
        </p>
        {pricing ? (
          <div className="space-y-2">
            <p className="type-spec text-[var(--text-muted)]">Pricing Summary</p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed tabular-nums marker:text-[var(--orange-400)]">
              <li>
                Duration: {pricing.rentalDays} day(s) billed ({pricing.tierRange})
              </li>
              <li>Actual duration: {pricing.actualDurationHours.toFixed(1)} hours</li>
              <li>Base daily rate: {formatEur(pricing.baseDailyRate)}/day</li>
              <li>
                Duration discount: {pricing.durationDiscountPercent}% →{" "}
                {formatEur(pricing.appliedDailyRate)}/day
              </li>
              <li>Estimated rental total: {formatEur(pricing.rentalCost)}</li>
            </ul>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">{emptyReason}</p>
        )}
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--r-field)] border border-[var(--line-subtle)] bg-[var(--surface-card)] px-3.5 py-3 leading-relaxed shadow-[var(--elev-1)] transition duration-[var(--dur-fast)] hover:border-[var(--line-strong)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2">
          <input
            type="checkbox"
            name="rental.pricingAcknowledged"
            data-field="rental.pricingAcknowledged"
            checked={state.rental.pricingAcknowledged}
            onChange={(event) =>
              updateSection("rental", { pricingAcknowledged: event.target.checked })
            }
            className="mt-0.5 h-4 w-4 shrink-0 rounded-sm accent-[var(--blue-500)] focus:outline-none"
          />
          <span>
            I reviewed this estimated pricing summary and final cost will be decided at the end based
            on others options selected.
          </span>
        </label>
        {getFieldError("rental.pricingAcknowledged") ? (
          <p
            className="rounded-[var(--r-field)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
            role="alert"
          >
            {getFieldError("rental.pricingAcknowledged")}
          </p>
        ) : null}
      </div>
    </StepShell>
  );
}
