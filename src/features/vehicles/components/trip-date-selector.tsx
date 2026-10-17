"use client";

/** Earliest selectable day defaults to today (`minDate ?? today`); no fixed June-only floor. */

import "react-day-picker/style.css";

import { useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker, type DateRange } from "react-day-picker";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parse,
  startOfDay,
} from "date-fns";
import { CalendarDays } from "lucide-react";
import {
  TRIP_MAX_SPAN_DAYS,
  TRIP_MIN_SPAN_DAYS,
} from "@/features/booking/lib/booking-schema";
import { useTranslations } from "next-intl";

/* Matches the site field shell: white surface, hairline ring, blue focus ring. */
const tripTriggerClass =
  "mt-2 flex w-full min-h-[2.625rem] items-center justify-between gap-3 rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)] px-3.5 shadow-[var(--elev-1)] transition-[background-color,border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]";

export type TripDateSelectorProps = Readonly<{
  tripStart: Date;
  tripEnd: Date;
  onRangeChange: (start: Date, end: Date) => void;
  /** First selectable calendar day. Defaults to **today** (same idea as the booking form). */
  minDate?: Date;
  className?: string;
}>;

export function TripDateSelector({
  tripStart,
  tripEnd,
  onRangeChange,
  minDate,
  className,
}: TripDateSelectorProps) {
  const t = useTranslations("TripDate");
  const [open, setOpen] = useState(false);
  const [calendarMonths, setCalendarMonths] = useState(1);
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const minDay = startOfDay(minDate ?? todayStart);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setCalendarMonths(mq.matches ? 2 : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const pickupIso = format(tripStart, "yyyy-MM-dd");
  const dropoffIso = format(tripEnd, "yyyy-MM-dd");

  const range: DateRange = {
    from: parse(pickupIso, "yyyy-MM-dd", new Date()),
    to: parse(dropoffIso, "yyyy-MM-dd", new Date()),
  };

  const dateSummary = `${format(tripStart, "d MMM")} → ${format(tripEnd, "d MMM yyyy")}`;

  return (
    <div className={className}>
      <p className="type-eyebrow text-[var(--text-muted)]">{t("label")}</p>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={tripTriggerClass}
            aria-label={t("ariaSummary", { summary: dateSummary })}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <CalendarDays
                className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                aria-hidden
              />
              <span
                data-numeric
                className="truncate text-sm font-semibold text-[var(--ink-800)]"
              >
                {dateSummary}
              </span>
            </span>
            <span className="type-spec shrink-0 text-[var(--text-muted)]">
              {t("change")}
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={8}
            align="center"
            collisionPadding={{ top: 72, right: 16, bottom: 16, left: 16 }}
            className="z-[100] max-h-[var(--radix-popover-content-available-height)] w-max max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-2.5 shadow-[var(--elev-3)] sm:rounded-[var(--r-panel)] sm:p-3 sm:shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-4)]"
          >
            <DayPicker
              mode="range"
              numberOfMonths={calendarMonths}
              selected={range}
              max={TRIP_MAX_SPAN_DAYS}
              onSelect={(r) => {
                if (!r?.from) return;
                const from = startOfDay(r.from);
                let to =
                  r.to != null ? startOfDay(r.to) : addDays(from, TRIP_MIN_SPAN_DAYS);
                const span = differenceInCalendarDays(to, from);
                if (span < TRIP_MIN_SPAN_DAYS) {
                  to = addDays(from, TRIP_MIN_SPAN_DAYS);
                } else if (span > TRIP_MAX_SPAN_DAYS) {
                  to = addDays(from, TRIP_MAX_SPAN_DAYS);
                }
                onRangeChange(from, to);
              }}
              disabled={{ before: minDay }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
