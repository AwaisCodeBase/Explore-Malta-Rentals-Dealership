"use client";

import { useState, useEffect } from "react";
import type { ApiVehicleType } from "@/features/vehicles/data/vehicles";
import type { AvailableColorDto } from "@/lib/vehicle-units/types";

/* ─── state shape ────────────────────────────────────────────── */

type AvailabilityReady = {
  kind: "ready";
  isAvailable: boolean;
  availabilityStatus: "available" | "reserved_temporarily" | "unavailable";
  message: string;
  availableColors: readonly AvailableColorDto[];
};

export type VehicleAvailabilityState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | AvailabilityReady;

/* ─── helpers ────────────────────────────────────────────────── */

export function vehicleIsBookableForTrip(state: VehicleAvailabilityState): boolean {
  return state.kind === "ready" && state.isAvailable;
}

export function holdBlockedMessageForTrip(
  tripCommitted: boolean,
  state: VehicleAvailabilityState,
): string | null {
  if (!tripCommitted) return null;
  if (state.kind !== "ready") return null;
  if (state.isAvailable) return null;
  return state.message || "Not available for selected dates.";
}

/* ─── hook ───────────────────────────────────────────────────── */

export function useVehicleAvailabilityCheck(
  vehicleId: string,
  vehicleType: ApiVehicleType,
  tripDatesCommitted: boolean,
  pickupDate: string,
  returnDate: string,
  pickupTime: string,
  returnTime: string,
): VehicleAvailabilityState {
  const [availability, setAvailability] = useState<VehicleAvailabilityState>({
    kind: "idle",
  });

  useEffect(() => {
    if (!tripDatesCommitted || !vehicleId.trim()) {
      queueMicrotask(() => setAvailability({ kind: "idle" }));
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    queueMicrotask(() => setAvailability({ kind: "loading" }));

    const check = async () => {
      try {
        const params = new URLSearchParams({
          vehicleId,
          vehicleType,
          pickupDate,
          pickupTime,
          returnDate,
          returnTime,
        });
        const res = await fetch(`/api/availability?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (cancelled) return;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setAvailability({
            kind: "error",
            message:
              (body as { message?: string }).message ??
              "Could not check availability. Try again.",
          });
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        const rawColors = Array.isArray((data as { availableColors?: unknown }).availableColors)
          ? (data as { availableColors: unknown[] }).availableColors
          : [];
        const availableColors = rawColors.filter(
          (item): item is AvailableColorDto =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as AvailableColorDto).value === "string" &&
            typeof (item as AvailableColorDto).label === "string" &&
            typeof (item as AvailableColorDto).availableUnitCount === "number",
        );

        setAvailability({
          kind: "ready",
          isAvailable: Boolean(data.isAvailable),
          availabilityStatus: data.availabilityStatus ?? (data.isAvailable ? "available" : "unavailable"),
          message: data.message ?? "",
          availableColors,
        });
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setAvailability({
          kind: "error",
          message: "Could not check availability. Try again.",
        });
      }
    };

    void check();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [tripDatesCommitted, vehicleId, vehicleType, pickupDate, pickupTime, returnDate, returnTime]);

  return availability;
}
