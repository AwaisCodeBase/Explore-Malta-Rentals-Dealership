"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Lock,
  MapPin,
  Shield,
  ShieldCheck,
  Star,
  Zap,
  Fuel,
  Users,
  Cpu,
  Settings2,
  BadgeCheck,
  PhoneCall,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { VehicleDetailGallery } from "@/features/vehicles/components/vehicle-detail-gallery";
import { VehicleRelatedSlider } from "@/features/vehicles/components/vehicle-related-slider";
import { formatVehicleTypeLabel, type Vehicle } from "@/features/vehicles/data/vehicles";
import { useVehicle, useVehicles } from "@/features/vehicles/lib/use-vehicles";
import {
  buildDurationPricingPreview,
  calculateVehicleRentalPricing,
  roundPricingAmount,
} from "@/lib/pricing/duration-pricing";
import { getBillableRentalDays } from "@/lib/pricing/rental-duration";
import { BOOKING_TIME_SLOTS } from "@/features/booking/lib/time-slots";
import {
  useVehicleAvailabilityCheck,
  vehicleIsBookableForTrip,
  holdBlockedMessageForTrip,
} from "@/features/vehicles/lib/use-vehicle-availability-check";
import { BookNowButton } from "@/features/vehicles/components/book-now-button";
import { colorsMatch } from "@/features/vehicles/lib/vehicle-color";

/* ─────────────────────────── helpers ─────────────────────────── */

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTierRateEur(value: number): string {
  return roundPricingAmount(value).toFixed(2).replace(/\.00$/, "");
}

function isTripCommitted(pd: string, rd: string): boolean {
  return Boolean(pd && rd && rd > pd);
}

/** Every block heading on the detail page shares the display face and spacing. */
const sectionHeadingClass = "type-h3 text-[var(--ink-950)]";

/* ─────────────────────────── sub-components ──────────────────── */

function KeyInfoBar({ vehicle }: { vehicle: Vehicle }) {
  const specs = [
    {
      icon: <Cpu className="h-5 w-5" aria-hidden />,
      label: "Engine",
      value: vehicle.engine || "—",
    },
    {
      icon: <Settings2 className="h-5 w-5" aria-hidden />,
      label: "Transmission",
      value: vehicle.transmission,
    },
    {
      icon: <Fuel className="h-5 w-5" aria-hidden />,
      label: "Fuel",
      value: vehicle.fuel,
    },
    {
      icon: <Users className="h-5 w-5" aria-hidden />,
      label: "Seats",
      value: String(vehicle.seats),
    },
    {
      icon: <Shield className="h-5 w-5" aria-hidden />,
      label: "Helmets",
      value: vehicle.helmetIncludedCount > 0 ? `${vehicle.helmetIncludedCount} included` : "On request",
    },
  ];

  return (
    <div className="surface-card overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-[var(--line-subtle)]">
        {specs.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1.5 bg-[var(--surface-card)] px-3 py-4 text-center last:col-span-2"
          >
            <span className="text-[var(--blue-500)]">{s.icon}</span>
            <span className="type-spec text-[var(--text-faint)]">{s.label}</span>
            <span
              data-numeric
              className="text-sm font-semibold text-[var(--ink-950)]"
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const short = text.length > 320;

  return (
    <div>
      <p
        className={[
          "text-base leading-relaxed text-[var(--text-secondary)]",
          !expanded && short ? "line-clamp-4" : "",
        ].join(" ")}
      >
        {text}
      </p>
      {short ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--blue-600)] underline-offset-4 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-[var(--blue-700)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown
            className={[
              "h-4 w-4 transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
              expanded ? "rotate-180" : "",
            ].join(" ")}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}

function FeaturesList({ vehicle }: { vehicle: Vehicle }) {
  const items = [
    vehicle.helmetIncludedCount > 0 && `${vehicle.helmetIncludedCount} helmet(s) included`,
    vehicle.supportsStorageBox && "Storage box available",
    vehicle.transmission === "Automatic" && "Automatic transmission",
    vehicle.fuel !== "Human powered" && "Petrol engine",
    vehicle.fuel === "Human powered" && "Eco-friendly — no fuel cost",
    "Safety briefing at pickup",
    "Phone holder accessory",
    "Email & phone support during rental",
    vehicle.engine && `${vehicle.engine} engine`,
  ].filter(Boolean) as string[];

  return (
    <ul className="grid gap-x-6 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 border-b border-[var(--line-subtle)] py-2.5 text-sm leading-relaxed text-[var(--ink-800)]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

function LocationSection({ location }: { location: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--ink-800)]">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--orange-500)]" aria-hidden />
        <span>
          Pickup & return at{" "}
          <span className="font-semibold text-[var(--ink-950)]">{location}</span> — Explore Malta Rentals, Pietà
        </span>
      </div>
      <p className="text-xs leading-relaxed text-[var(--text-muted)]">
        Hotel delivery and custom drop-off available on request — ask us on WhatsApp.
      </p>
      <div className="aspect-[16/6] overflow-hidden rounded-[var(--r-card)] bg-[var(--surface-sunken)] shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-2)]">
        <iframe
          title={`Map showing ${location}`}
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12971.66892988892!2d14.487860399999999!3d35.896389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x130e4541df9b1f5b%3A0x88e68b52e93fdc6b!2sPiet%C3%A0%2C%20Malta!5e0!3m2!1sen!2smt!4v1700000000000"
          className="h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

/* Hairline-separated rows keep the four policies on one baseline grid. */
const policyCellClass = "border-b border-[var(--line-subtle)] py-4";
const policyBodyClass = "mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]";

function PoliciesSection({ vehicle }: { vehicle: Vehicle }) {
  const isBike = vehicle.type !== "Bicycle";
  return (
    <dl className="grid gap-x-8 sm:grid-cols-2">
      <div className={policyCellClass}>
        <dt className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-950)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          Cancellation
        </dt>
        <dd className={policyBodyClass}>
          No payment charged online during initial reservation. Availability confirmed after review.
          Contact support early for changes.
        </dd>
      </div>
      <div className={policyCellClass}>
        <dt className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-950)]">
          <BadgeCheck className="h-4 w-4 text-[var(--blue-500)]" aria-hidden />
          Licence requirement
        </dt>
        <dd className={policyBodyClass}>
          {isBike
            ? vehicle.engine === "50cc"
              ? "Category B (standard car licence) typically accepted for 50cc — confirm at booking."
              : "Motorcycle licence required (A, A1 or A2 depending on your country)."
            : "No licence required for bicycle rental — must follow local road rules."}
        </dd>
      </div>
      <div className={policyCellClass}>
        <dt className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-950)]">
          <Lock className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          Security deposit
        </dt>
        <dd className={policyBodyClass}>
          {vehicle.securityDepositEUR != null
            ? `EUR ${vehicle.securityDepositEUR} refundable deposit required at handover.`
            : "Deposit amount confirmed when booking is reviewed."}
        </dd>
      </div>
      <div className={policyCellClass}>
        <dt className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-950)]">
          <Shield className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          Documents at pickup
        </dt>
        <dd className={policyBodyClass}>
          Valid driving licence + government-issued ID or passport required at handover.
        </dd>
      </div>
    </dl>
  );
}

/* ─────────────────────────── Booking sidebar ─────────────────── */

function formatDateDisplay(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

type BookingSidebarProps = {
  vehicle: Vehicle;
  initialPickupDate?: string;
  initialReturnDate?: string;
  initialPickupTime?: string;
  initialReturnTime?: string;
};

function BookingSidebar({
  vehicle,
  initialPickupDate = "",
  initialReturnDate = "",
  initialPickupTime,
  initialReturnTime,
}: BookingSidebarProps) {
  const minDate = todayISO();
  const defaultTime = BOOKING_TIME_SLOTS[0] ?? "09:30";
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [pickupTime, setPickupTime] = useState(initialPickupTime || defaultTime);
  const [returnTime, setReturnTime] = useState(initialReturnTime || defaultTime);
  const [showDateWarning, setShowDateWarning] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showColorWarning, setShowColorWarning] = useState(false);

  /* When dates arrive from the URL they're already committed — skip the picker */
  const datesFromUrl = isTripCommitted(initialPickupDate, initialReturnDate);
  const [showDatePicker, setShowDatePicker] = useState(!datesFromUrl);

  const days = getBillableRentalDays(pickupDate, pickupTime, returnDate, returnTime);

  const tripCommitted = isTripCommitted(pickupDate, returnDate);

  const availability = useVehicleAvailabilityCheck(
    vehicle.id,
    vehicle.apiVehicleType,
    tripCommitted,
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
  );

  const allowHold = tripCommitted && vehicleIsBookableForTrip(availability);
  const holdBlocked = holdBlockedMessageForTrip(tripCommitted, availability);
  const unitColors = vehicle.availableColors ?? [];
  const availableColors =
    availability.kind === "ready" ? availability.availableColors : unitColors;

  useEffect(() => {
    if (!selectedColor || availability.kind !== "ready") {
      return;
    }
    // Once trip availability is known, drop a color that is not free for those dates.
    if (availability.availableColors.length === 0) {
      setSelectedColor(null);
      return;
    }
    const stillAvailable = availability.availableColors.some((option) =>
      colorsMatch(option.label, selectedColor),
    );
    if (!stillAvailable) {
      setSelectedColor(null);
    }
  }, [availability, selectedColor]);

  const bookingHref = useMemo(() => {
    const p = new URLSearchParams();
    if (pickupDate) p.set("pickupDate", pickupDate);
    if (returnDate) p.set("returnDate", returnDate);
    if (pickupTime) p.set("pickupTime", pickupTime);
    if (returnTime) p.set("returnTime", returnTime);
    const qs = p.toString();
    return qs ? `/booking?${qs}` : "/booking";
  }, [pickupDate, returnDate, pickupTime, returnTime]);

  const durationPreview = useMemo(
    () => buildDurationPricingPreview(vehicle.baseDailyRate),
    [vehicle.baseDailyRate],
  );

  const estimatedPricing =
    vehicle.baseDailyRate > 0 && days > 0
      ? calculateVehicleRentalPricing(vehicle.baseDailyRate, days)
      : null;
  const estimatedTotal = estimatedPricing?.rentalSubtotal ?? null;
  const estimatedTierDailyRate = estimatedPricing?.appliedDailyRate ?? null;

  const dateInputClass = (hasWarning: boolean) =>
    [
      "mt-1.5 block w-full rounded-[var(--r-field)] border bg-[var(--surface-card)] px-3 py-2.5 text-sm text-[var(--ink-900)] transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-standard)] focus:outline-none focus:ring-2",
      hasWarning
        ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/30"
        : "border-[var(--line)] hover:border-[var(--line-strong)] focus:border-[var(--blue-500)] focus:ring-[var(--blue-500)]/30",
    ].join(" ");
  const timeSelectClass =
    "mt-1.5 block w-full rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)] px-3 py-2.5 text-sm text-[var(--ink-900)] transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:border-[var(--line-strong)] focus:border-[var(--blue-500)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)]/30";
  const labelClass = "type-spec text-[var(--text-muted)]";

  return (
    <aside className="surface-panel p-5 sm:p-6 md:sticky md:top-[calc(var(--site-header-offset)+1rem)]">
      {/* price */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {vehicle.baseDailyRate > 0 ? (
            <p
              data-numeric
              className="type-h2 text-[var(--ink-950)]"
            >
              From €{vehicle.baseDailyRate}
              <span className="ml-1.5 text-base font-medium tracking-[-0.01em] text-[var(--text-muted)]">
                / day
              </span>
            </p>
          ) : (
            <p className="type-h3 text-[var(--text-secondary)]">Price on request</p>
          )}
          {durationPreview.length > 0 ? (
            <ul className="mt-4 divide-y divide-[var(--line-subtle)] border-y border-[var(--line-subtle)]">
              {durationPreview.map((row) => (
                <li
                  key={`${row.minDays}-${row.maxDays ?? "plus"}`}
                  data-numeric
                  className="py-1.5 text-xs leading-relaxed text-[var(--text-secondary)]"
                >
                  {row.label}: {row.discountPercent}% off → €{formatTierRateEur(row.appliedDailyRate)}/day
                </li>
              ))}
            </ul>
          ) : null}
          {vehicle.securityDepositEUR != null ? (
            <p data-numeric className="mt-2 text-xs text-[var(--text-muted)]">
              + EUR {vehicle.securityDepositEUR} deposit (refundable)
            </p>
          ) : null}
        </div>
        <span className="type-spec shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-emerald-800">
          Free cancellation
        </span>
      </div>

      <hr className="rule-fade my-5" />

      {/* trip fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-950)]">
            <CalendarRange className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
            {showDatePicker ? "Select your trip" : "Your trip"}
          </p>
          {!showDatePicker && (
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="text-xs font-semibold text-[var(--blue-600)] underline-offset-4 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-[var(--blue-700)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2"
            >
              Change dates
            </button>
          )}
        </div>

        {showDatePicker ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="sb-pickup-date" className={labelClass}>Pickup date</label>
                <input
                  id="sb-pickup-date"
                  type="date"
                  min={minDate}
                  value={pickupDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickupDate(v);
                    if (returnDate && v && returnDate <= v) setReturnDate("");
                    if (v) setShowDateWarning(false);
                  }}
                  className={dateInputClass(showDateWarning && !pickupDate)}
                />
              </div>
              <div>
                <label htmlFor="sb-return-date" className={labelClass}>Return date</label>
                <input
                  id="sb-return-date"
                  type="date"
                  min={pickupDate || minDate}
                  value={returnDate}
                  onChange={(e) => {
                    setReturnDate(e.target.value);
                    if (e.target.value) setShowDateWarning(false);
                  }}
                  className={dateInputClass(showDateWarning && !returnDate)}
                />
              </div>
            </div>
            {showDateWarning && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Please select your trip dates to continue.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="sb-pickup-time" className={labelClass}>Pickup time</label>
                <select
                  id="sb-pickup-time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className={timeSelectClass}
                >
                  {BOOKING_TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sb-return-time" className={labelClass}>Return time</label>
                <select
                  id="sb-return-time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className={timeSelectClass}
                >
                  {BOOKING_TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[var(--r-card)] bg-[var(--surface-sunken)] px-4 py-3.5 text-sm shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <div className="grid grid-cols-2 divide-x divide-[var(--line-subtle)]">
              <div className="pr-3">
                <p className="type-spec text-[var(--text-faint)]">Pickup</p>
                <p data-numeric className="mt-1 font-semibold text-[var(--ink-950)]">
                  {formatDateDisplay(pickupDate)}
                </p>
                <p data-numeric className="text-xs text-[var(--text-muted)]">{pickupTime}</p>
              </div>
              <div className="pl-3">
                <p className="type-spec text-[var(--text-faint)]">Return</p>
                <p data-numeric className="mt-1 font-semibold text-[var(--ink-950)]">
                  {formatDateDisplay(returnDate)}
                </p>
                <p data-numeric className="text-xs text-[var(--text-muted)]">{returnTime}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* availability status */}
      {tripCommitted ? (
        <div
          className={[
            "mt-3 rounded-[var(--r-field)] px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow-[inset_0_0_0_1px_var(--line-subtle)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)]",
            availability.kind === "loading"
              ? "bg-[var(--surface-sunken)] text-[var(--text-muted)]"
              : availability.kind === "ready" && availability.isAvailable
                ? "bg-emerald-50 text-emerald-800"
                : availability.kind === "ready" && !availability.isAvailable
                  ? "bg-rose-50 text-rose-800"
                  : availability.kind === "error"
                    ? "bg-[var(--orange-50)] text-[var(--orange-900)]"
                    : "bg-[var(--surface-sunken)] text-[var(--text-muted)]",
          ].join(" ")}
          aria-live="polite"
        >
          {availability.kind === "loading" && "Checking availability…"}
          {availability.kind === "error" && availability.message}
          {availability.kind === "ready" &&
            (availability.availabilityStatus === "available"
              ? "✓ Available for this trip"
              : availability.availabilityStatus === "reserved_temporarily"
                ? "⚠ Temporarily on hold — try different dates"
                : "✗ Not available — choose different dates")}
        </div>
      ) : null}

      {availableColors.length > 0 ? (
        <div className="mt-5 space-y-2.5">
          <p className="type-spec text-[var(--text-muted)]">Color</p>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((option) => {
              const isSelected = colorsMatch(selectedColor, option.label);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedColor(option.label);
                    setShowColorWarning(false);
                  }}
                  className={[
                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2",
                    isSelected
                      ? "border-[var(--blue-500)] bg-[var(--blue-500)] text-white shadow-[var(--elev-2)]"
                      : "border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-800)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)]",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {showColorWarning ? (
            <p className="text-xs font-medium text-rose-600" role="alert">
              Please select a color to continue
            </p>
          ) : null}
        </div>
      ) : null}

      {/* price breakdown */}
      {estimatedTotal !== null && estimatedTierDailyRate !== null ? (
        <div className="mt-5 rounded-[var(--r-card)] bg-[var(--surface-sunken)] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
          <div
            data-numeric
            className="flex items-baseline justify-between gap-3 text-sm text-[var(--text-secondary)]"
          >
            <span>€{formatTierRateEur(estimatedTierDailyRate)} × {days} day{days !== 1 ? "s" : ""}</span>
            <span className="text-base font-bold tracking-[-0.02em] text-[var(--ink-950)]">€{formatTierRateEur(estimatedTotal)}</span>
          </div>
          <p className="mt-2 border-t border-[var(--line-subtle)] pt-2 text-[0.6875rem] leading-relaxed text-[var(--text-faint)]">
            Flat tier rate applied to the full trip duration. Final price confirmed before you pay — no card taken online.
          </p>
        </div>
      ) : null}

      {/* CTA */}
      <div className="mt-5">
        <BookNowButton
          vehicle={vehicle}
          bookingHref={bookingHref}
          tripDatesCommitted={tripCommitted}
          onTripDatesRequired={() => setShowDateWarning(true)}
          allowHold={allowHold}
          holdBlockedMessage={holdBlocked}
          disabled={tripCommitted && availability.kind === "loading"}
          availableColors={availableColors}
          selectedColor={selectedColor}
          onColorRequired={() => setShowColorWarning(true)}
          pickupDate={tripCommitted ? pickupDate : null}
          returnDate={tripCommitted ? returnDate : null}
          pickupTime={tripCommitted ? pickupTime : null}
          returnTime={tripCommitted ? returnTime : null}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--orange-400)] px-5 py-3 text-sm font-bold text-[var(--ink-950)] shadow-[var(--elev-orange)] transition-[background-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:bg-[var(--orange-500)] hover:shadow-[var(--elev-orange-lift)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
          busyClassName="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-[var(--orange-300)] px-5 py-3 text-sm font-bold text-[var(--ink-950)] opacity-90 transition-colors duration-[var(--dur-fast)] disabled:cursor-wait"
        />
      </div>

      {/* secondary CTA */}
      <a
        href="https://wa.me/35699999999"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-card)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-800)] shadow-[var(--elev-1)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink-950)] hover:shadow-[var(--elev-2)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2"
      >
        <PhoneCall className="h-4 w-4" aria-hidden />
        Contact us on WhatsApp
      </a>

      {/* trust row */}
      <ul className="mt-5 divide-y divide-[var(--line-subtle)] border-t border-[var(--line-subtle)]">
        {[
          { icon: <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />, text: "Secure booking — no card stored" },
          { icon: <Zap className="h-4 w-4 shrink-0 text-[var(--orange-500)]" />, text: "Instant hold on dates" },
          { icon: <Lock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />, text: "Your details used only for this rental" },
        ].map(({ icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-2.5 py-2.5 text-xs leading-relaxed text-[var(--text-secondary)]"
          >
            {icon}
            {text}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ─────────────────────────── skeleton ───────────────────────── */

function Skeleton() {
  return (
    <div className="pt-24" aria-hidden>
      <div className="skeleton h-72 sm:rounded-[var(--r-panel)]" />
      <Container className="pb-20 pt-8">
        <div className="skeleton h-8 max-w-sm rounded-[var(--r-field)]" />
        <div className="skeleton mt-3 h-5 max-w-xs rounded-[var(--r-field)]" />
        <div className="skeleton mt-6 h-24 rounded-[var(--r-card)]" />
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            {[
              { h: 80, id: "a" },
              { h: 120, id: "b" },
              { h: 80, id: "c" },
            ].map(({ h, id }) => (
              <div
                key={id}
                style={{ height: h }}
                className="skeleton rounded-[var(--r-card)]"
              />
            ))}
          </div>
          <div className="lg:col-span-5">
            <div className="skeleton h-72 rounded-[var(--r-panel)]" />
          </div>
        </div>
      </Container>
    </div>
  );
}

/* ─────────────────────────── main shell ─────────────────────── */

type VehicleDetailsShellProps = Readonly<{
  slug: string;
  initialPickupDate?: string;
  initialReturnDate?: string;
  initialPickupTime?: string;
  initialReturnTime?: string;
}>;

export function VehicleDetailsShell({
  slug,
  initialPickupDate = "",
  initialReturnDate = "",
  initialPickupTime = "",
  initialReturnTime = "",
}: VehicleDetailsShellProps) {
  const t = useTranslations("VehicleDetail");
  const { vehicle, isLoading, error } = useVehicle(slug);
  const { vehicles: allVehicles } = useVehicles({ enabled: Boolean(vehicle) });

  if (isLoading) return <Skeleton />;

  if (error) {
    return (
      <Container className="pb-16 pt-28 sm:pt-32">
        <div className="rounded-[var(--r-panel)] border border-rose-200 bg-rose-50/80 px-6 py-8 shadow-sm">
          <h1 className="type-h3 text-rose-950">{t("unableLoadTitle")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-rose-800">{error}</p>
          <Link
            href="/vehicles"
            className="mt-5 inline-flex text-sm font-semibold text-rose-900 underline underline-offset-4 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-rose-950"
          >
            {t("backToVehicles")}
          </Link>
        </div>
      </Container>
    );
  }

  if (!vehicle) {
    return (
      <Container className="pb-16 pt-28 sm:pt-32">
        <div className="surface-panel px-6 py-8">
          <h1 className="type-h3 text-[var(--ink-950)]">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {t("notFoundBody")}
          </p>
          <Link
            href="/vehicles"
            className="mt-5 inline-flex text-sm font-semibold text-[var(--ink-950)] underline underline-offset-4 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-[var(--blue-600)]"
          >
            {t("browseVehicles")}
          </Link>
        </div>
      </Container>
    );
  }

  const typeLabel = formatVehicleTypeLabel(vehicle.apiVehicleType);
  const brandModel = [vehicle.brand, vehicle.model].filter(Boolean).join(" ") || null;

  return (
    <>
      {/* ─── HERO IMAGE (full-width, above container) ────────── */}
      <div>
        <Container className="pb-24 pt-28 sm:pt-32 md:pb-16">
          {/* breadcrumb */}
          <nav aria-label={t("breadcrumb")} className="mb-5 text-xs text-[var(--text-muted)]">
            <Link
              href="/vehicles"
              className="underline-offset-4 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-[var(--ink-950)] hover:underline"
            >
              {t("vehiclesCrumb")}
            </Link>
            {" / "}
            <span className="font-medium text-[var(--ink-900)]">{vehicle.name}</span>
          </nav>

          {/* title block */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="type-eyebrow text-[var(--orange-600)]">{typeLabel}</p>
              <h1 className="type-h1 mt-2 text-[var(--ink-950)]">{vehicle.name}</h1>
              {brandModel ? (
                <p className="mt-2 text-base font-medium text-[var(--text-secondary)]">
                  {brandModel}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--orange-500)]" aria-hidden />
                  {vehicle.location}, Malta
                </div>
                {vehicle.rating > 0 ? (
                  <div
                    data-numeric
                    className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]"
                  >
                    <Star className="h-3.5 w-3.5 fill-[var(--orange-400)] text-[var(--orange-400)]" aria-hidden />
                    <span className="font-semibold text-[var(--ink-950)]">{vehicle.rating.toFixed(1)}</span>
                    <span>({vehicle.reviewCount} reviews)</span>
                  </div>
                ) : null}
                {/* badges */}
                <span className="type-spec inline-flex items-center gap-1.5 rounded-full bg-[var(--orange-50)] px-2.5 py-1.5 text-[var(--orange-800)] ring-1 ring-inset ring-[var(--orange-200)]">
                  <Zap className="h-3 w-3" aria-hidden />
                  Popular
                </span>
                <span className="type-spec inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-emerald-800 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  Verified vehicle
                </span>
              </div>
            </div>
          </div>

          {/* About + specs (left) | gallery (right) */}
          <div className="grid items-start gap-6 md:grid-cols-12 md:gap-8">
            <div className="order-2 space-y-6 md:order-none md:col-span-5">
              <section aria-labelledby="v-about-h">
                <h2 id="v-about-h" className={sectionHeadingClass}>
                  About this vehicle
                </h2>
                <div className="mt-3">
                  <ExpandableDescription text={vehicle.description} />
                </div>
              </section>

              <KeyInfoBar vehicle={vehicle} />
            </div>

            <div className="order-1 md:order-none md:col-span-7">
              <VehicleDetailGallery name={vehicle.name} images={vehicle.images} />
            </div>
          </div>

          {/* main 2-col grid */}
          <div className="mt-8 grid gap-8 md:grid-cols-12 md:gap-10">
            {/* ── LEFT column — content sections ──────────── */}
            <div className="order-2 space-y-10 md:order-none md:col-span-7">

              {/* What's included */}
              <Reveal y={16}>
                <section aria-labelledby="v-features-h">
                  <h2 id="v-features-h" className={sectionHeadingClass}>
                    What&apos;s included
                  </h2>
                  <div className="mt-4">
                    <FeaturesList vehicle={vehicle} />
                  </div>
                </section>
              </Reveal>

              <hr className="rule-fade" />

              {/* Specifications */}
              <Reveal y={16}>
                <section aria-labelledby="v-specs-h">
                  <h2 id="v-specs-h" className={sectionHeadingClass}>
                    Specifications
                  </h2>
                  <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                    {[
                      { label: "Vehicle type", value: typeLabel },
                      { label: "Brand / Model", value: brandModel ?? "Not specified" },
                      { label: "Engine", value: vehicle.engine || "—" },
                      { label: "Transmission", value: vehicle.transmission },
                      { label: "Fuel", value: vehicle.fuel },
                      { label: "Seats", value: String(vehicle.seats) },
                      {
                        label: "Color",
                        value:
                          vehicle.availableColors && vehicle.availableColors.length > 0
                            ? vehicle.availableColors.map((c) => c.label).join(", ")
                            : vehicle.color ?? "—",
                      },
                      { label: "Storage box", value: vehicle.supportsStorageBox ? "Supported (optional add-on)" : "Not supported" },
                      { label: "Helmets included", value: String(vehicle.helmetIncludedCount) },
                      { label: "Pickup location", value: vehicle.location },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-baseline justify-between gap-4 border-b border-[var(--line-subtle)] py-3"
                      >
                        <dt className="type-spec shrink-0 text-[var(--text-faint)]">
                          {label}
                        </dt>
                        <dd
                          data-numeric
                          className="text-right text-sm font-semibold text-[var(--ink-950)]"
                        >
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </Reveal>

              <hr className="rule-fade" />

              {/* Location */}
              <Reveal y={16}>
                <section aria-labelledby="v-location-h">
                  <h2 id="v-location-h" className={sectionHeadingClass}>
                    Location &amp; pickup
                  </h2>
                  <div className="mt-4">
                    <LocationSection location={vehicle.location} />
                  </div>
                </section>
              </Reveal>

              <hr className="rule-fade" />

              {/* Policies */}
              <Reveal y={16}>
                <section aria-labelledby="v-policies-h">
                  <h2 id="v-policies-h" className={sectionHeadingClass}>
                    Policies &amp; requirements
                  </h2>
                  <div className="mt-4">
                    <PoliciesSection vehicle={vehicle} />
                  </div>
                </section>
              </Reveal>
            </div>

            {/* ── RIGHT column: booking sidebar ───────────── */}
            <div className="order-1 md:order-none md:col-span-5">
              <BookingSidebar
                vehicle={vehicle}
                initialPickupDate={initialPickupDate}
                initialReturnDate={initialReturnDate}
                initialPickupTime={initialPickupTime}
                initialReturnTime={initialReturnTime}
              />
            </div>
          </div>

          {/* Related vehicles slider */}
          <VehicleRelatedSlider vehicles={allVehicles} currentSlug={vehicle.slug} />
        </Container>
      </div>


      {/* ─── MOBILE bottom sticky bar (hidden once 2-col sidebar is visible) ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface-card)]/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgb(16_34_47/0.35)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            {vehicle.baseDailyRate > 0 ? (
              <p
                data-numeric
                className="text-xl font-bold leading-none tracking-[-0.035em] text-[var(--ink-950)]"
              >
                From €{vehicle.baseDailyRate}
                <span className="ml-1 text-xs font-medium tracking-normal text-[var(--text-muted)]">
                  /day
                </span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Price on request</p>
            )}
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">Free cancellation</p>
          </div>
          <Link
            href={(() => {
              const p = new URLSearchParams();
              p.set("vehicle", vehicle.slug);
              if (initialPickupDate) p.set("pickupDate", initialPickupDate);
              if (initialReturnDate) p.set("returnDate", initialReturnDate);
              if (initialPickupTime) p.set("pickupTime", initialPickupTime);
              if (initialReturnTime) p.set("returnTime", initialReturnTime);
              return `/booking?${p.toString()}`;
            })()}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-[var(--orange-400)] px-6 text-sm font-bold text-[var(--ink-950)] shadow-[var(--elev-orange)] transition-[background-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:bg-[var(--orange-500)] hover:shadow-[var(--elev-orange-lift)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-500)] focus-visible:ring-offset-2"
          >
            Reserve now
          </Link>
        </div>
      </div>
    </>
  );
}
