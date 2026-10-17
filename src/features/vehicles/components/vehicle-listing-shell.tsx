"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import { addDays } from "date-fns";
import { TRIP_MIN_SPAN_DAYS } from "@/features/booking/lib/booking-schema";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { IndicativeDailyRatesCard } from "@/components/pricing/indicative-daily-rates-card";
import { Container } from "@/components/ui/container";
import type { BookingOption } from "@/features/home/data/hero-booking-options";
import { getFormBackgroundPublicPath } from "@/lib/form-background";
import { VehicleCard } from "@/features/vehicles/components/vehicle-card";
import {
  groupVehiclesByEngineCc,
  vehicleListingItemClass,
  vehicleListingTrackClass,
  type EngineCcGroupId,
} from "@/features/vehicles/lib/vehicle-listing-layout";
import { VehicleFilters } from "@/features/vehicles/components/vehicle-filters";
import { VehicleListingSidebar } from "@/features/vehicles/components/vehicle-listing-sidebar";
import { filterVehicles } from "@/features/vehicles/lib/filter-vehicles";
import { useVehicles } from "@/features/vehicles/lib/use-vehicles";
import {
  VehiclesSearchNavProvider,
  consumeScrollToVehicleResults,
  useVehiclesSearchNav,
} from "@/features/vehicles/lib/vehicles-search-nav-context";
import { resolveBrandFilterLabel } from "@/lib/vehicles/brand-utils";
import type {
  Transmission,
  Vehicle,
  VehicleColor,
  VehicleSeatsFilter,
  VehicleType,
} from "@/features/vehicles/data/vehicles";
import {
  brandToUrlParam,
  clampTripEndDate,
  formatPickupDateParam,
  parseBrandSearchParam,
  parseCcSearchParam,
  parseColorSearchParam,
  parsePickupDateParam,
  parseSeatsSearchParam,
  parseTransmissionSearchParam,
  parseVehicleTypeSearchParam,
  seatsFilterToUrlParam,
  transmissionToUrlParam,
  vehicleColorToUrlParam,
  vehicleFilterTypeToUrlParam,
  type EngineCcFilter,
} from "@/features/vehicles/lib/booking-search-params";

/** Tailwind `lg` — sidebar rail visible; hero omits seats/color there. */
const LG_MIN_PX = 1024;
const DEFAULT_PICKUP_DATE = new Date(2026, 5, 12);
const DEFAULT_RETURN_DATE = addDays(DEFAULT_PICKUP_DATE, TRIP_MIN_SPAN_DAYS);
/** Listing filters do not collect times; defaults align availability with a sensible day window. */
const DEFAULT_LISTING_PICKUP_TIME = "09:00";
const DEFAULT_LISTING_DROPOFF_TIME = "09:00";

function subscribeMinWidthLg(onChange: () => void) {
  const mq = window.matchMedia(`(min-width: ${LG_MIN_PX}px)`);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMinWidthLgSnapshot() {
  return window.matchMedia(`(min-width: ${LG_MIN_PX}px)`).matches;
}

function useIsLgViewport() {
  return useSyncExternalStore(
    subscribeMinWidthLg,
    getMinWidthLgSnapshot,
    () => false,
  );
}

type VehicleListingShellProps = Readonly<{
  vehicles?: readonly Vehicle[];
  /** Preloaded active listing brands for the search card dropdown. */
  brandOptions?: readonly string[];
  /** When set, title + filters sit in a bounded band with backdrop; grid sits on page background below. */
  heroIntro?: Readonly<{
    title: string;
    description: string;
  }>;
  /**
   * When provided, replaces the built-in VehicleFilters block inside the hero
   * section.  Pass <BookingSearchFormFromUrl /> here to show the Quick Search
   * card on the vehicles listing page without duplicating any logic.
   */
  searchPanel?: React.ReactNode;
  /** Server-rendered vehicle grid — shown until client filters take over. */
  children?: React.ReactNode;
}>;

export function VehicleListingShell(props: VehicleListingShellProps) {
  return (
    <VehiclesSearchNavProvider>
      <VehicleListingShellInner {...props} />
    </VehiclesSearchNavProvider>
  );
}

function VehicleListingShellInner({
  vehicles,
  brandOptions = [],
  heroIntro,
  searchPanel,
  children,
}: VehicleListingShellProps) {
  const tListing = useTranslations("VehicleListing");
  const searchNav = useVehiclesSearchNav();
  const isUrlSearchPending = searchNav?.isSearchPending ?? false;
  const shouldFetchFromApi = !vehicles;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const brandParam = searchParams.get("brand");
  const transmissionParam = searchParams.get("transmission");
  const colorParam = searchParams.get("color");
  const seatsParam = searchParams.get("seats");
  const locationParam = searchParams.get("location");
  const dateParam = searchParams.get("date");
  const returnDateParam = searchParams.get("returnDate");
  /** From booking form `buildVehiclesSearchUrl` — fallback when `date` / `returnDate` absent. */
  const pickupDateParam = searchParams.get("pickupDate");
  const dropoffDateParam = searchParams.get("dropoffDate");
  const hotelDeliveryParam = searchParams.get("hotelDelivery");
  const ccParam = searchParams.get("cc");
  const pickupTimeParam = searchParams.get("pickupTime");
  const dropoffTimeParam = searchParams.get("dropoffTime");

  const initialType = parseVehicleTypeSearchParam(typeParam);
  const initialBrand = resolveBrandFilterLabel(
    parseBrandSearchParam(brandParam),
    brandOptions,
  );
  const initialTransmission =
    parseTransmissionSearchParam(transmissionParam);
  const initialColor = parseColorSearchParam(colorParam);
  const initialSeats = parseSeatsSearchParam(seatsParam);
  const initialPickup =
    parsePickupDateParam(dateParam) ??
    parsePickupDateParam(pickupDateParam) ??
    DEFAULT_PICKUP_DATE;
  const parsedReturn =
    parsePickupDateParam(returnDateParam) ??
    parsePickupDateParam(dropoffDateParam);
  const initialReturn = parsedReturn
    ? clampTripEndDate(initialPickup, parsedReturn)
    : addDays(initialPickup, TRIP_MIN_SPAN_DAYS);
  const initialLocation: BookingOption | null = locationParam
    ? { value: `url:${locationParam}`, label: locationParam }
    : null;

  const [pickupLocation, setPickupLocation] = useState<BookingOption | null>(
    initialLocation,
  );
  const [pickupDate, setPickupDate] = useState<Date>(initialPickup);
  const [returnDate, setReturnDate] = useState<Date>(initialReturn);
  const [selectedType, setSelectedType] =
    useState<VehicleType | "All">(initialType);
  const [selectedBrand, setSelectedBrand] = useState<string | "All">(initialBrand);
  const [selectedTransmission, setSelectedTransmission] =
    useState<Transmission | "All">(initialTransmission);
  const [selectedColor, setSelectedColor] = useState<VehicleColor | "All">(
    initialColor,
  );
  const [selectedSeats, setSelectedSeats] =
    useState<VehicleSeatsFilter>(initialSeats);

  /** Hold-aware listing only after trip is committed to the URL (Search). */
  const urlTripPickupDate = (dateParam ?? pickupDateParam)?.trim() || "";
  const urlTripReturnDate = (returnDateParam ?? dropoffDateParam)?.trim() || "";
  const urlTripPickupTime = pickupTimeParam?.trim() || "";
  const urlTripReturnTime = dropoffTimeParam?.trim() || "";

  const vehiclesFetchRentalWindow = useMemo(() => {
    if (!urlTripPickupDate || !urlTripReturnDate) {
      return null;
    }
    return {
      pickupDate: urlTripPickupDate,
      pickupTime: urlTripPickupTime || DEFAULT_LISTING_PICKUP_TIME,
      returnDate: urlTripReturnDate,
      returnTime: urlTripReturnTime || DEFAULT_LISTING_DROPOFF_TIME,
    };
  }, [urlTripPickupDate, urlTripReturnDate, urlTripPickupTime, urlTripReturnTime]);

  const tripDatesCommitted = vehiclesFetchRentalWindow !== null;

  const {
    vehicles: apiVehicles,
    isLoading: isVehiclesLoading,
    error: vehiclesError,
  } = useVehicles({ enabled: shouldFetchFromApi, rentalWindow: vehiclesFetchRentalWindow });

  const vehicleDataset = vehicles ?? apiVehicles;

  const [appliedType, setAppliedType] =
    useState<VehicleType | "All">(initialType);
  const [appliedBrand, setAppliedBrand] = useState<string | "All">(initialBrand);
  const [appliedTransmission, setAppliedTransmission] =
    useState<Transmission | "All">(initialTransmission);
  const [appliedColor, setAppliedColor] =
    useState<VehicleColor | "All">(initialColor);
  const [appliedSeats, setAppliedSeats] =
    useState<VehicleSeatsFilter>(initialSeats);
  const [appliedCc, setAppliedCc] = useState<EngineCcFilter>(() =>
    parseCcSearchParam(ccParam),
  );

  const [hotelDelivery, setHotelDelivery] = useState(
    hotelDeliveryParam === "1",
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [tripDatesPrompt, setTripDatesPrompt] = useState(false);
  const [useClientResults, setUseClientResults] = useState(false);

  useEffect(() => {
    if (!tripDatesPrompt) {
      return;
    }
    const timer = window.setTimeout(() => setTripDatesPrompt(false), 6000);
    return () => window.clearTimeout(timer);
  }, [tripDatesPrompt]);

  const searchParamsKey = searchParams.toString();

  /** After Search available vehicles, land on the results block instead of the page top. */
  useEffect(() => {
    if (isUrlSearchPending) return;
    consumeScrollToVehicleResults();
  }, [isUrlSearchPending, searchParamsKey]);

  useEffect(() => {
    const onTripDatesRequired = () => setTripDatesPrompt(true);
    window.addEventListener("vehicle-trip-dates-required", onTripDatesRequired);
    return () => {
      window.removeEventListener("vehicle-trip-dates-required", onTripDatesRequired);
    };
  }, []);

  useEffect(() => {
    const b = resolveBrandFilterLabel(parseBrandSearchParam(brandParam), brandOptions);
    setSelectedBrand(b);
    setAppliedBrand(b);
  }, [brandParam, brandOptions]);

  const replaceQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const t = parseVehicleTypeSearchParam(typeParam);
    setSelectedType(t);
    setAppliedType(t);
  }, [typeParam]);

  useEffect(() => {
    const tr = parseTransmissionSearchParam(transmissionParam);
    setSelectedTransmission(tr);
    setAppliedTransmission(tr);
  }, [transmissionParam]);

  useEffect(() => {
    const c = parseColorSearchParam(colorParam);
    setSelectedColor(c);
    setAppliedColor(c);
  }, [colorParam]);

  useEffect(() => {
    const s = parseSeatsSearchParam(seatsParam);
    setSelectedSeats(s);
    setAppliedSeats(s);
  }, [seatsParam]);

  useEffect(() => {
    if (locationParam) {
      const loc = {
        value: `url:${locationParam}`,
        label: locationParam,
      };
      setPickupLocation(loc);
    } else {
      setPickupLocation(null);
    }
  }, [locationParam]);

  useEffect(() => {
    const pu =
      parsePickupDateParam(dateParam) ??
      parsePickupDateParam(pickupDateParam);
    const ret =
      parsePickupDateParam(returnDateParam) ??
      parsePickupDateParam(dropoffDateParam);
    if (pu) {
      setPickupDate(pu);
      setReturnDate(
        ret ? clampTripEndDate(pu, ret) : addDays(pu, TRIP_MIN_SPAN_DAYS),
      );
    }
  }, [
    dateParam,
    returnDateParam,
    pickupDateParam,
    dropoffDateParam,
  ]);

  useEffect(() => {
    setHotelDelivery(hotelDeliveryParam === "1");
  }, [hotelDeliveryParam]);

  useEffect(() => {
    setAppliedCc(parseCcSearchParam(ccParam));
  }, [ccParam]);

  const handlePickupLocationChange = useCallback(
    (option: BookingOption | null) => {
      setPickupLocation(option);
    },
    [],
  );

  const handleTripDatesChange = useCallback((start: Date, end: Date) => {
    setPickupDate(start);
    setReturnDate(end);
  }, []);

  const persistListingFilters = useCallback(
    (next: {
      type?: VehicleType | "All";
      brand?: string | "All";
      transmission?: Transmission | "All";
      color?: VehicleColor | "All";
      seats?: VehicleSeatsFilter;
    }) => {
      const t = next.type ?? selectedType;
      const b = next.brand ?? selectedBrand;
      const tr = next.transmission ?? selectedTransmission;
      const c = next.color ?? selectedColor;
      const s = next.seats ?? selectedSeats;
      setSelectedType(t);
      setAppliedType(t);
      setSelectedBrand(b);
      setAppliedBrand(b);
      setSelectedTransmission(tr);
      setAppliedTransmission(tr);
      setSelectedColor(c);
      setAppliedColor(c);
      setSelectedSeats(s);
      setAppliedSeats(s);
      setUseClientResults(true);
      replaceQuery((p) => {
        p.set("type", vehicleFilterTypeToUrlParam(t));
        p.set("brand", brandToUrlParam(b));
        p.set("transmission", transmissionToUrlParam(tr));
        p.set("color", vehicleColorToUrlParam(c));
        p.set("seats", seatsFilterToUrlParam(s));
      });
    },
    [
      replaceQuery,
      selectedBrand,
      selectedColor,
      selectedSeats,
      selectedTransmission,
      selectedType,
    ],
  );

  const handleSearchResults = useCallback(() => {
    setAppliedType(selectedType);
    setAppliedBrand(selectedBrand);
    setAppliedTransmission(selectedTransmission);
    setAppliedColor(selectedColor);
    setAppliedSeats(selectedSeats);
    setUseClientResults(true);
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 220);
    replaceQuery((p) => {
      p.set("type", vehicleFilterTypeToUrlParam(selectedType));
      p.set("brand", brandToUrlParam(selectedBrand));
      p.set("transmission", transmissionToUrlParam(selectedTransmission));
      p.set("color", vehicleColorToUrlParam(selectedColor));
      p.set("seats", seatsFilterToUrlParam(selectedSeats));
      if (pickupLocation?.label) {
        p.set("location", pickupLocation.label);
      } else {
        p.delete("location");
      }
      p.set("date", formatPickupDateParam(pickupDate));
      p.set("returnDate", formatPickupDateParam(returnDate));
      p.set("pickupTime", pickupTimeParam?.trim() || DEFAULT_LISTING_PICKUP_TIME);
      p.set("dropoffTime", dropoffTimeParam?.trim() || DEFAULT_LISTING_DROPOFF_TIME);
      p.delete("pickupDate");
      p.delete("dropoffDate");
      p.delete("returnElsewhere");
      if (hotelDelivery) {
        p.set("hotelDelivery", "1");
      } else {
        p.delete("hotelDelivery");
      }
    });
    requestAnimationFrame(() => {
      document
        .getElementById("vehicle-listing-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [
    hotelDelivery,
    dropoffTimeParam,
    pickupDate,
    pickupTimeParam,
    returnDate,
    pickupLocation,
    replaceQuery,
    selectedBrand,
    selectedColor,
    selectedSeats,
    selectedTransmission,
    selectedType,
  ]);

  const handleClearFilters = useCallback(() => {
    setPickupLocation(null);
    setPickupDate(DEFAULT_PICKUP_DATE);
    setReturnDate(DEFAULT_RETURN_DATE);
    setHotelDelivery(false);
    setSelectedType("All");
    setAppliedType("All");
    setSelectedBrand("All");
    setAppliedBrand("All");
    setSelectedTransmission("All");
    setAppliedTransmission("All");
    setSelectedColor("All");
    setAppliedColor("All");
    setSelectedSeats("All");
    setAppliedSeats("All");
    setAppliedCc("All");
    setUseClientResults(true);
    setIsRefreshing(false);
    replaceQuery((p) => {
      p.set("type", vehicleFilterTypeToUrlParam("All"));
      p.set("brand", brandToUrlParam("All"));
      p.set("transmission", transmissionToUrlParam("All"));
      p.set("color", vehicleColorToUrlParam("All"));
      p.set("seats", seatsFilterToUrlParam("All"));
      p.delete("location");
      p.delete("date");
      p.delete("returnDate");
      p.delete("pickupDate");
      p.delete("dropoffDate");
      p.delete("pickupTime");
      p.delete("dropoffTime");
      p.delete("hotelDelivery");
      p.delete("returnElsewhere");
      p.delete("cc");
    });
  }, [replaceQuery]);

  const vehicleListingColorOptions = useMemo(() => {
    const unique = new Set<VehicleColor>();
    for (const v of vehicleDataset) {
      if (v.color) unique.add(v.color);
    }
    const sorted = [...unique].sort((a, b) => a.localeCompare(b));
    return ["All" as const, ...sorted];
  }, [vehicleDataset]);

  const filteredVehicles = useMemo(
    () =>
      filterVehicles({
        vehicles: vehicleDataset,
        type: appliedType,
        brand: appliedBrand,
        transmission: appliedTransmission,
        color: appliedColor,
        seats: appliedSeats,
        cc: appliedCc,
      }),
    [
      vehicleDataset,
      appliedBrand,
      appliedCc,
      appliedColor,
      appliedSeats,
      appliedType,
      appliedTransmission,
    ],
  );

  const bookingHref = (() => {
    if (!vehiclesFetchRentalWindow) {
      return "/booking";
    }
    const bookingParams = new URLSearchParams();
    bookingParams.set("date", vehiclesFetchRentalWindow.pickupDate);
    bookingParams.set("returnDate", vehiclesFetchRentalWindow.returnDate);
    bookingParams.set("pickupTime", vehiclesFetchRentalWindow.pickupTime);
    bookingParams.set("dropoffTime", vehiclesFetchRentalWindow.returnTime);
    return `/booking?${bookingParams.toString()}`;
  })();

  const detailsDateQuery = (() => {
    if (!vehiclesFetchRentalWindow) return "";
    const p = new URLSearchParams();
    p.set("pickupDate", vehiclesFetchRentalWindow.pickupDate);
    p.set("returnDate", vehiclesFetchRentalWindow.returnDate);
    p.set("pickupTime", vehiclesFetchRentalWindow.pickupTime);
    p.set("returnTime", vehiclesFetchRentalWindow.returnTime);
    return `?${p.toString()}`;
  })();

  /** Vehicles listing uses the hero search card for filters (no left rail). */
  const showListingSidebar = false;
  const isLg = useIsLgViewport();
  const hideSeatsInHero = false;
  const showListingExtrasInHero = pathname === "/vehicles";

  const filters = searchPanel ? null : (
    <VehicleFilters
      pickupLocation={pickupLocation}
      onPickupLocationChange={handlePickupLocationChange}
      tripStart={pickupDate}
      tripEnd={returnDate}
      onTripDatesChange={handleTripDatesChange}
      selectedType={selectedType}
      selectedTransmission={selectedTransmission}
      onTypeChange={(v) => persistListingFilters({ type: v })}
      onTransmissionChange={(v) => persistListingFilters({ transmission: v })}
      selectedSeats={selectedSeats}
      onSeatsChange={(v) => persistListingFilters({ seats: v })}
      hideSeatsFilter={hideSeatsInHero}
      colorFilterOptions={
        showListingExtrasInHero ? vehicleListingColorOptions : undefined
      }
      selectedColor={showListingExtrasInHero ? selectedColor : undefined}
      onColorChange={
        showListingExtrasInHero
          ? (v: VehicleColor | "All") => persistListingFilters({ color: v })
          : undefined
      }
      hotelDelivery={hotelDelivery}
      onHotelDeliveryChange={setHotelDelivery}
      onClearFilters={handleClearFilters}
      onSearch={handleSearchResults}
    />
  );

  const listingSidebar = showListingSidebar ? (
    <VehicleListingSidebar
      variant="rail"
      collapsed={filtersCollapsed}
      onToggleCollapsed={() => setFiltersCollapsed((c) => !c)}
      brandOptions={brandOptions}
      selectedBrand={selectedBrand}
      onBrandChange={(v) => persistListingFilters({ brand: v })}
      colorOptions={vehicleListingColorOptions}
      selectedType={selectedType}
      onTypeChange={(v) => persistListingFilters({ type: v })}
      selectedTransmission={selectedTransmission}
      onTransmissionChange={(v) => persistListingFilters({ transmission: v })}
      selectedColor={selectedColor}
      onColorChange={(v) => persistListingFilters({ color: v })}
      selectedSeats={selectedSeats}
      onSeatsChange={(v) => persistListingFilters({ seats: v })}
    />
  ) : null;

  const showResultsLoading =
    isRefreshing ||
    isUrlSearchPending ||
    (shouldFetchFromApi && isVehiclesLoading);

  const showServerGrid =
    !useClientResults &&
    !showResultsLoading &&
    children != null;

  const engineCcGroups = useMemo(
    () => groupVehiclesByEngineCc(filteredVehicles),
    [filteredVehicles],
  );

  const groupTitleKey = (id: EngineCcGroupId) => {
    if (id === "50") return "group50" as const;
    if (id === "125") return "group125" as const;
    return "groupOther" as const;
  };

  const skeletonRow = (keyPrefix: string) => (
    <div className={vehicleListingTrackClass}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`${keyPrefix}-${index}`}
          className={`${vehicleListingItemClass} overflow-hidden rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4`}
        >
          <div className="aspect-[16/10] animate-pulse rounded-lg bg-slate-200/75 sm:aspect-[4/3] sm:rounded-xl" />
          <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-slate-200/75 sm:mt-4" />
          <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-200/65" />
          <div className="mt-4 h-9 w-1/2 animate-pulse rounded-md bg-slate-200/75 sm:mt-5 sm:rounded-full" />
        </div>
      ))}
    </div>
  );

  const results = (
    <div id="vehicle-listing-results" className="space-y-6 scroll-mt-28">
      {!showResultsLoading ? (
        <p className="text-sm text-slate-600">
          {tListing("showing", { count: filteredVehicles.length })}
        </p>
      ) : null}

      {tripDatesPrompt ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
        >
          {tListing("tripDatesHint")}
        </div>
      ) : null}

      {showResultsLoading ? (
        <div className="flex flex-col gap-8 sm:gap-10" aria-busy="true">
          {skeletonRow(isUrlSearchPending ? "url-search" : "refresh")}
        </div>
      ) : shouldFetchFromApi && vehiclesError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-rose-900">{tListing("loadErrorTitle")}</h3>
          <p className="mt-2 text-sm text-rose-800">{vehiclesError}</p>
        </div>
      ) : filteredVehicles.length > 0 ? (
        showServerGrid ? (
          children
        ) : (
          <div className="flex flex-col gap-8 sm:gap-10">
            {engineCcGroups.map((group) => {
              const headingId = `vehicle-group-${group.id}`;
              return (
                <section
                  key={group.id}
                  aria-labelledby={headingId}
                  className="min-w-0"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-3 sm:mb-4">
                    <h2
                      id={headingId}
                      className="text-base font-semibold tracking-[-0.02em] text-[var(--ink-950)] sm:text-lg"
                    >
                      {tListing(groupTitleKey(group.id))}
                    </h2>
                    <p className="text-xs font-medium tabular-nums text-[var(--text-muted)] sm:text-sm">
                      {tListing("groupCount", { count: group.vehicles.length })}
                    </p>
                  </div>
                  <div className={vehicleListingTrackClass}>
                    {group.vehicles.map((vehicle) => (
                      <div key={vehicle.slug} className={vehicleListingItemClass}>
                        <VehicleCard
                          vehicle={vehicle}
                          bookingHref={bookingHref}
                          detailsHref={`/vehicles/${vehicle.slug}${detailsDateQuery}`}
                          tripDatesCommitted={tripDatesCommitted}
                          onTripDatesRequired={() => setTripDatesPrompt(true)}
                          pickupDate={vehiclesFetchRentalWindow?.pickupDate ?? null}
                          returnDate={vehiclesFetchRentalWindow?.returnDate ?? null}
                          pickupTime={vehiclesFetchRentalWindow?.pickupTime ?? null}
                          returnTime={vehiclesFetchRentalWindow?.returnTime ?? null}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )
      ) : vehicleDataset.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">{tListing("emptyTitle")}</h3>
          <p className="mt-2 text-sm text-slate-600">{tListing("emptyBody")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">{tListing("noMatchTitle")}</h3>
          <p className="mt-2 text-sm text-slate-600">{tListing("noMatchBody")}</p>
        </div>
      )}
    </div>
  );

  if (heroIntro) {
    const heroSection = (
      <section
        aria-labelledby="vehicles-heading"
        className="relative isolate overflow-hidden pb-8 pt-24 sm:pb-14 sm:pt-32"
      >
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <Image
            src={getFormBackgroundPublicPath()}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-[22%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(0,0,0,0.25),transparent_70%)]" />
        </div>
        <Container className="relative z-10">
          <h1
            id="vehicles-heading"
            className="text-3xl font-semibold tracking-[-0.04em] text-white drop-shadow-[0_1px_24px_rgba(15,23,42,0.35)] sm:text-5xl"
          >
            {heroIntro.title}
          </h1>
          <p className="mt-2.5 max-w-3xl text-sm leading-snug text-white/90 sm:mt-4 sm:text-lg sm:leading-relaxed">
            {heroIntro.description}
          </p>
          <div className="mt-5 sm:mt-8">{searchPanel ?? filters}</div>
        </Container>
      </section>
    );

    const resultsBlock = (
      <Container className="pb-12 pt-5 sm:pb-16 sm:pt-8">
        {results}
        <div className="mt-8 w-full border-t border-slate-200/80 pt-8 sm:mt-10 sm:pt-10">
          <section aria-label={tListing("ariaRates")}>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{tListing("ratesBlurb")}</p>
            <div className="mt-5 w-full sm:mt-8">
              <IndicativeDailyRatesCard />
            </div>
          </section>
        </div>
      </Container>
    );

    if (listingSidebar) {
      return (
        <div className="flex w-full flex-col lg:flex-row lg:items-stretch">
          <aside
            aria-label={tListing("ariaFilters")}
            className={[
              "vehicle-filters-rail order-2 hidden w-full shrink-0 flex-col border-t border-slate-200/80 bg-gradient-to-b from-white to-[#f7fbfe] transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex lg:order-1 lg:border-t-0 lg:border-r lg:border-slate-200/50 lg:shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)] lg:backdrop-blur-sm",
              filtersCollapsed
                ? "lg:w-12 lg:max-w-12 lg:min-w-12"
                : "lg:w-[min(15.5rem,calc(100vw-1rem))] lg:max-w-[15.5rem]",
            ].join(" ")}
          >
            <div
              className={[
                "px-4 py-6 sm:px-4 sm:py-6 lg:sticky lg:top-[var(--site-header-offset)] lg:z-[1] lg:max-h-[calc(100dvh-var(--site-header-offset))] lg:overflow-y-auto lg:overscroll-contain",
                filtersCollapsed
                  ? "lg:px-2 lg:pt-3 lg:pb-5"
                  : "lg:px-4 lg:pt-4 lg:pb-7",
              ].join(" ")}
            >
              {listingSidebar}
            </div>
          </aside>
          <div className="order-1 flex min-w-0 flex-1 flex-col lg:order-2">
            {heroSection}
            {resultsBlock}
          </div>
        </div>
      );
    }

    return (
      <>
        {heroSection}
        {resultsBlock}
      </>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {listingSidebar ? (
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-0">
          <aside
            aria-label={tListing("ariaFilters")}
            className={[
              "vehicle-filters-rail order-2 hidden w-full shrink-0 flex-col border-t border-slate-200/80 bg-gradient-to-b from-white to-[#f7fbfe] transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex lg:order-1 lg:border-t-0 lg:border-r lg:border-slate-200/50 lg:shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)] lg:backdrop-blur-sm",
              filtersCollapsed
                ? "lg:w-12 lg:max-w-12 lg:min-w-12"
                : "lg:w-[min(15.5rem,calc(100vw-1rem))] lg:max-w-[15.5rem]",
            ].join(" ")}
          >
            <div
              className={[
                "px-4 py-6 sm:px-4 sm:py-6 lg:sticky lg:top-[var(--site-header-offset)] lg:z-[1] lg:max-h-[calc(100dvh-var(--site-header-offset))] lg:overflow-y-auto lg:overscroll-contain",
                filtersCollapsed
                  ? "lg:px-2 lg:pt-3 lg:pb-5"
                  : "lg:px-4 lg:pt-4 lg:pb-7",
              ].join(" ")}
            >
              {listingSidebar}
            </div>
          </aside>
          <div className="order-1 flex min-w-0 flex-1 flex-col gap-6 lg:order-2">
            {filters}
            {results}
          </div>
        </div>
      ) : (
        <>
          {filters}
          {results}
        </>
      )}
    </div>
  );
}
