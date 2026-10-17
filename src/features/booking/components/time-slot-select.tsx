"use client";

import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Clock } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { TIME_SLOTS } from "@/features/booking/lib/time-slots";

const triggerShell = [
  "flex w-full min-h-12 cursor-pointer items-center gap-2 rounded-[var(--r-field)] border border-[var(--line)]",
  "bg-[var(--surface-card)] px-3.5 py-2 text-left text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)]",
  "shadow-[var(--elev-1)] transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
  "hover:border-[var(--line-strong)]",
  "focus-visible:border-[var(--blue-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]/30",
  "data-[state=open]:border-[var(--blue-500)] data-[state=open]:ring-2 data-[state=open]:ring-[var(--blue-500)]/25",
].join(" ");

type TimeSlotSelectProps = Readonly<{
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  "aria-labelledby"?: string;
  /** Defaults to full day; pass booking-only slots (e.g. 09:30–19:00) when needed. */
  slots?: readonly string[];
  triggerClassName?: string;
}>;

export const TimeSlotSelect = forwardRef<HTMLButtonElement, TimeSlotSelectProps>(
  function TimeSlotSelect(
    {
      id: idProp,
      value,
      onChange,
      onBlur,
      "aria-labelledby": ariaLabelledBy,
      slots = TIME_SLOTS,
      triggerClassName,
    },
    ref,
  ) {
    const autoId = useId();
    const id = idProp ?? `time-slot-${autoId}`;
    const [open, setOpen] = useState(false);

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            ref={ref}
            type="button"
            id={id}
            aria-labelledby={ariaLabelledBy}
            aria-haspopup="listbox"
            className={[triggerShell, "justify-between", triggerClassName].filter(Boolean).join(" ")}
            onBlur={onBlur}
          >
          <Clock className="h-4 w-4 shrink-0 text-[var(--orange-500)]" aria-hidden />
          <span className="min-w-0 flex-1 truncate tabular-nums">{value}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--ink-400)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="z-[100] max-h-[min(280px,calc(100dvh-8rem))] w-[var(--radix-popover-trigger-width)] min-w-[10rem] overflow-hidden rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-card)] p-1.5 shadow-[var(--elev-4)]"
        >
          <div
            role="listbox"
            aria-labelledby={ariaLabelledBy}
            className="max-h-[min(260px,calc(100dvh-9rem))] overflow-y-auto overscroll-contain py-0.5 [scrollbar-color:color-mix(in_srgb,var(--ink-400)_60%,transparent)_transparent] [scrollbar-width:thin]"
          >
            {slots.map((slot) => {
              const selected = slot === value;
              return (
                <button
                  key={slot}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={[
                    "flex w-full items-center rounded-[var(--r-field)] px-3 py-2 text-left text-sm tabular-nums",
                    "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
                    selected
                      ? "bg-[color-mix(in_srgb,var(--orange-400)_18%,white)] font-semibold text-[var(--ink-900)]"
                      : "font-medium text-[var(--ink-800)] hover:bg-[var(--surface-sunken)] focus-visible:bg-[var(--surface-sunken)] focus-visible:outline-none",
                  ].join(" ")}
                  onClick={() => {
                    onChange(slot);
                    setOpen(false);
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    );
  },
);
