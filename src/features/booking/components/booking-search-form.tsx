"use client";

import "react-day-picker/style.css";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type RefObject,
} from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker, type DateRange } from "react-day-picker";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parse,
  startOfDay,
} from "date-fns";
import { calculateCalendarRentalDays } from "@/lib/pricing/rental-duration";
import Select, {
  components as selectComponents,
  type DropdownIndicatorProps,
  type GroupBase,
  type MenuProps,
} from "react-select";
import {
  CalendarDays,
  ChevronDown,
  Gauge,
  Loader2,
  MapPin,
  Palette,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
} from "lucide-react";
import type { BookingOption } from "@/features/home/data/hero-booking-options";
import { VEHICLE_TYPES, type VehicleColor } from "@/features/vehicles/data/vehicles";
import { vehicleFilterReactSelectStyles } from "@/features/vehicles/components/vehicle-pickup-fields";
import { resolveBrandFilterLabel } from "@/lib/vehicles/brand-utils";
import { useVehicleBrands } from "@/features/vehicles/lib/use-vehicle-brands";
import {
  markScrollToVehicleResults,
  useVehiclesSearchNav,
} from "@/features/vehicles/lib/vehicles-search-nav-context";
import { GoogleMapEmbed } from "@/components/google-map-embed";
import {
  createBookingFormSchema,
  TRIP_MAX_SPAN_DAYS,
  TRIP_MIN_SPAN_DAYS,
  type BookingFormValues,
} from "@/features/booking/lib/booking-schema";
import {
  BOOKING_PICKUP_TIME_FALLBACK,
  BOOKING_TIME_SLOTS,
  nextBookingSlotWithinHours,
} from "@/features/booking/lib/time-slots";
import { BookingAddressField } from "@/features/booking/components/booking-address-field";
import { TimeSlotSelect } from "@/features/booking/components/time-slot-select";
import { buildVehiclesSearchUrl } from "@/features/booking/lib/build-vehicles-url";
import type { EngineCcFilter } from "@/features/vehicles/lib/booking-search-params";
import { getPricingTierForDays } from "@/lib/pricing/pricing-tiers";
import { pricingService } from "@/lib/pricing/service";
import { SITE_GOOGLE_MAPS_URL } from "@/lib/site-brand-copy";

/* ── Field system ───────────────────────────────────────────────────────────
   Every control in the panel (location, brand, date range, both times) shares
   this shell so they read as siblings: hairline border, `--r-field`, ink value
   text, blue focus ring. */
const inputShell = [
  "group flex w-full min-h-10 items-center gap-2 rounded-[var(--r-field)] border border-slate-200/90 sm:min-h-12",
  "bg-white px-3 py-1.5 text-left text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)] sm:px-3.5 sm:py-2",
  "shadow-[0_10px_28px_-20px_rgba(15,23,42,0.35)] transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
  "hover:border-slate-300 hover:shadow-[0_14px_34px_-22px_rgba(15,23,42,0.45)]",
  "focus-within:border-[color-mix(in_srgb,var(--orange-600)_35%,var(--line-strong))] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--orange-600)_14%,transparent)]",
  "focus-visible:border-[var(--line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--ink-950)_8%,transparent)]",
  "data-[state=open]:border-[color-mix(in_srgb,var(--orange-600)_35%,var(--line-strong))] data-[state=open]:ring-2 data-[state=open]:ring-[color-mix(in_srgb,var(--orange-600)_14%,transparent)]",
].join(" ");

const inputShellDisabledClass =
  "cursor-not-allowed bg-[var(--surface-sunken)] text-[var(--text-faint)] shadow-none hover:border-[var(--line)]";

const inputShellErrorClass =
  "border-red-400 ring-2 ring-red-500/15 hover:border-red-400";

const fieldLabelClass = "type-spec mb-1.5 block text-[var(--text-muted)] sm:mb-2";

const fieldErrorClass = "mt-1.5 text-xs font-medium text-red-600";

const fieldIconClass = "h-4 w-4 shrink-0 text-[var(--orange-500)]";

const changeAffordanceClass =
  "type-spec shrink-0 text-[var(--text-muted)] transition-colors duration-[var(--dur-fast)] group-hover:text-[var(--ink-800)]";

/* ── Quick-link chips (50cc / 125cc / services) ─────────────────────────────
   The hero variant sits on dark photography, so it uses a glass treatment;
   the default variant sits on the bone-white canvas. */
const quickFilterGroupClassByTone = {
  hero: "inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-md border border-[var(--line-inverse)] bg-white/10 p-1 shadow-[var(--elev-3)] backdrop-blur-md sm:gap-1.5 sm:p-1.5",
  default:
    "inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface-card)] p-1 shadow-[var(--elev-2)] sm:gap-1.5 sm:p-1.5",
} as const;

const quickFilterChipClassByTone = {
  hero: "text-white/90 hover:bg-white/15 hover:text-white focus-visible:ring-white/70 focus-visible:ring-offset-[var(--ink-950)]",
  default:
    "text-[var(--ink-800)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-950)] focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-[var(--surface-card)]",
} as const;

const quickFilterChipSelectedClassByTone = {
  hero: "bg-white text-[var(--ink-950)] shadow-[0_8px_20px_-12px_rgba(15,23,42,0.55)] hover:bg-white hover:text-[var(--ink-950)]",
  default: [
    "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--orange-50)_88%,var(--surface-card))_0%,var(--surface-card)_70%)]",
    "text-[var(--ink-950)]",
    "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--orange-600)_45%,var(--line)),0_6px_16px_-10px_rgba(180,83,9,0.45)]",
    "hover:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--orange-50)_88%,var(--surface-card))_0%,var(--surface-card)_70%)]",
    "hover:text-[var(--ink-950)]",
  ].join(" "),
} as const;

const quickFilterCcIconByCc = {
  "50": "/landing page/50cc.png",
  "125": "/landing page/125cc.png",
} as const;

/* Source art is black line work, so it needs inverting to read on the hero video. */
const quickFilterIconClassByTone = {
  hero: "brightness-0 invert",
  default: "",
} as const;

const quickFilterChipClass =
  "group inline-flex h-9 items-center justify-center gap-1.5 rounded-sm px-2.5 text-xs font-semibold tracking-[-0.01em] transition-[background-color,color] duration-[var(--dur-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-12 sm:gap-2.5 sm:px-5 sm:text-sm md:text-base";

/* ── Segmented control (vehicle type) ──────────────────────────────────────── */
const segmentGroupClass =
  "grid grid-cols-2 gap-1 rounded-lg border border-slate-200/70 bg-slate-100/70 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:flex sm:items-stretch sm:gap-1.5 sm:rounded-[var(--r-card)] sm:p-1.5";

const segmentClass = [
  "group relative flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-md px-2.5 py-1.5 sm:min-h-[3.25rem] sm:gap-2.5 sm:rounded-[calc(var(--r-card)-0.375rem)] sm:px-3 sm:py-2",
  "text-left transition-[background-color,box-shadow,color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
  "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-sunken)]",
].join(" ");

const segmentSelectedClass = [
  "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--orange-50)_90%,var(--surface-card))_0%,var(--surface-card)_72%)]",
  "text-[var(--ink-950)]",
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--orange-600)_24%,var(--line)),var(--elev-1)]",
].join(" ");

const segmentIdleClass =
  "text-[var(--text-secondary)] hover:bg-white/60 hover:text-[var(--ink-900)]";

/* ── Panel ─────────────────────────────────────────────────────────────────
   Landing philosophy: soft frosted shell + corner glow, nested solid-white cards. */
const formShellGlowClass =
  "pointer-events-none absolute -inset-2 z-0 rounded-xl opacity-70 blur-2xl bg-[radial-gradient(ellipse_75%_60%_at_0%_0%,rgba(255,169,57,0.42),transparent),radial-gradient(ellipse_75%_60%_at_100%_0%,rgba(255,169,57,0.42),transparent),radial-gradient(ellipse_75%_60%_at_0%_100%,rgba(255,169,57,0.42),transparent),radial-gradient(ellipse_75%_60%_at_100%_100%,rgba(255,169,57,0.42),transparent)] sm:-inset-4 sm:rounded-2xl sm:opacity-80";

const formShellClass = [
  "relative z-10 overflow-hidden rounded-xl border border-white/60 bg-white/90 p-3",
  "shadow-[0_40px_90px_-50px_rgba(15,23,42,0.6)] ring-1 ring-slate-900/5",
  "backdrop-blur-xl transition-shadow duration-300",
  "hover:shadow-[0_48px_100px_-48px_rgba(15,23,42,0.65)]",
  "sm:rounded-2xl sm:p-5 lg:p-6",
].join(" ");

const nestedPanelClass =
  "rounded-lg border border-slate-200/80 bg-white shadow-[0_10px_28px_-22px_rgba(15,23,42,0.35)] sm:rounded-[var(--r-card)]";

const summaryBandClass =
  "-mx-3 -mb-3 mt-3 border-t border-white/50 bg-gradient-to-r from-slate-50/90 to-[#f0f7fc]/90 px-3 py-3 backdrop-blur-sm sm:-mx-5 sm:-mb-5 sm:mt-5 sm:px-5 sm:py-4 lg:-mx-6 lg:-mb-6 lg:px-6";

const submitButtonClass = [
  "inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md sm:min-h-12 sm:min-w-[11.5rem] sm:w-auto sm:rounded-full",
  "bg-[var(--orange-400)] px-5 text-sm font-semibold tracking-[-0.01em] text-[var(--ink-950)] shadow-[var(--elev-orange)] sm:px-7",
  "transition-[transform,box-shadow,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
  "hover:bg-[var(--orange-500)] hover:shadow-[var(--elev-orange-lift)] motion-safe:hover:-translate-y-0.5",
  "active:translate-y-0 active:bg-[var(--orange-600)] active:shadow-[var(--elev-orange)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-500)] focus-visible:ring-offset-2",
  "disabled:translate-y-0 disabled:cursor-wait disabled:bg-[var(--orange-300)] disabled:shadow-[var(--elev-orange)]",
  "motion-reduce:transition-none sm:min-h-13 sm:min-w-[13rem] sm:text-base",
].join(" ");

const selectionCardClass =
  "flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-left transition-[border-color,background-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)] sm:gap-3 sm:rounded-[var(--r-card)] sm:p-4";

const selectionCardSelectedClass =
  "border-[var(--orange-300)] bg-[var(--orange-50)] shadow-[var(--elev-1)]";

const selectionCardIdleClass =
  "border-slate-200/80 bg-white shadow-[0_10px_28px_-22px_rgba(15,23,42,0.28)] hover:border-slate-300 hover:bg-slate-50/80";

const selectionCheckboxClass =
  "h-[1.05rem] w-[1.05rem] shrink-0 self-center rounded-[0.3rem] border-[var(--line-strong)] accent-[var(--orange-500)] text-[var(--orange-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2";

const vehicleTypeIconByType: Record<
  (typeof VEHICLE_TYPES)[number],
  Readonly<{ src: string; className?: string }>
> = {
  Scooter: {
    src: "/vehicle-types/scooter.png",
  },
  Motorcycle: {
    src: "/vehicle-types/motorcycle.png",
  },
  Bicycle: {
    src: "/vehicle-types/bicycle.png",
  },
  ATV: {
    src: "/vehicle-types/atv.png",
  },
};

function defaultDates() {
  const from = startOfDay(new Date());
  return {
    pickupDate: format(from, "yyyy-MM-dd"),
    dropoffDate: format(addDays(from, 1), "yyyy-MM-dd"),
  };
}

function optionByValue(
  options: readonly BookingOption[],
  value: string,
): BookingOption {
  return options.find((option) => option.value === value) ?? options[0]!;
}

type BookingSearchSelectExtraProps = {
  /** Field shell (icon + control + CHANGE) — menu must match this box, not the inner Select. */
  menuAnchorRef?: RefObject<HTMLDivElement | null>;
};

/**
 * react-select ports the menu to `document.body` and sizes it to the inner control
 * (after the leading icon), so it looks inset and too narrow. We re-render the menu
 * node ourselves and pin it to the full field shell’s viewport box.
 */
function BookingSearchMenu(
  props: MenuProps<BookingOption, false, GroupBase<BookingOption>>,
) {
  const {
    children,
    className,
    cx,
    getStyles,
    getClassNames,
    innerProps,
    innerRef,
    placement,
  } = props;

  const anchorEl = (props.selectProps as BookingSearchSelectExtraProps)
    .menuAnchorRef?.current;
  const baseStyle = getStyles("menu", props) as CSSProperties;
  const gap = 6;
  const openUp = placement === "top";

  const alignedStyle: CSSProperties = (() => {
    if (!anchorEl) return baseStyle;
    const anchor = anchorEl.getBoundingClientRect();
    return {
      ...baseStyle,
      position: "fixed",
      left: anchor.left,
      width: anchor.width,
      minWidth: anchor.width,
      maxWidth: anchor.width,
      boxSizing: "border-box",
      marginTop: 0,
      marginBottom: 0,
      right: "auto",
      top: openUp ? anchor.top - gap : anchor.bottom + gap,
      transform: openUp ? "translateY(-100%)" : undefined,
    };
  })();

  return (
    <div
      ref={innerRef}
      {...innerProps}
      style={alignedStyle}
      className={cx(
        { menu: true },
        getClassNames?.("menu", props),
        className,
      )}
    >
      {children}
    </div>
  );
}

function makeBrandDropdownIndicator(changeLabel: string) {
  return function BrandDropdownIndicator(
    props: DropdownIndicatorProps<BookingOption, false>,
  ) {
    return (
      <selectComponents.DropdownIndicator {...props}>
        <span className="type-spec shrink-0 uppercase tracking-[0.06em] text-[var(--text-faint)] transition-colors duration-[var(--dur-fast)] group-hover:text-[var(--text-muted)]">
          {changeLabel}
        </span>
      </selectComponents.DropdownIndicator>
    );
  };
}

type BookingSearchFormProps = Readonly<{
  initialValues?: Partial<{
    vehicleType: string;
    brand: string;
    transmission: string;
    seats: string;
    color: string;
    pickupDate: string;
    dropoffDate: string;
    pickupTime: string;
    dropoffTime: string;
  }>;
  /** Preloaded active listing brands (skips client fetch when set). */
  brandOptions?: readonly string[];
  /** Show transmission, seats, and color on the vehicles listing search card. */
  vehicleListingFilters?: boolean;
  listingColorOptions?: readonly VehicleColor[];
  quickFilterTone?: "default" | "hero";
  /** Highlights the matching 50cc / 125cc quick-filter chip from the URL. */
  activeEngineCc?: EngineCcFilter;
}>;

type VehicleTypeCard = Readonly<{
  value: string;
  label: string;
  imageSrc: string;
  imageClassName?: string;
}>;

export function BookingSearchForm({
  initialValues,
  brandOptions,
  vehicleListingFilters = false,
  listingColorOptions = [],
  quickFilterTone = "default",
  activeEngineCc = "All",
}: BookingSearchFormProps = {}) {
  const router = useRouter();
  const searchNav = useVehiclesSearchNav();
  const [localNavPending, startLocalNavTransition] = useTransition();
  const tSearch = useTranslations("BookingSearch");
  const tForm = useTranslations("BookingForm");
  const tCommon = useTranslations("Common");
  const tFilters = useTranslations("VehicleFilters");
  const { brands: fetchedBrands, isLoading: isBrandsLoading } = useVehicleBrands({
    initialBrands: brandOptions,
  });
  const brandChoices = brandOptions ?? fetchedBrands;
  const [isMounted, setIsMounted] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [calendarMonths, setCalendarMonths] = useState(1);
  /** Mobile starts collapsed so customers reach dates/search and results sooner. */
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const minFrom = useMemo(() => startOfDay(new Date()), []);

  const { pickupDate: defPu, dropoffDate: defDo } = defaultDates();
  const defaultPickupTime = BOOKING_PICKUP_TIME_FALLBACK;
  const defaultDropoffTime = "19:00";

  const bookingFormSchema = useMemo(
    () =>
      createBookingFormSchema({
        invalidPickupDate: tForm("invalidPickupDate"),
        invalidDropoffDate: tForm("invalidDropoffDate"),
        selectPickupTime: tForm("selectPickupTime"),
        pickupTimeWindow: tForm("pickupTimeWindow"),
        selectDropoffTime: tForm("selectDropoffTime"),
        dropoffTimeWindow: tForm("dropoffTimeWindow"),
        alternateAddressDetail: tForm("alternateAddressDetail"),
        dropoffAddressDetail: tForm("dropoffAddressDetail"),
        tripMinDays: tForm("tripMinDays", { min: TRIP_MIN_SPAN_DAYS }),
        tripMaxDays: tForm("tripMaxDays", { max: TRIP_MAX_SPAN_DAYS }),
        dropoffAfterPickup: tForm("dropoffAfterPickup"),
      }),
    [tForm],
  );

  const formResolver = useMemo(
    () => zodResolver(bookingFormSchema),
    [bookingFormSchema],
  );

  const form = useForm<BookingFormValues>({
    resolver: formResolver,
    defaultValues: {
      vehicleType: initialValues?.vehicleType ?? "all",
      brand:
        initialValues?.brand && initialValues.brand !== "all"
          ? resolveBrandFilterLabel(initialValues.brand, brandChoices)
          : "all",
      transmission: initialValues?.transmission ?? "all",
      seats: initialValues?.seats ?? "all",
      color: initialValues?.color ?? "all",
      alternatePickupRequested: false,
      alternatePickupAddress: "",
      differentDropoff: false,
      dropoffAddress: "",
      pickupDate: initialValues?.pickupDate ?? defPu,
      dropoffDate: initialValues?.dropoffDate ?? defDo,
      pickupTime: initialValues?.pickupTime ?? defaultPickupTime,
      dropoffTime: initialValues?.dropoffTime ?? defaultDropoffTime,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!initialValues?.pickupTime) {
      setValue("pickupTime", nextBookingSlotWithinHours(90), { shouldValidate: true });
    }
  }, [initialValues?.pickupTime, setValue]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setCalendarMonths(mq.matches ? 2 : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!initialValues?.brand || initialValues.brand === "all") {
      return;
    }
    setValue("brand", resolveBrandFilterLabel(initialValues.brand, brandChoices));
  }, [brandChoices, initialValues?.brand, setValue]);

  /* eslint-disable react-hooks/incompatible-library -- react-hook-form watch() */
  const pickupDate = watch("pickupDate");
  const dropoffDate = watch("dropoffDate");
  const alternatePickupRequested = watch("alternatePickupRequested");
  const alternatePickupAddress = watch("alternatePickupAddress");
  const differentDropoff = watch("differentDropoff");
  const dropoffAddress = watch("dropoffAddress");
  const vehicleTypeValue = watch("vehicleType");
  const brandValue = watch("brand");
  const transmissionValue = watch("transmission");
  const seatsValue = watch("seats");
  const colorValue = watch("color");
  /* eslint-enable react-hooks/incompatible-library */

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (vehicleTypeValue && vehicleTypeValue !== "all") count += 1;
    if (brandValue && brandValue !== "all") count += 1;
    if (vehicleListingFilters) {
      if (transmissionValue && transmissionValue !== "all") count += 1;
      if (seatsValue && seatsValue !== "all") count += 1;
      if (colorValue && colorValue !== "all") count += 1;
    }
    return count;
  }, [
    brandValue,
    colorValue,
    seatsValue,
    transmissionValue,
    vehicleListingFilters,
    vehicleTypeValue,
  ]);

  const range: DateRange = {
    from: parse(pickupDate, "yyyy-MM-dd", new Date()),
    to: parse(dropoffDate, "yyyy-MM-dd", new Date()),
  };

  const durationDays = calculateCalendarRentalDays(pickupDate, dropoffDate) ?? 0;

  const matchedTier = durationDays > 0 ? getPricingTierForDays(durationDays) : null;

  const offSiteQuote = pricingService.quoteOffSiteService({
    pickupOffSite: alternatePickupRequested,
    dropoffOffSite: differentDropoff,
  });
  const singleLegOffSiteQuote = pricingService.quoteOffSiteService({
    pickupOffSite: true,
    dropoffOffSite: false,
  });

  const isNavPending = searchNav?.isSearchPending ?? localNavPending;
  const [holdSearching, setHoldSearching] = useState(false);

  useEffect(() => {
    if (!isNavPending) {
      setHoldSearching(false);
    }
  }, [isNavPending]);

  const isSearchPending = isNavPending || holdSearching;

  const onSubmit = (values: BookingFormValues) => {
    setHoldSearching(true);
    const href = buildVehiclesSearchUrl(values);
    if (searchNav) {
      searchNav.runSearchNavigation(href);
      return;
    }
    markScrollToVehicleResults();
    startLocalNavTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  const dateSummary =
    pickupDate && dropoffDate
      ? `${format(parse(pickupDate, "yyyy-MM-dd", new Date()), "d MMM")} → ${format(parse(dropoffDate, "yyyy-MM-dd", new Date()), "d MMM yyyy")}`
      : tSearch("dateSummaryPick");

  const offSiteDiscountPart = offSiteQuote.hasBundleDiscount
    ? tSearch("bundleDiscount", { amount: offSiteQuote.discountEur })
    : "";

  const summaryDayLabel = durationDays === 1 ? tCommon("day") : tCommon("days");

  const vehicleTypeCards = useMemo(
    (): VehicleTypeCard[] => [
      ...VEHICLE_TYPES.map((type) => ({
        value: type.toLowerCase(),
        label: type,
        imageSrc: vehicleTypeIconByType[type].src,
        imageClassName: vehicleTypeIconByType[type].className,
      })),
    ],
    [],
  );

  const brandSelectOptions = useMemo((): BookingOption[] => {
    return [
      { value: "all", label: tFilters("allBrands") },
      ...brandChoices.map((brand) => ({ value: brand, label: brand })),
    ];
  }, [brandChoices, tFilters]);

  const transmissionSelectOptions = useMemo(
    (): BookingOption[] => [
      { value: "all", label: tFilters("all") },
      { value: "automatic", label: tFilters("automatic") },
      { value: "manual", label: tFilters("manual") },
    ],
    [tFilters],
  );

  const seatsSelectOptions = useMemo(
    (): BookingOption[] => [
      { value: "all", label: tFilters("any") },
      { value: "1", label: tFilters("seat1") },
      { value: "2", label: tFilters("seat2") },
      { value: "3", label: tFilters("seat3") },
    ],
    [tFilters],
  );

  const colorSelectOptions = useMemo((): BookingOption[] => {
    const unique = [...new Set(listingColorOptions)].sort((a, b) => a.localeCompare(b));
    return [
      { value: "all", label: tFilters("anyColor") },
      ...unique.map((color) => ({
        value: color.toLowerCase(),
        label: color,
      })),
    ];
  }, [listingColorOptions, tFilters]);

  const listingFilterSelectComponents = useMemo(
    () => ({
      DropdownIndicator: makeBrandDropdownIndicator(tCommon("change")),
      IndicatorSeparator: () => null,
      Menu: BookingSearchMenu,
    }),
    [tCommon],
  );

  const brandFieldRef = useRef<HTMLDivElement>(null);
  const transmissionFieldRef = useRef<HTMLDivElement>(null);
  const seatsFieldRef = useRef<HTMLDivElement>(null);
  const colorFieldRef = useRef<HTMLDivElement>(null);

  const bookingSelectMenuProps = useMemo(
    () => ({
      styles: {
        ...vehicleFilterReactSelectStyles,
        // Portal wrapper is only a mount point; real geometry comes from BookingSearchMenu.
        menuPortal: (base) => ({
          ...base,
          left: 0,
          top: 0,
          height: 0,
          width: 0,
          overflow: "visible",
        }),
      },
      closeMenuOnScroll: true,
      menuPlacement: "auto" as const,
      menuShouldScrollIntoView: true,
      menuPortalTarget: typeof document !== "undefined" ? document.body : null,
      menuPosition: "fixed" as const,
    }),
    [],
  );

  /* Presentation-only mirrors of the select's own `isDisabled` expression and
     the resolver's date errors, so the shell can show matching states. */
  const isBrandSelectDisabled = isBrandsLoading && brandChoices.length === 0;
  const hasDateError = Boolean(errors.pickupDate || errors.dropoffDate);

  const brandSelectComponents = useMemo(
    () => ({
      DropdownIndicator: makeBrandDropdownIndicator(tCommon("change")),
      IndicatorSeparator: () => null,
      Menu: BookingSearchMenu,
    }),
    [tCommon],
  );

  return (
    <form
      id="vehicle-trip-search"
      onSubmit={handleSubmit(onSubmit)}
      className="flex scroll-mt-28 flex-col gap-3.5 sm:gap-6"
    >
      <div
        className={`${quickFilterGroupClassByTone[quickFilterTone]} mx-auto`}
        role="group"
        aria-label={tSearch("quickFilterTitle")}
      >
        {(
          [
            { cc: "50" as const, href: "/vehicles?cc=50&type=scooter", labelKey: "chip50" as const },
            { cc: "125" as const, href: "/vehicles?cc=125&type=scooter", labelKey: "chip125" as const },
          ] as const
        ).map(({ cc, href, labelKey }) => {
          const isActive = activeEngineCc === cc;
          return (
            <Link
              key={cc}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={[
                quickFilterChipClass,
                isActive
                  ? quickFilterChipSelectedClassByTone[quickFilterTone]
                  : quickFilterChipClassByTone[quickFilterTone],
              ].join(" ")}
            >
              <Image
                src={quickFilterCcIconByCc[cc]}
                alt=""
                width={cc === "50" ? 56 : 36}
                height={cc === "50" ? 48 : 36}
                unoptimized
                className={[
                  "shrink-0 object-contain",
                  cc === "50" ? "h-6 w-7 sm:h-11 sm:w-13" : "h-6 w-6 sm:h-8 sm:w-8",
                  isActive && quickFilterTone === "hero"
                    ? ""
                    : quickFilterIconClassByTone[quickFilterTone],
                ].join(" ")}
                aria-hidden
              />
              <span className="tabular-nums">{tSearch(labelKey)}</span>
            </Link>
          );
        })}
        <Link
          href="/#services"
          className={`${quickFilterChipClass} ${quickFilterChipClassByTone[quickFilterTone]}`}
        >
          <span>{tSearch("chipServices")}</span>
        </Link>
      </div>

      <div className="relative isolate">
        <div className={formShellGlowClass} aria-hidden />
        <div className={formShellClass}>
        <div className="relative z-[1] flex flex-col gap-3 sm:gap-5">
          <div className={`flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3.5 ${nestedPanelClass}`}>
            <div className="min-w-0 flex-1">
              <p className="type-spec text-[var(--text-muted)]">{tSearch("pickupLocationTitle")}</p>
              <p className="mt-1 flex items-start gap-2 text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)] sm:mt-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--orange-500)]" aria-hidden />
                {tSearch("shopPickupLine")}
              </p>
              <p className="mt-1 text-xs leading-snug tabular-nums text-[var(--text-secondary)] sm:mt-2 sm:leading-relaxed">
                {tSearch("pickupHoursNote", { openTime: "09:30", closeTime: "19:00" })}
              </p>
            </div>
            <a
              href={SITE_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="type-spec shrink-0 self-start text-[var(--blue-600)] underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-[var(--blue-700)] hover:underline sm:self-auto"
              aria-label={tCommon("mapOpenAria")}
            >
              {tCommon("mapViewOnMaps")}
            </a>
          </div>

          <div className="grid gap-2.5 sm:gap-4 lg:grid-cols-2">
            <label
              className={`${selectionCardClass} ${
                alternatePickupRequested
                  ? selectionCardSelectedClass
                  : selectionCardIdleClass
              }`}
            >
              <input
                type="checkbox"
                className={selectionCheckboxClass}
                {...register("alternatePickupRequested")}
              />
              <span>
                <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                  {tSearch("alternatePickupTitle")}
                </span>
                <span className="mt-1 block text-xs leading-relaxed tabular-nums text-[var(--text-secondary)]">
                  {tSearch("alternatePickupHelp", { fee: singleLegOffSiteQuote.perLegFeeEur })}
                </span>
              </span>
            </label>

            <Controller
              name="differentDropoff"
              control={control}
              render={({ field }) => (
                <label
                  className={`${selectionCardClass} ${
                    field.value ? selectionCardSelectedClass : selectionCardIdleClass
                  }`}
                >
                  <input
                    type="checkbox"
                    className={selectionCheckboxClass}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <span>
                    <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                      {tSearch("differentDropoffTitle")}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed tabular-nums text-[var(--text-secondary)]">
                      {tSearch("differentDropoffHelp", { fee: singleLegOffSiteQuote.perLegFeeEur })}
                    </span>
                  </span>
                </label>
              )}
            />
          </div>

          {alternatePickupRequested ? (
            <div>
              <label htmlFor="alternate-pickup-address" className={fieldLabelClass}>
                {tSearch("exactPickupLabel")}
              </label>
              <Controller
                name="alternatePickupAddress"
                control={control}
                render={({ field }) => (
                  <BookingAddressField
                    id="alternate-pickup-address"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={tSearch("addressPlaceholder")}
                    hasError={Boolean(errors.alternatePickupAddress)}
                  />
                )}
              />
              {errors.alternatePickupAddress ? (
                <p className={fieldErrorClass}>{errors.alternatePickupAddress.message}</p>
              ) : null}
              {alternatePickupAddress?.trim() ? (
                <div className="mt-3 overflow-hidden rounded-[var(--r-card)] border border-[var(--line)] shadow-[var(--elev-1)]">
                  <GoogleMapEmbed query={alternatePickupAddress} className="aspect-[16/9] min-h-[120px] w-full sm:min-h-[180px]" />
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--text-muted)]">{tSearch("mapPreviewHint")}</p>
              )}
            </div>
          ) : null}

          {differentDropoff ? (
            <div>
              <label htmlFor="dropoff-address" className={fieldLabelClass}>
                {tSearch("exactDropoffLabel")}
              </label>
              <Controller
                name="dropoffAddress"
                control={control}
                render={({ field }) => (
                  <BookingAddressField
                    id="dropoff-address"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={tSearch("addressPlaceholder")}
                    hasError={Boolean(errors.dropoffAddress)}
                  />
                )}
              />
              {errors.dropoffAddress ? (
                <p className={fieldErrorClass}>{errors.dropoffAddress.message}</p>
              ) : null}
              {dropoffAddress?.trim() ? (
                <div className="mt-3 overflow-hidden rounded-[var(--r-card)] border border-[var(--line)] shadow-[var(--elev-1)]">
                  <GoogleMapEmbed query={dropoffAddress} className="aspect-[16/9] min-h-[120px] w-full sm:min-h-[180px]" />
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--text-muted)]">{tSearch("mapPreviewHint")}</p>
              )}
            </div>
          ) : null}

          {offSiteQuote.selectedLegs > 0 ? (
            <p className="rounded-[var(--r-field)] border border-[var(--orange-200)] bg-[var(--orange-50)] px-3.5 py-2.5 text-xs leading-relaxed tabular-nums text-[var(--orange-950)]">
              {tSearch("offSiteTotalLine", {
                total: offSiteQuote.totalEur,
                legs: offSiteQuote.selectedLegs,
                perLeg: offSiteQuote.perLegFeeEur,
                discount: offSiteDiscountPart,
              })}
            </p>
          ) : null}

          <button
            type="button"
            className="inline-flex w-full items-center justify-between gap-2 rounded-md border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)] shadow-[0_10px_28px_-20px_rgba(15,23,42,0.35)] transition-[background-color,border-color] duration-[var(--dur-fast)] hover:border-slate-300 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2 md:hidden"
            aria-expanded={moreFiltersOpen}
            aria-controls="booking-search-more-filters"
            onClick={() => setMoreFiltersOpen((open) => !open)}
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--orange-500)]" aria-hidden />
              <span>
                {moreFiltersOpen ? tSearch("fewerFilters") : tSearch("moreFilters")}
                {!moreFiltersOpen && activeAdvancedFilterCount > 0
                  ? ` (${activeAdvancedFilterCount})`
                  : null}
              </span>
            </span>
            <ChevronDown
              className={[
                "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-[var(--dur-fast)]",
                moreFiltersOpen ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden
            />
          </button>

          <div
            id="booking-search-more-filters"
            className={[
              "flex-col gap-3 sm:gap-5",
              moreFiltersOpen ? "flex" : "hidden md:flex",
            ].join(" ")}
          >
            <fieldset className="min-w-0">
              <legend className={fieldLabelClass}>
                {tSearch("vehicleTypeLabel")}
              </legend>
              <Controller
                name="vehicleType"
                control={control}
                render={({ field }) => (
                  <div>
                    <input ref={field.ref} type="hidden" name={field.name} value={field.value ?? "all"} readOnly />
                    <div
                      className={segmentGroupClass}
                      role="radiogroup"
                      aria-label={tSearch("vehicleTypeLabel")}
                    >
                      {vehicleTypeCards.map((option) => {
                        const selected = (field.value ?? "all") === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onBlur={field.onBlur}
                            onClick={() => field.onChange(option.value)}
                            className={[
                              segmentClass,
                              selected ? segmentSelectedClass : segmentIdleClass,
                            ].join(" ")}
                          >
                            <span
                              className="relative flex h-7 w-9 shrink-0 items-center justify-center overflow-hidden sm:h-9 sm:w-12"
                              aria-hidden
                            >
                              <Image
                                src={option.imageSrc}
                                alt=""
                                width={96}
                                height={64}
                                sizes="96px"
                                className={[
                                  "h-6 w-9 object-contain transition-[transform,opacity] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] motion-safe:group-hover:scale-105 sm:h-8 sm:w-12",
                                  selected ? "opacity-100" : "opacity-80",
                                  option.imageClassName ?? "",
                                ].join(" ")}
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold tracking-[-0.01em] sm:text-sm">
                                {option.label}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={(field.value ?? "all") === "all"}
                        onBlur={field.onBlur}
                        onClick={() => field.onChange("all")}
                        className={[
                          segmentClass,
                          "max-sm:col-span-2 sm:flex-none sm:px-5",
                          (field.value ?? "all") === "all"
                            ? segmentSelectedClass
                            : segmentIdleClass,
                        ].join(" ")}
                      >
                        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="text-sm font-semibold capitalize tracking-[-0.01em]">
                          {tSearch("vehicleTypeAll")}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              />
            </fieldset>

            {brandChoices.length > 0 ? (
              <div className="min-w-0">
                <label htmlFor="booking-search-brand" className={fieldLabelClass}>
                  {tSearch("brandLabel")}
                </label>
                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <div
                      ref={brandFieldRef}
                      className={`${inputShell} ${
                        isBrandSelectDisabled ? inputShellDisabledClass : ""
                      }`}
                    >
                      <Tag className={fieldIconClass} aria-hidden />
                      {isMounted ? (
                        <Select<BookingOption, false>
                          inputId="booking-search-brand"
                          instanceId="booking-search-brand"
                          aria-label={tSearch("brandAria")}
                          value={optionByValue(brandSelectOptions, field.value ?? "all")}
                          onChange={(option) => field.onChange(option?.value ?? "all")}
                          onBlur={field.onBlur}
                          options={brandSelectOptions}
                          isSearchable={false}
                          isDisabled={isBrandSelectDisabled}
                          components={brandSelectComponents}
                          className="min-w-0 flex-1"
                          classNamePrefix="booking-search-brand"
                          menuAnchorRef={brandFieldRef}
                          {...bookingSelectMenuProps}
                        />
                      ) : (
                        <div
                          className="skeleton min-h-[2.5rem] min-w-0 flex-1 rounded-[var(--r-field)]"
                          aria-hidden
                        />
                      )}
                    </div>
                  )}
                />
              </div>
            ) : null}

            {vehicleListingFilters ? (
              <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                <div className="min-w-0">
                  <label htmlFor="booking-search-transmission" className={fieldLabelClass}>
                    {tFilters("transmission")}
                  </label>
                  <Controller
                    name="transmission"
                    control={control}
                    render={({ field }) => (
                      <div ref={transmissionFieldRef} className={inputShell}>
                        <Gauge className={fieldIconClass} aria-hidden />
                        {isMounted ? (
                          <Select<BookingOption, false>
                            inputId="booking-search-transmission"
                            instanceId="booking-search-transmission"
                            aria-label={tFilters("transmissionAria")}
                            value={optionByValue(transmissionSelectOptions, field.value ?? "all")}
                            onChange={(option) => field.onChange(option?.value ?? "all")}
                            onBlur={field.onBlur}
                            options={transmissionSelectOptions}
                            isSearchable={false}
                            components={listingFilterSelectComponents}
                            className="min-w-0 flex-1"
                            classNamePrefix="booking-search-transmission"
                            menuAnchorRef={transmissionFieldRef}
                            {...bookingSelectMenuProps}
                          />
                        ) : (
                          <div
                            className="skeleton min-h-[2.5rem] min-w-0 flex-1 rounded-[var(--r-field)]"
                            aria-hidden
                          />
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="min-w-0">
                  <label htmlFor="booking-search-seats" className={fieldLabelClass}>
                    {tFilters("seats")}
                  </label>
                  <Controller
                    name="seats"
                    control={control}
                    render={({ field }) => (
                      <div ref={seatsFieldRef} className={inputShell}>
                        <Users className={fieldIconClass} aria-hidden />
                        {isMounted ? (
                          <Select<BookingOption, false>
                            inputId="booking-search-seats"
                            instanceId="booking-search-seats"
                            aria-label={tFilters("seatsAria")}
                            value={optionByValue(seatsSelectOptions, field.value ?? "all")}
                            onChange={(option) => field.onChange(option?.value ?? "all")}
                            onBlur={field.onBlur}
                            options={seatsSelectOptions}
                            isSearchable={false}
                            components={listingFilterSelectComponents}
                            className="min-w-0 flex-1"
                            classNamePrefix="booking-search-seats"
                            menuAnchorRef={seatsFieldRef}
                            {...bookingSelectMenuProps}
                          />
                        ) : (
                          <div
                            className="skeleton min-h-[2.5rem] min-w-0 flex-1 rounded-[var(--r-field)]"
                            aria-hidden
                          />
                        )}
                      </div>
                    )}
                  />
                </div>

                {colorSelectOptions.length > 1 ? (
                  <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                    <label htmlFor="booking-search-color" className={fieldLabelClass}>
                      {tFilters("color")}
                    </label>
                    <Controller
                      name="color"
                      control={control}
                      render={({ field }) => (
                        <div ref={colorFieldRef} className={inputShell}>
                          <Palette className={fieldIconClass} aria-hidden />
                          {isMounted ? (
                            <Select<BookingOption, false>
                              inputId="booking-search-color"
                              instanceId="booking-search-color"
                              aria-label={tFilters("colorAria")}
                              value={optionByValue(colorSelectOptions, field.value ?? "all")}
                              onChange={(option) => field.onChange(option?.value ?? "all")}
                              onBlur={field.onBlur}
                              options={colorSelectOptions}
                              isSearchable={false}
                              components={listingFilterSelectComponents}
                              className="min-w-0 flex-1"
                              classNamePrefix="booking-search-color"
                              menuAnchorRef={colorFieldRef}
                              {...bookingSelectMenuProps}
                            />
                          ) : (
                            <div
                              className="skeleton min-h-[2.5rem] min-w-0 flex-1 rounded-[var(--r-field)]"
                              aria-hidden
                            />
                          )}
                        </div>
                      )}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2.5 sm:gap-4 lg:grid-cols-[1.15fr_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0">
              <label className={fieldLabelClass}>{tSearch("tripDatesLabel")}</label>
              <Popover.Root open={calOpen} onOpenChange={setCalOpen}>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className={`${inputShell} justify-between ${
                      hasDateError ? inputShellErrorClass : ""
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <CalendarDays className={fieldIconClass} aria-hidden />
                      <span className="truncate text-[0.9375rem] font-semibold tabular-nums">
                        {dateSummary}
                      </span>
                    </span>
                    <span className={changeAffordanceClass}>{tCommon("change")}</span>
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    side="bottom"
                    sideOffset={8}
                    align="center"
                    collisionPadding={{ top: 72, right: 16, bottom: 16, left: 16 }}
                    className="z-[100] max-h-[var(--radix-popover-content-available-height)] w-max max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-2.5 shadow-[var(--elev-3)] sm:rounded-[var(--r-panel)] sm:p-3 sm:shadow-[var(--elev-4)]"
                  >
                    <DayPicker
                      mode="range"
                      numberOfMonths={calendarMonths}
                      selected={range}
                      max={TRIP_MAX_SPAN_DAYS}
                      onSelect={(r) => {
                        if (!r?.from) return;
                        const from = startOfDay(r.from);
                        let to = r.to != null ? startOfDay(r.to) : addDays(from, TRIP_MIN_SPAN_DAYS);
                        const span = differenceInCalendarDays(to, from);
                        if (span < TRIP_MIN_SPAN_DAYS) {
                          to = addDays(from, TRIP_MIN_SPAN_DAYS);
                        } else if (span > TRIP_MAX_SPAN_DAYS) {
                          to = addDays(from, TRIP_MAX_SPAN_DAYS);
                        }
                        setValue("pickupDate", format(from, "yyyy-MM-dd"), {
                          shouldValidate: true,
                        });
                        setValue("dropoffDate", format(to, "yyyy-MM-dd"), {
                          shouldValidate: true,
                        });
                      }}
                      disabled={{ before: minFrom }}
                    />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
              <p className="mt-1.5 text-xs tabular-nums text-[var(--text-muted)]">
                {tSearch("tripLengthNote", { min: TRIP_MIN_SPAN_DAYS, max: TRIP_MAX_SPAN_DAYS })}
              </p>
              {errors.pickupDate ? (
                <p className={fieldErrorClass}>{errors.pickupDate.message}</p>
              ) : null}
              {errors.dropoffDate ? (
                <p className={fieldErrorClass}>{errors.dropoffDate.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  id="booking-pickup-time-label"
                  className={fieldLabelClass}
                >
                  {tSearch("pickupTime")}
                </label>
                <Controller
                  name="pickupTime"
                  control={control}
                  render={({ field }) => (
                    <TimeSlotSelect
                      ref={field.ref}
                      id="booking-pickup-time"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-labelledby="booking-pickup-time-label"
                      slots={BOOKING_TIME_SLOTS}
                    />
                  )}
                />
              </div>
              <div>
                <label
                  id="booking-dropoff-time-label"
                  className={fieldLabelClass}
                >
                  {tSearch("dropoffTime")}
                </label>
                <Controller
                  name="dropoffTime"
                  control={control}
                  render={({ field }) => (
                    <TimeSlotSelect
                      ref={field.ref}
                      id="booking-dropoff-time"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-labelledby="booking-dropoff-time-label"
                      slots={BOOKING_TIME_SLOTS}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={summaryBandClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-[-0.01em] tabular-nums text-[var(--ink-900)]">
                {tSearch("summaryLine", {
                  days: durationDays,
                  offPickup: alternatePickupRequested ? tSearch("offPickup") : "",
                  offDropoff: differentDropoff ? tSearch("offDropoff") : "",
                  offSite:
                    offSiteQuote.selectedLegs > 0
                      ? tSearch("offSiteExtra", { amount: offSiteQuote.totalEur })
                      : "",
                })}
              </p>
              <p className="mt-0.5 text-xs leading-snug tabular-nums text-[var(--text-secondary)] sm:mt-1 sm:leading-relaxed">
                {matchedTier
                  ? tSearch("durationDiscountSummary", {
                      days: durationDays,
                      dayLabel: summaryDayLabel,
                      percent: matchedTier.discountPercent,
                    })
                  : tSearch("durationDiscountSummaryMax", { percent: 40 })}
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isSearchPending}
              className={submitButtonClass}
              aria-busy={isSubmitting || isSearchPending}
            >
              {isSubmitting || isSearchPending ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  {tSearch("submitSearching")}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 shrink-0" aria-hidden />
                  {tSearch("submitIdle")}
                </>
              )}
            </button>
          </div>
        </div>
        </div>
      </div>
    </form>
  );
}
