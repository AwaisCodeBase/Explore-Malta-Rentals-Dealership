"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  buildBookingColorIndexById,
  getBookingCalendarColor,
  getBookingsOnDate,
  getDayCellBackgroundStyle,
  isToday,
} from "@/lib/admin/vehicles/booking-calendar-utils";
import type { AdminVehicleBookingCalendarItem } from "@/lib/admin/vehicles/getAdminVehicleBookingsForCalendar";
import { formatMaltaDateTime } from "@/lib/format-malta-datetime";

type CalendarView = "week" | "month";

type AdminVehicleBookingCalendarProps = Readonly<{
  bookings: AdminVehicleBookingCalendarItem[];
}>;

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function buildMonthGrid(month: Date): Date[][] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function buildWeekRow(weekAnchor: Date): Date[] {
  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
}

function formatBookingRange(
  booking: AdminVehicleBookingCalendarItem,
  locale: string,
): string {
  return `${formatMaltaDateTime(booking.pickupDateTime, locale)} → ${formatMaltaDateTime(booking.returnDateTime, locale)}`;
}

export function AdminVehicleBookingCalendar({ bookings }: AdminVehicleBookingCalendarProps) {
  const locale = useLocale();
  const t = useTranslations("Admin.vehicles.details.calendar");

  const [view, setView] = useState<CalendarView>("month");
  const [anchorDate, setAnchorDate] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const bookingColorIndexById = useMemo(() => buildBookingColorIndexById(bookings), [bookings]);

  const visibleWeeks = useMemo(
    () => (view === "month" ? buildMonthGrid(anchorDate) : [buildWeekRow(anchorDate)]),
    [anchorDate, view],
  );

  const headerLabel =
    view === "month"
      ? anchorDate.toLocaleDateString(locale, { month: "long", year: "numeric" })
      : (() => {
          const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
          const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
          const startLabel = weekStart.toLocaleDateString(locale, options);
          const endLabel = weekEnd.toLocaleDateString(locale, {
            ...options,
            year: weekStart.getFullYear() === weekEnd.getFullYear() ? undefined : "numeric",
          });
          return `${startLabel} – ${endLabel}`;
        })();

  const selectedDayBookings = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    return getBookingsOnDate(bookings, selectedDate);
  }, [bookings, selectedDate]);

  function shiftAnchor(direction: -1 | 1) {
    setAnchorDate((current) =>
      view === "month" ? addMonths(current, direction) : addWeeks(current, direction),
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftAnchor(-1)}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label={t("previous")}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <p className="min-w-0 flex-1 text-center text-sm font-bold text-slate-950">{headerLabel}</p>
          <button
            type="button"
            onClick={() => shiftAnchor(1)}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label={t("next")}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setView("week")}
            className={[
              "cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition",
              view === "week" ? "bg-[#3a7ca5] text-white shadow-sm" : "text-slate-700 hover:text-slate-900",
            ].join(" ")}
          >
            {t("week")}
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={[
              "cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition",
              view === "month" ? "bg-[#3a7ca5] text-white shadow-sm" : "text-slate-700 hover:text-slate-900",
            ].join(" ")}
          >
            {t("month")}
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAY_KEYS.map((key) => (
            <div key={key} className="py-1 text-[11px] font-medium text-slate-400">
              {t(`weekdays.${key}`)}
            </div>
          ))}

          {visibleWeeks.flatMap((week) =>
            week.map((day) => {
              const dayBookings = getBookingsOnDate(bookings, day);
              const booked = dayBookings.length > 0;
              const inCurrentMonth = view === "week" || isSameMonth(day, anchorDate);
              const selected = selectedDate != null && format(selectedDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
              const today = isToday(day);
              const primaryColor = booked
                ? getBookingCalendarColor(bookingColorIndexById.get(dayBookings[0]!.id) ?? 0)
                : null;
              const dayStyle = booked
                ? getDayCellBackgroundStyle(dayBookings, bookingColorIndexById)
                : undefined;

              return (
                <button
                  key={format(day, "yyyy-MM-dd")}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  style={{
                    ...dayStyle,
                    ...(selected && booked && primaryColor
                      ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${primaryColor.accent}66` }
                      : {}),
                  }}
                  className={[
                    "mx-auto flex size-9 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition",
                    booked ? "text-slate-700 hover:brightness-95" : "text-slate-600 hover:bg-slate-100",
                    !inCurrentMonth && view === "month" ? (booked ? "opacity-70" : "text-slate-300") : "",
                    selected && !booked ? "ring-2 ring-[#3a7ca5]/40" : "",
                    today && !booked ? "font-bold text-slate-900" : "",
                  ].join(" ")}
                  aria-pressed={selected}
                  aria-label={format(day, "PPP")}
                >
                  {format(day, "d")}
                </button>
              );
            }),
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
          {bookings.map((booking) => {
            const color = getBookingCalendarColor(bookingColorIndexById.get(booking.id) ?? 0);
            return (
              <span key={booking.id} className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <span
                  className="inline-flex size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color.bg }}
                  aria-hidden
                />
                <span className="truncate font-medium text-slate-700">{booking.bookingReference}</span>
              </span>
            );
          })}
          <span className="text-slate-500">{t("bookingCount", { count: bookings.length })}</span>
        </div>
      </div>

      {selectedDate ? (
        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-bold text-slate-950">
            {t("selectedDayTitle", {
              date: selectedDate.toLocaleDateString(locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
            })}
          </h4>
          {selectedDayBookings.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("noBookingsOnDay")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {selectedDayBookings.map((booking) => {
                const color = getBookingCalendarColor(bookingColorIndexById.get(booking.id) ?? 0);
                return (
                  <li
                    key={booking.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm"
                    style={{ borderLeftWidth: "3px", borderLeftColor: color.accent }}
                  >
                    <p className="font-semibold text-slate-900">{booking.bookingReference}</p>
                    <p className="mt-0.5 text-slate-700">{booking.customerFullName}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatBookingRange(booking, locale)}</p>
                    <p className="mt-1 text-xs font-medium" style={{ color: color.accent }}>
                      {t(`status.${booking.status}`)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-slate-500">{t("selectDayHint")}</p>
      )}

      {bookings.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-bold text-slate-950">{t("upcomingTitle")}</h4>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {bookings.slice(0, 8).map((booking) => {
              const color = getBookingCalendarColor(bookingColorIndexById.get(booking.id) ?? 0);
              return (
                <li key={booking.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className="mt-0.5 inline-flex size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color.bg }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{booking.bookingReference}</p>
                      <p className="truncate text-slate-500">{formatBookingRange(booking, locale)}</p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-semibold"
                    style={{
                      backgroundColor: color.bg,
                      color: color.accent,
                    }}
                  >
                    {t(`status.${booking.status}`)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
