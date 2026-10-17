"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Car, Gauge, Palette, Users } from "lucide-react";
import Select, {
  components as selectComponents,
  type DropdownIndicatorProps,
} from "react-select";
import type { BookingOption } from "@/features/home/data/hero-booking-options";
import type {
  Transmission,
  VehicleColor,
  VehicleSeatsFilter,
  VehicleType,
} from "@/features/vehicles/data/vehicles";
import {
  VehiclePickupLocationField,
  vehicleFilterControlShellClass,
  vehicleFilterReactSelectStyles,
} from "@/features/vehicles/components/vehicle-pickup-fields";
import { TripDateSelector } from "@/features/vehicles/components/trip-date-selector";
import { formatPickupDateParam } from "@/features/vehicles/lib/booking-search-params";
import { calculateCalendarRentalDays } from "@/lib/pricing/rental-duration";
import { getPricingTierForDays } from "@/lib/pricing/pricing-tiers";

type VehicleFiltersProps = Readonly<{
  pickupLocation: BookingOption | null;
  onPickupLocationChange: (value: BookingOption | null) => void;
  tripStart: Date;
  tripEnd: Date;
  onTripDatesChange: (start: Date, end: Date) => void;
  selectedType: VehicleType | "All";
  selectedTransmission: Transmission | "All";
  onTypeChange: (value: VehicleType | "All") => void;
  onTransmissionChange: (value: Transmission | "All") => void;
  selectedSeats: VehicleSeatsFilter;
  onSeatsChange: (value: VehicleSeatsFilter) => void;
  /** When true, seats are only in the sidebar (e.g. vehicles page rail). */
  hideSeatsFilter?: boolean;
  /** Below-lg vehicles listing: color filter in the card (with heading). */
  colorFilterOptions?: readonly (VehicleColor | "All")[];
  selectedColor?: VehicleColor | "All";
  onColorChange?: (value: VehicleColor | "All") => void;
  hotelDelivery: boolean;
  onHotelDeliveryChange: (value: boolean) => void;
  onClearFilters?: () => void;
  onSearch: () => void;
}>;

function optionByValue(
  options: readonly BookingOption[],
  value: string,
): BookingOption {
  return options.find((o) => o.value === value) ?? options[0]!;
}

function makeFilterDropdownIndicator(changeLabel: string) {
  return function FilterDropdownIndicator(
    props: DropdownIndicatorProps<BookingOption, false>,
  ) {
    return (
      <selectComponents.DropdownIndicator {...props}>
        <span className="type-spec shrink-0 text-[var(--text-muted)]">
          {changeLabel}
        </span>
      </selectComponents.DropdownIndicator>
    );
  };
}


const filterCellClass =
  "type-eyebrow flex min-w-0 w-full flex-col text-[var(--text-muted)]";

const filterShellClass = vehicleFilterControlShellClass;

function VehicleFilterToggle({
  label,
  checked,
  onCheckedChange,
  switchId,
}: Readonly<{
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  switchId: string;
}>) {
  return (
    <label
      htmlFor={switchId}
      className="inline-flex cursor-pointer items-center gap-3 select-none whitespace-nowrap"
    >
      <span className="text-sm font-semibold leading-none text-[var(--ink-800)]">
        {label}
      </span>
      <span
        className={[
          "relative box-border inline-block h-7 w-12 shrink-0 self-center rounded-full p-0.5 align-middle transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]",
          "focus-within:ring-2 focus-within:ring-[var(--blue-500)] focus-within:ring-offset-2 focus-within:ring-offset-white",
          checked
            ? "bg-[var(--orange-400)] shadow-[var(--elev-orange)]"
            : "bg-[var(--ink-300)]",
        ].join(" ")}
      >
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          checked={checked}
          aria-checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="absolute inset-0 z-10 m-0 cursor-pointer opacity-0"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 rounded-full bg-white shadow-sm"
          style={{
            transform: checked
              ? "translate(1.5rem, -50%)"
              : "translate(0, -50%)",
            transition: "transform var(--dur-base) var(--ease-out-expo)",
          }}
        />
      </span>
    </label>
  );
}

export function VehicleFilters({
  pickupLocation,
  onPickupLocationChange,
  tripStart,
  tripEnd,
  onTripDatesChange,
  selectedType,
  selectedTransmission,
  onTypeChange,
  onTransmissionChange,
  selectedSeats,
  onSeatsChange,
  hideSeatsFilter = false,
  colorFilterOptions,
  selectedColor,
  onColorChange,
  hotelDelivery,
  onHotelDeliveryChange,
  onClearFilters,
  onSearch,
}: VehicleFiltersProps) {
  const t = useTranslations("VehicleFilters");
  const tCommon = useTranslations("Common");
  const [selectMenuPortalTarget, setSelectMenuPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSelectMenuPortalTarget(document.body);
  }, []);

  const filterSelectComponents = useMemo(
    () => ({
      DropdownIndicator: makeFilterDropdownIndicator(tCommon("change")),
    }),
    [tCommon],
  );

  const typeFilterOptions = useMemo(
    (): readonly BookingOption[] => [
      { value: "All", label: t("allVehicles") },
      { value: "Scooter", label: t("scooters") },
      { value: "Motorcycle", label: t("motorcycles") },
      { value: "ATV", label: t("atvs") },
      { value: "Bicycle", label: t("bicycles") },
    ],
    [t],
  );

  const transmissionFilterOptions = useMemo(
    (): readonly BookingOption[] => [
      { value: "All", label: t("all") },
      { value: "Automatic", label: t("automatic") },
      { value: "Manual", label: t("manual") },
    ],
    [t],
  );

  const seatsFilterOptions = useMemo(
    (): readonly BookingOption[] => [
      { value: "All", label: t("any") },
      { value: "1", label: t("seat1") },
      { value: "2", label: t("seat2") },
      { value: "3", label: t("seat3") },
    ],
    [t],
  );

  const hasColorFilter =
    colorFilterOptions != null &&
    colorFilterOptions.length > 0 &&
    onColorChange != null &&
    selectedColor !== undefined;

  const colorSelectOptions = useMemo((): BookingOption[] => {
    if (!colorFilterOptions?.length) return [];
    return colorFilterOptions.map((c) =>
      c === "All"
        ? { value: "All", label: t("anyColor") }
        : { value: c, label: c },
    );
  }, [colorFilterOptions, t]);

  const mainGridClass = (() => {
    const n =
      4 +
      (hideSeatsFilter ? 0 : 1) +
      (hasColorFilter ? 1 : 0);
    if (n === 6) {
      return "grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3";
    }
    if (n === 5) {
      return "grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
    }
    return "grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4";
  })();

  const durationDays = useMemo(() => {
    const pickupDate = formatPickupDateParam(tripStart);
    const returnDate = formatPickupDateParam(tripEnd);
    return calculateCalendarRentalDays(pickupDate, returnDate) ?? 0;
  }, [tripStart, tripEnd]);

  const matchedTier = durationDays > 0 ? getPricingTierForDays(durationDays) : null;

  const dayWord = durationDays === 1 ? tCommon("day") : tCommon("days");
  const durationSummary = t("durationLine", { count: durationDays });
  const pickupSuffix = pickupLocation?.label
    ? ` · ${t("pickupPrefix")}: ${pickupLocation.label}`
    : "";

  return (
    <section
      id="vehicle-trip-search"
      aria-label={t("ariaVehicleSearch")}
      className="surface-panel sticky top-18 z-20 scroll-mt-28 p-4 md:p-5"
    >
      <div className={mainGridClass}>
        <div className="min-w-0">
          <VehiclePickupLocationField
            pickupLocation={pickupLocation}
            onPickupLocationChange={onPickupLocationChange}
          />
        </div>
        <div className="min-w-0">
          <TripDateSelector
            tripStart={tripStart}
            tripEnd={tripEnd}
            onRangeChange={onTripDatesChange}
          />
        </div>
          <label className={filterCellClass} htmlFor="vehicles-filter-type">
            {t("type")}
            <div className={filterShellClass}>
              <Car
                className="h-4 w-4 shrink-0 text-slate-600"
                aria-hidden
              />
              <Select<BookingOption, false>
                inputId="vehicles-filter-type"
                instanceId="vehicles-filter-type"
                aria-label={t("typeAria")}
                value={optionByValue(typeFilterOptions, selectedType)}
                onChange={(opt) =>
                  opt && onTypeChange(opt.value as VehicleType | "All")
                }
                options={[...typeFilterOptions]}
                isSearchable={false}
                styles={vehicleFilterReactSelectStyles}
                components={filterSelectComponents}
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                className="min-w-0 flex-1"
                classNamePrefix="vehicle-filter-type"
              />
            </div>
          </label>

          <label
            className={filterCellClass}
            htmlFor="vehicles-filter-transmission"
          >
            {t("transmission")}
            <div className={filterShellClass}>
              <Gauge
                className="h-4 w-4 shrink-0 text-slate-600"
                aria-hidden
              />
              <Select<BookingOption, false>
                inputId="vehicles-filter-transmission"
                instanceId="vehicles-filter-transmission"
                aria-label={t("transmissionAria")}
                value={optionByValue(
                  transmissionFilterOptions,
                  selectedTransmission,
                )}
                onChange={(opt) =>
                  opt &&
                  onTransmissionChange(opt.value as Transmission | "All")
                }
                options={[...transmissionFilterOptions]}
                isSearchable={false}
                styles={vehicleFilterReactSelectStyles}
                components={filterSelectComponents}
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                className="min-w-0 flex-1"
                classNamePrefix="vehicle-filter-transmission"
              />
            </div>
          </label>

          {!hideSeatsFilter ? (
            <label className={filterCellClass} htmlFor="vehicles-filter-seats">
              {t("seats")}
              <div className={filterShellClass}>
                <Users
                  className="h-4 w-4 shrink-0 text-slate-600"
                  aria-hidden
                />
                <Select<BookingOption, false>
                  inputId="vehicles-filter-seats"
                  instanceId="vehicles-filter-seats"
                  aria-label={t("seatsAria")}
                  value={optionByValue(
                    seatsFilterOptions,
                    selectedSeats === "All" ? "All" : String(selectedSeats),
                  )}
                  onChange={(opt) => {
                    if (!opt || typeof onSeatsChange !== "function") return;
                    const v = opt.value;
                    if (v === "All") onSeatsChange("All");
                    else onSeatsChange(Number(v) as 1 | 2 | 3);
                  }}
                  options={[...seatsFilterOptions]}
                  isSearchable={false}
                  styles={vehicleFilterReactSelectStyles}
                  components={filterSelectComponents}
                  menuPortalTarget={selectMenuPortalTarget}
                  menuPosition="fixed"
                  className="min-w-0 flex-1"
                  classNamePrefix="vehicle-filter-seats"
                />
              </div>
            </label>
          ) : null}

          {hasColorFilter ? (
            <label className={filterCellClass} htmlFor="vehicles-filter-color">
              {t("color")}
              <div className={filterShellClass}>
                <Palette
                  className="h-4 w-4 shrink-0 text-slate-600"
                  aria-hidden
                />
                <Select<BookingOption, false>
                  inputId="vehicles-filter-color"
                  instanceId="vehicles-filter-color"
                  aria-label={t("colorAria")}
                  value={optionByValue(
                    colorSelectOptions,
                    selectedColor === "All" ? "All" : selectedColor,
                  )}
                  onChange={(opt) => {
                    if (!opt || !onColorChange) return;
                    onColorChange(opt.value as VehicleColor | "All");
                  }}
                  options={colorSelectOptions}
                  isSearchable={false}
                  styles={vehicleFilterReactSelectStyles}
                  components={filterSelectComponents}
                  menuPortalTarget={selectMenuPortalTarget}
                  menuPosition="fixed"
                  className="min-w-0 flex-1"
                  classNamePrefix="vehicle-filter-color"
                />
              </div>
            </label>
          ) : null}
        </div>

        <div className="mt-4 border-t border-slate-200/80 pt-4">
          <div className="mb-3 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {durationSummary}
              {pickupSuffix}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
              {matchedTier
                ? t("durationDiscountLine", {
                    count: durationDays,
                    dayLabel: dayWord,
                    percent: matchedTier.discountPercent,
                  })
                : t("durationDiscountLineMax", { percent: 40 })}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label={t("ariaBookingOptions")} className="min-w-0">
              <VehicleFilterToggle
                label={t("hotelDelivery")}
                switchId="vehicles-filter-hotel-delivery"
                checked={hotelDelivery}
                onCheckedChange={onHotelDeliveryChange}
              />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              {onClearFilters ? (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="mr-1 text-sm font-semibold text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]/35 sm:mr-2"
                >
                  {t("clearFilters")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onSearch}
                className="group relative inline-flex min-h-[2.75rem] shrink-0 items-center justify-center gap-2 rounded-md bg-[var(--brand-orange)] px-5 text-sm font-semibold tracking-[-0.02em] text-white shadow-[0_10px_28px_-10px_rgba(255,147,15,0.65)] transition-[box-shadow,transform,background-color] duration-200 hover:bg-[var(--brand-orange-strong)] hover:shadow-[0_14px_36px_-12px_rgba(255,147,15,0.55)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:min-h-[3rem] sm:min-w-[10.5rem] sm:px-7 sm:text-base"
              >
                {t("search")}
                <span
                  aria-hidden="true"
                  className="inline-flex transition-transform duration-200 ease-out group-hover:translate-x-0.5"
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
        </div>
    </section>
  );
}
