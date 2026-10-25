"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { BookingSearchForm } from "./booking-search-form";
import { VEHICLE_TYPES } from "@/features/vehicles/data/vehicles";
import {
  parseBrandSearchParam,
  parseCcSearchParam,
  parseColorSearchParam,
  parseSeatsSearchParam,
  parseTransmissionSearchParam,
  vehicleColorToUrlParam,
  type EngineCcFilter,
} from "@/features/vehicles/lib/booking-search-params";
import type { VehicleColor } from "@/features/vehicles/data/vehicles";

/**
 * Thin wrapper around BookingSearchForm that reads current URL search params and
 * pre-fills the form fields.  Used on the /vehicles listing page so the search
 * card always reflects what is already in the URL (e.g. after navigating from the
 * homepage, or after a previous search).
 *
 * Must be rendered inside a <Suspense> boundary because it calls useSearchParams().
 */
export function BookingSearchFormFromUrl({
  brandOptions,
  vehicleListingFilters = false,
  listingColorOptions = [],
}: Readonly<{
  brandOptions?: readonly string[];
  /** Extra transmission / seats / color fields for `/vehicles` only. */
  vehicleListingFilters?: boolean;
  listingColorOptions?: readonly VehicleColor[];
}> = {}) {
  const searchParams = useSearchParams();

  const { initialValues, activeEngineCc } = useMemo(() => {
    const pickupDate =
      searchParams.get("pickupDate") ?? searchParams.get("date") ?? undefined;
    const dropoffDate =
      searchParams.get("returnDate") ??
      searchParams.get("dropoffDate") ??
      undefined;
    const pickupTime = searchParams.get("pickupTime") ?? undefined;
    const dropoffTime =
      searchParams.get("dropoffTime") ?? searchParams.get("returnTime") ?? undefined;

    const rawType = searchParams.get("type") ?? "";
    const vehicleType =
      (VEHICLE_TYPES as readonly string[]).includes(rawType) ? rawType : "all";

    const brand = parseBrandSearchParam(searchParams.get("brand"));

    const transmission = parseTransmissionSearchParam(searchParams.get("transmission"));
    const seats = parseSeatsSearchParam(searchParams.get("seats"));
    const colorParsed = parseColorSearchParam(searchParams.get("color"));
    const engineCc: EngineCcFilter = parseCcSearchParam(searchParams.get("cc"));

    return {
      activeEngineCc: engineCc,
      initialValues: {
        pickupDate,
        dropoffDate,
        pickupTime,
        dropoffTime,
        vehicleType,
        brand,
        transmission:
          transmission === "All" ? "all" : transmission.toLowerCase(),
        seats: seats === "All" ? "all" : String(seats),
        color: colorParsed === "All" ? "all" : vehicleColorToUrlParam(colorParsed),
      },
    };
  }, [searchParams]);

  return (
    <BookingSearchForm
      initialValues={initialValues}
      brandOptions={brandOptions}
      vehicleListingFilters={vehicleListingFilters}
      listingColorOptions={listingColorOptions}
      activeEngineCc={activeEngineCc}
    />
  );
}
