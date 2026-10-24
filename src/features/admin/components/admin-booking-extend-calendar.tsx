"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  addMaltaCalendarDays,
  isSelectableExtensionReturn,
  latestExtensionReturn,
  maltaCalendarDateKey,
  maltaDateTimeToUtc,
  maltaTimeKey,
  maxExtensionReturn,
} from "@/lib/admin/bookings/extension-calendar-days";
import type { BookingExtensionAvailability, BookingExtensionUnitBooking } from "@/lib/admin/bookings/extendBooking";
import { formatMaltaDateTime } from "@/lib/format-malta-datetime";
import { MAX_BILLABLE_RENTAL_DAYS } from "@/lib/pricing/rental-duration";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

const OTHER_DAY_SHADES = [
  "bg-amber-200 text-amber-950",
  "bg-orange-200 text-orange-950",
  "bg-rose-200 text-rose-950",
  "bg-violet-200 text-violet-950",
] as const;

const OTHER_DOTS = ["bg-amber-400", "bg-orange-400", "bg-rose-400", "bg-violet-400"] as const;

const BOOKING_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "VEHICLE_HANDED_OVER", "RETURNED", "COMPLETED", "CANCELLED"] as const;

function bookingCoversDate(booking: BookingExtensionUnitBooking, dateKey: string): boolean {
  const pickupKey = maltaCalendarDateKey(new Date(booking.pickupAt));
  const returnAt = new Date(booking.returnAt);
  const returnKey = maltaCalendarDateKey(returnAt);
  const lastKey = maltaTimeKey(returnAt) === "00:00" ? addMaltaCalendarDays(returnKey, -1) : returnKey;
  return dateKey >= pickupKey && dateKey <= lastKey;
}

type AdminBookingExtendCalendarProps = Readonly<{
  anchorDateKey: string;
  availability: BookingExtensionAvailability | null;
  isLoading: boolean;
  loadError: string | null;
  selectedDateKey: string | null;
  time: string;
  onTimeChange: (time: string) => void;
  onSelectDate: (dateKey: string) => void;
  timeLabel: string;
  timeHint: string;
  loadingLabel: string;
  unavailableLabel: string;
  availableLabel: string;
  selectedLabel: string;
}>;

function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function weekdayMonday(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDay = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  return (utcDay + 6) % 7;
}

function buildMonthCells(visibleMonth: string): string[] {
  const first = `${visibleMonth}-01`;
  const leading = weekdayMonday(first);
  const cells: string[] = [];
  for (let index = leading; index > 0; index -= 1) {
    cells.push(addMaltaCalendarDays(first, -index));
  }
  let cursor = first;
  while (monthKey(cursor) === visibleMonth) {
    cells.push(cursor);
    cursor = addMaltaCalendarDays(cursor, 1);
  }
  while (cells.length % 7 !== 0) {
    cells.push(cursor);
    cursor = addMaltaCalendarDays(cursor, 1);
  }
  return cells;
}

function formatMonthLabel(visibleMonth: string): string {
  const instant = maltaDateTimeToUtc(`${visibleMonth}-01`, "12:00");
  if (!instant) {
    return visibleMonth;
  }
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Malta",
  }).format(instant);
}

function shiftMonthKey(month: string, direction: -1 | 1): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year!, monthNumber! - 1 + direction, 1));
  return shifted.toISOString().slice(0, 7);
}

export function AdminBookingExtendCalendar({
  anchorDateKey,
  availability,
  isLoading,
  loadError,
  selectedDateKey,
  time,
  onTimeChange,
  onSelectDate,
  timeLabel,
  timeHint,
  loadingLabel,
  unavailableLabel,
  availableLabel,
  selectedLabel,
}: AdminBookingExtendCalendarProps) {
  const t = useTranslations("Admin.bookings.lifecycle.extend");
  const statusLabel = useTranslations("Admin.bookings.statusDialog.statusLabel");
  const currentReturn = availability ? new Date(availability.currentReturnDateTime) : null;
  const currentDateKey = currentReturn ? maltaCalendarDateKey(currentReturn) : null;
  const [visibleMonth, setVisibleMonth] = useState(() => monthKey(anchorDateKey));

  const bounds = useMemo(() => {
    if (!availability) {
      return { latestReturn: null as Date | null, capReturn: null as Date | null, limitedByCap: false };
    }
    const returnAt = new Date(availability.currentReturnDateTime);
    const cap = maxExtensionReturn(returnAt, availability.billableDays, time) ?? returnAt;
    const latest = latestExtensionReturn(
      returnAt,
      availability.blocks.map((block) => ({
        pickupAt: new Date(block.pickupAt),
        returnAt: new Date(block.returnAt),
      })),
      cap,
    );
    return {
      latestReturn: latest,
      capReturn: cap,
      limitedByCap: latest.getTime() >= cap.getTime(),
    };
  }, [availability, time]);

  const latestReturn = bounds.latestReturn;
  const capReturn = bounds.capReturn;
  const capDateKey = capReturn ? maltaCalendarDateKey(capReturn) : null;

  const cells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const unitBookings = availability?.unitBookings ?? [];
  const otherBookings = unitBookings.filter((booking) => !booking.isCurrent);
  const [hour, minute] = time.split(":");

  function shadeForDate(dateKey: string): { className: string; label: string } | null {
    const otherIndex = otherBookings.findIndex((booking) => bookingCoversDate(booking, dateKey));
    if (otherIndex >= 0) {
      const booking = otherBookings[otherIndex]!;
      return {
        className: OTHER_DAY_SHADES[otherIndex % OTHER_DAY_SHADES.length]!,
        label: booking.bookingReference,
      };
    }
    const current = unitBookings.find((booking) => booking.isCurrent && bookingCoversDate(booking, dateKey));
    if (current) {
      return { className: "bg-sky-100 text-sky-950", label: current.bookingReference };
    }
    if (capDateKey && dateKey > capDateKey) {
      return { className: "bg-slate-200 text-slate-500", label: t("maxRentalDay") };
    }
    return null;
  }

  const limitNote = (() => {
    if (!availability || !latestReturn || !capReturn) {
      return null;
    }
    if (bounds.limitedByCap) {
      return t("maxRentalLimit", {
        date: formatMaltaDateTime(capReturn.toISOString()),
        used: availability.billableDays,
        max: MAX_BILLABLE_RENTAL_DAYS,
      });
    }
    return t("blockedByBooking", {
      date: formatMaltaDateTime(latestReturn.toISOString()),
    });
  })();

  function shiftMonth(direction: -1 | 1) {
    setVisibleMonth((current) => shiftMonthKey(current, direction));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("newReturn")}</h5>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="text-sm font-bold text-slate-950">{formatMonthLabel(visibleMonth)}</p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((label) => (
          <div key={label} className="py-1 text-[11px] font-semibold uppercase text-slate-400">
            {label}
          </div>
        ))}
        {cells.map((dateKey) => {
          const inMonth = monthKey(dateKey) === visibleMonth;
          const selectable =
            currentReturn !== null &&
            latestReturn !== null &&
            isSelectableExtensionReturn(dateKey, time, currentReturn, latestReturn);
          const selected = selectedDateKey === dateKey && selectable;
          const isCurrent = dateKey === currentDateKey;
          const shade = shadeForDate(dateKey);
          return (
            <button
              key={dateKey}
              type="button"
              disabled={!selectable || isLoading}
              title={shade?.label}
              onClick={() => onSelectDate(dateKey)}
              className={[
                "mx-auto flex size-9 items-center justify-center rounded-full text-sm font-semibold",
                selected ? "bg-[#3a7ca5] text-white" : "",
                !selected && shade ? shade.className : "",
                selectable && !selected && !shade ? "text-slate-800 hover:bg-white" : "",
                !selectable && !selected && !shade ? "cursor-not-allowed text-slate-300" : "",
                !selectable && !selected && shade ? "cursor-not-allowed" : "",
                !inMonth ? "opacity-40" : "",
                isCurrent && !selected ? "ring-1 ring-sky-500" : "",
              ].join(" ")}
            >
              {Number(dateKey.slice(8, 10))}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {timeLabel}
          </span>
          <span className="flex gap-1">
            <select
              value={hour}
              onChange={(event) => onTimeChange(`${event.target.value}:${minute}`)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              aria-label="Hour"
            >
              {Array.from({ length: 24 }, (_, value) => String(value).padStart(2, "0")).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={minute}
              onChange={(event) => onTimeChange(`${hour}:${event.target.value}`)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              aria-label="Minute"
            >
              {Array.from({ length: 60 }, (_, value) => String(value).padStart(2, "0")).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </span>
        </label>
        <p className="self-end pb-2 text-xs leading-5 text-slate-500">{timeHint}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-[#3a7ca5]" />
          {selectedLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-slate-800" />
          {availableLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-slate-300" />
          {unavailableLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-sky-200" />
          {t("thisBooking")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-amber-300" />
          {t("otherBooking")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-slate-400" />
          {t("maxRentalDay")}
        </span>
      </div>

      {limitNote ? <p className="mt-3 text-xs leading-5 text-slate-600">{limitNote}</p> : null}

      <div className="mt-4 border-t border-slate-200 pt-3">
        <h6 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("otherBookingsTitle")}</h6>
        {otherBookings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("otherBookingsEmpty")}</p>
        ) : (
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {otherBookings.map((booking, index) => {
              const knownStatus = (BOOKING_STATUSES as readonly string[]).includes(booking.status);
              return (
                <li key={booking.id} className="flex gap-2 text-sm text-slate-800">
                  <span
                    className={`mt-1 size-2.5 shrink-0 rounded-full ${OTHER_DOTS[index % OTHER_DOTS.length]}`}
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold">{booking.bookingReference}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {knownStatus
                        ? statusLabel(booking.status as (typeof BOOKING_STATUSES)[number])
                        : booking.status}
                      {" · "}
                      {formatMaltaDateTime(booking.pickupAt)}
                      {" – "}
                      {formatMaltaDateTime(booking.returnAt)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isLoading ? <p className="mt-3 text-sm text-slate-500">{loadingLabel}</p> : null}
      {loadError ? <p className="mt-3 text-sm text-red-600">{loadError}</p> : null}
    </div>
  );
}
