"use client";

import { addDays, differenceInHours, format, parse } from "date-fns";
import { useTranslations } from "next-intl";
import { StepShell } from "@/features/booking-flow/components/step-shell";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import { getBillableRentalDays } from "@/lib/pricing/rental-duration";

const fieldBase =
  "mt-1.5 min-h-12 w-full rounded-[var(--r-field)] border bg-[var(--surface-card)] px-3.5 py-2.5 text-sm tabular-nums text-[var(--text-primary)] shadow-[var(--elev-1)] outline-none transition duration-[var(--dur-fast)] placeholder:text-[var(--text-faint)] disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:text-[var(--text-faint)] disabled:shadow-none";
const fieldIdle =
  "border-[var(--line)] hover:border-[var(--line-strong)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";
const fieldError =
  "border-red-400 ring-2 ring-red-500/20 focus:border-red-500 focus:ring-red-500/25";

function fieldClass(invalid: boolean) {
  return `${fieldBase} ${invalid ? fieldError : fieldIdle}`;
}

const captionClass = "type-spec block text-[var(--text-muted)]";
const errorClass = "mt-1.5 block text-xs font-medium text-red-600";
const sectionLabelClass = "type-spec sm:col-span-2 text-[var(--text-faint)]";

export function RentalDatesStep() {
  const t = useTranslations("BookingWizard.rentalDates");
  const { state, updateSection, getFieldError, isFieldInvalid } = useBookingFlow();
  const { pickupDate, pickupTime, returnDate, returnTime } = state.rental;
  const today = new Date();
  const pickupMinDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const parsedPickupDate = pickupDate ? parse(pickupDate, "yyyy-MM-dd", new Date()) : null;
  const pickupBaseDate =
    parsedPickupDate && !Number.isNaN(parsedPickupDate.getTime()) ? parsedPickupDate : today;
  const returnMinDate = format(addDays(pickupBaseDate, 1), "yyyy-MM-dd");
  const returnMaxDate = format(addDays(pickupBaseDate, 27), "yyyy-MM-dd");
  const pickup = pickupDate && pickupTime
    ? parse(`${pickupDate} ${pickupTime}`, "yyyy-MM-dd HH:mm", new Date())
    : null;
  const dropoff = returnDate && returnTime
    ? parse(`${returnDate} ${returnTime}`, "yyyy-MM-dd HH:mm", new Date())
    : null;
  const rentalHours =
    pickup && dropoff && !Number.isNaN(pickup.getTime()) && !Number.isNaN(dropoff.getTime())
      ? Math.max(0, differenceInHours(dropoff, pickup))
      : 0;
  const rentalDays =
    pickupDate && returnDate && pickupTime && returnTime
      ? getBillableRentalDays(pickupDate, pickupTime, returnDate, returnTime)
      : 0;
  const hasDateTimeRange = Boolean(pickup && dropoff);

  return (
    <StepShell title={t("shellTitle")} description={t("shellDescription")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <p className={sectionLabelClass}>{t("sectionDates")}</p>
        <label className="block">
          <span className={captionClass}>{t("pickupDate")}</span>
          <input
            type="date"
            value={pickupDate}
            min={pickupMinDate}
            name="rental.pickupDate"
            data-field="rental.pickupDate"
            onChange={(event) => updateSection("rental", { pickupDate: event.target.value })}
            className={fieldClass(isFieldInvalid("rental.pickupDate"))}
          />
          {getFieldError("rental.pickupDate") ? (
            <span className={errorClass}>{getFieldError("rental.pickupDate")}</span>
          ) : null}
        </label>

        <label className="block">
          <span className={captionClass}>{t("returnDate")}</span>
          <input
            type="date"
            value={returnDate}
            min={returnMinDate}
            max={returnMaxDate}
            name="rental.returnDate"
            data-field="rental.returnDate"
            onChange={(event) => updateSection("rental", { returnDate: event.target.value })}
            className={fieldClass(isFieldInvalid("rental.returnDate"))}
          />
          {getFieldError("rental.returnDate") ? (
            <span className={errorClass}>{getFieldError("rental.returnDate")}</span>
          ) : null}
        </label>

        <p className={sectionLabelClass}>{t("sectionTime")}</p>
        <label className="block">
          <span className={captionClass}>{t("pickupTime")}</span>
          <input
            type="time"
            value={pickupTime}
            name="rental.pickupTime"
            data-field="rental.pickupTime"
            onChange={(event) => updateSection("rental", { pickupTime: event.target.value })}
            className={fieldClass(isFieldInvalid("rental.pickupTime"))}
          />
          {getFieldError("rental.pickupTime") ? (
            <span className={errorClass}>{getFieldError("rental.pickupTime")}</span>
          ) : null}
        </label>

        <label className="block">
          <span className={captionClass}>{t("returnTime")}</span>
          <input
            type="time"
            value={returnTime}
            name="rental.returnTime"
            data-field="rental.returnTime"
            onChange={(event) => updateSection("rental", { returnTime: event.target.value })}
            className={fieldClass(isFieldInvalid("rental.returnTime"))}
          />
          {getFieldError("rental.returnTime") ? (
            <span className={errorClass}>{getFieldError("rental.returnTime")}</span>
          ) : null}
        </label>

        <p className={sectionLabelClass}>{t("sectionDuration")}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-sunken)] px-4 py-3.5 text-sm text-[var(--text-secondary)]">
        {t("autoDuration")}{" "}
        <span className="font-semibold tabular-nums text-[var(--text-primary)]">
          {rentalHours > 0
            ? t("durationLine", { days: rentalDays, hours: rentalHours })
            : hasDateTimeRange
              ? t("durationInvalid")
              : t("durationWaiting")}
        </span>
      </div>
      <div className="surface-card mt-4 px-4 py-3.5">
        <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {t("notesTitle")}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--text-secondary)] marker:text-[var(--orange-400)]">
          <li>{t("noteMin")}</li>
          <li>{t("noteDayCharge")}</li>
          <li>{t("noteMax")}</li>
          <li>{t("noteRenew")}</li>
        </ul>
      </div>
    </StepShell>
  );
}
