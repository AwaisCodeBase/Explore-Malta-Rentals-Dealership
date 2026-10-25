"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { addDays } from "date-fns";
import AsyncSelect from "react-select/async";
import { Car, MapPin } from "lucide-react";
import Select, {
  components as selectComponents,
  type DropdownIndicatorProps,
} from "react-select";
import {
  type BookingOption,
  locationOptions,
  vehicleTypeOptions,
} from "@/features/home/data/hero-booking-options";
import { SITE_SURFACE_RADIUS } from "@/components/site-shell";
import { DEFAULT_TRIP_SPAN_DAYS } from "@/features/booking/lib/booking-schema";
import {
  vehicleFilterControlShellClass,
  vehicleFilterReactSelectStyles,
} from "@/features/vehicles/components/vehicle-pickup-fields";
import { TripDateSelector } from "@/features/vehicles/components/trip-date-selector";
import { formatPickupDateParam } from "@/features/vehicles/lib/booking-search-params";
import { markScrollToVehicleResults } from "@/features/vehicles/lib/vehicles-search-nav-context";
import { loadMaltaLocationOptions } from "@/features/vehicles/lib/malta-pickup-location";

const DEFAULT_HERO_PICKUP_DATE = new Date(2026, 5, 12);

function Toggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className="group inline-flex items-center gap-3 rounded-[var(--r-field)] text-left text-sm font-medium text-ink-700 transition-colors duration-[var(--dur-fast)] hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-500)]"
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] ${
          active
            ? "bg-orange-400 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--orange-600)_30%,transparent)]"
            : "bg-ink-200 shadow-[inset_0_0_0_1px_var(--line-subtle)]"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow-[var(--elev-1)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] motion-reduce:transition-none ${
            active ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function makeHeroFilterDropdownIndicator(changeLabel: string) {
  return function HeroFilterDropdownIndicator(
    props: DropdownIndicatorProps<BookingOption, false>,
  ) {
    return (
      <selectComponents.DropdownIndicator {...props}>
        <span className="shrink-0 text-xs font-semibold text-ink-500">
          {changeLabel}
        </span>
      </selectComponents.DropdownIndicator>
    );
  };
}

export function HeroBookingPanel() {
  const t = useTranslations("HomeHeroPanel");
  const tCommon = useTranslations("Common");
  const tVehicle = useTranslations("VehicleFilters");
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<BookingOption | null>(
    null,
  );
  const [vehicleTypeValue, setVehicleTypeValue] = useState(() => vehicleTypeOptions[0]!.value);
  const [pickupDate, setPickupDate] = useState<Date>(DEFAULT_HERO_PICKUP_DATE);
  const [returnDate, setReturnDate] = useState<Date>(() =>
    addDays(DEFAULT_HERO_PICKUP_DATE, DEFAULT_TRIP_SPAN_DAYS),
  );
  const [returnElsewhere, setReturnElsewhere] = useState(false);
  const [hotelDelivery, setHotelDelivery] = useState(true);

  useEffect(() => {
    startTransition(() => {
      setIsMounted(true);
    });
  }, []);

  const fieldClassName =
    "relative min-w-0 flex min-h-[5.25rem] flex-col justify-between rounded-[var(--r-field)] bg-[var(--surface-soft)] px-4 py-3.5 text-left shadow-[inset_0_0_0_1px_var(--line-subtle)] transition-shadow duration-[var(--dur-fast)] focus-within:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--blue-500)_35%,transparent)] sm:min-h-[5.4rem]";

  const maltaDefaultLocationOptions = useMemo(
    () => [...locationOptions],
    [],
  );

  const heroSelectComponents = useMemo(
    () => ({
      DropdownIndicator: makeHeroFilterDropdownIndicator(tCommon("change")),
    }),
    [tCommon],
  );

  const vehicleTypeOptionsLocalized = useMemo(
    () =>
      vehicleTypeOptions.map((opt) => {
        if (opt.value === "All") return { ...opt, label: tVehicle("allVehicles") };
        if (opt.value === "Scooter") return { ...opt, label: tVehicle("scooters") };
        if (opt.value === "Motorcycle") return { ...opt, label: tVehicle("motorcycles") };
        if (opt.value === "ATV") return { ...opt, label: tVehicle("atvs") };
        if (opt.value === "Bicycle") return { ...opt, label: tVehicle("bicycles") };
        return opt;
      }),
    [tVehicle],
  );

  const vehicleType = useMemo(
    () =>
      vehicleTypeOptionsLocalized.find((o) => o.value === vehicleTypeValue) ??
      vehicleTypeOptionsLocalized[0]!,
    [vehicleTypeOptionsLocalized, vehicleTypeValue],
  );

  const handleTripDatesChange = useCallback((start: Date, end: Date) => {
    setPickupDate(start);
    setReturnDate(end);
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    params.set("type", vehicleType.value);
    if (pickupLocation?.label) {
      params.set("location", pickupLocation.label);
    }
    params.set("date", formatPickupDateParam(pickupDate));
    params.set("returnDate", formatPickupDateParam(returnDate));
    params.set("returnElsewhere", returnElsewhere ? "1" : "0");
    params.set("hotelDelivery", hotelDelivery ? "1" : "0");
    markScrollToVehicleResults();
    router.push(`/vehicles?${params.toString()}`, { scroll: false });
  }, [
    hotelDelivery,
    pickupDate,
    returnDate,
    pickupLocation,
    returnElsewhere,
    router,
    vehicleType.value,
  ]);

  const panelShellClass = [
    "overflow-hidden bg-[var(--surface-card)] p-5 text-ink-900 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-5)] sm:p-6 lg:p-8",
    SITE_SURFACE_RADIUS,
  ].join(" ");

  const fieldSkeletonClass =
    "min-h-[5.25rem] rounded-[var(--r-field)] bg-[var(--surface-soft)] shadow-[inset_0_0_0_1px_var(--line-subtle)] sm:min-h-[5.4rem]";

  if (!isMounted) {
    return (
      <div id="booking-preview" className={panelShellClass}>
        <div className="grid gap-3 lg:grid-cols-4">
          <div className={`${fieldSkeletonClass} lg:col-span-2`} />
          <div className={`${fieldSkeletonClass} lg:col-span-1`} />
          <div className={`${fieldSkeletonClass} lg:col-span-1`} />
        </div>
        <div className="mt-5 min-h-11 border-t border-[var(--line-subtle)] pt-5" />
      </div>
    );
  }

  return (
    <div id="booking-preview" className={panelShellClass}>
      <div className="grid gap-3 sm:gap-3.5 lg:grid-cols-4">
        <div className={`${fieldClassName} lg:col-span-2`}>
          <span className="text-xs font-semibold tracking-[0.02em] text-ink-500">
            {t("pickupLocation")}
          </span>
          <div className={vehicleFilterControlShellClass}>
            <MapPin
              className="h-4 w-4 shrink-0 text-blue-600"
              aria-hidden
            />
            <AsyncSelect
              inputId="pickup-location"
              instanceId="pickup-location"
              className="min-w-0 flex-1"
              value={pickupLocation}
              defaultOptions={maltaDefaultLocationOptions}
              loadOptions={loadMaltaLocationOptions}
              isSearchable
              onChange={(option) => setPickupLocation(option)}
              styles={vehicleFilterReactSelectStyles}
              components={heroSelectComponents}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              placeholder={t("locationPlaceholder")}
              noOptionsMessage={({ inputValue }) => {
                const q = inputValue.trim();
                if (!q) return null;
                return t("noLocationsMatch", { query: q });
              }}
              loadingMessage={() => t("searchingLocations")}
              cacheOptions
              aria-label={t("pickupAria")}
            />
          </div>
        </div>

        <div className={`${fieldClassName} lg:col-span-1`}>
          <span className="text-xs font-semibold tracking-[0.02em] text-ink-500">
            {t("vehicleType")}
          </span>
          <div className={vehicleFilterControlShellClass}>
            <Car
              className="h-4 w-4 shrink-0 text-blue-600"
              aria-hidden
            />
            <Select<BookingOption, false>
              inputId="vehicle-type"
              instanceId="vehicle-type"
              className="min-w-0 flex-1"
              value={vehicleType}
              onChange={(option) => option && setVehicleTypeValue(option.value)}
              options={[...vehicleTypeOptionsLocalized]}
              isSearchable={false}
              styles={vehicleFilterReactSelectStyles}
              components={heroSelectComponents}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              aria-label={t("vehicleAria")}
            />
          </div>
        </div>

        <div className={`${fieldClassName} lg:col-span-1`}>
          <TripDateSelector
            tripStart={pickupDate}
            tripEnd={returnDate}
            onRangeChange={handleTripDatesChange}
            className="flex min-h-0 flex-1 flex-col justify-between"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-[var(--line-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
          <Toggle
            label={t("returnElsewhere")}
            active={returnElsewhere}
            onToggle={() => setReturnElsewhere((previous) => !previous)}
          />
          <Toggle
            label={t("hotelDelivery")}
            active={hotelDelivery}
            onToggle={() => setHotelDelivery((previous) => !previous)}
          />
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="group relative inline-flex min-h-[2.75rem] shrink-0 items-center justify-center gap-2 self-end rounded-[var(--r-field)] bg-orange-400 px-5 text-sm font-semibold tracking-[-0.02em] text-ink-950 shadow-[var(--elev-orange)] transition-[box-shadow,transform,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:bg-orange-500 hover:shadow-[var(--elev-orange-lift)] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-500)] motion-reduce:transition-none sm:min-h-[3rem] sm:min-w-[10.5rem] sm:self-auto sm:px-7 sm:text-base"
        >
          {tVehicle("search")}
          <span
            aria-hidden="true"
            className="inline-flex transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 motion-reduce:transition-none"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
