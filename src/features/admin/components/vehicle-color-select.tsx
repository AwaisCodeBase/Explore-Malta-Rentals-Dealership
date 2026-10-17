"use client";

import { Check, ChevronDown, Palette } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import {
  VEHICLE_COLOR_OPTIONS,
  getVehicleColorSwatch,
  isPresetVehicleColor,
} from "@/features/vehicles/lib/vehicle-color";

type VehicleColorSelectProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  customColorLabel?: string;
  customColorPlaceholder?: string;
  applyCustomLabel?: string;
  required?: boolean;
  className?: string;
  id?: string;
}>;

function swatchStyle(color: string): React.CSSProperties {
  const swatch = getVehicleColorSwatch(color);
  if (swatch.startsWith("linear-gradient")) {
    return { background: swatch };
  }
  return { backgroundColor: swatch };
}

function optionButtonClass(isSelected: boolean): string {
  return [
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
    isSelected ? "bg-[#3a7ca5]/10 text-[#2f6688]" : "text-slate-800 hover:bg-slate-50",
  ].join(" ");
}

export function VehicleColorSelect({
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = "No color selected",
  customColorLabel = "Custom color…",
  customColorPlaceholder = "Enter color name",
  applyCustomLabel = "Apply",
  required = false,
  className,
  id,
}: VehicleColorSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(() => Boolean(value) && !isPresetVehicleColor(value));
  const [customDraft, setCustomDraft] = useState(() =>
    value && !isPresetVehicleColor(value) ? value : "",
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (value && !isPresetVehicleColor(value)) {
      setCustomMode(true);
      setCustomDraft(value);
      return;
    }
    if (!value) {
      setCustomMode(false);
      setCustomDraft("");
    }
  }, [value]);

  useEffect(() => {
    if (open && customMode) {
      customInputRef.current?.focus();
    }
  }, [customMode, open]);

  const displayLabel = value
    ? value
    : emptyLabel;

  function selectPreset(color: string) {
    setCustomMode(false);
    setCustomDraft("");
    onChange(color);
    setOpen(false);
  }

  function applyCustomColor() {
    const trimmed = customDraft.trim();
    if (!trimmed) {
      return;
    }
    onChange(trimmed);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={["relative", className].filter(Boolean).join(" ")}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3a7ca5]/40 focus:bg-white focus:ring-2 focus:ring-[#3a7ca5]/15"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className={[
              "size-4 shrink-0 rounded-full border border-slate-200",
              value ? "" : "bg-slate-100",
            ].join(" ")}
            style={value ? swatchStyle(value) : undefined}
          />
          <span className={value ? "truncate font-medium" : "truncate text-slate-500"}>
            {displayLabel}
          </span>
        </span>
        <ChevronDown
          className={["size-4 shrink-0 text-slate-400 transition", open ? "rotate-180" : ""].join(" ")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Color"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {allowEmpty ? (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => selectPreset("")}
              className={optionButtonClass(!value)}
            >
              <span className="size-4 shrink-0 rounded-full border border-dashed border-slate-300 bg-slate-50" aria-hidden />
              <span className="flex-1">{emptyLabel}</span>
              {!value ? <Check className="size-4 shrink-0" aria-hidden /> : null}
            </button>
          ) : null}

          {VEHICLE_COLOR_OPTIONS.map((color) => {
            const isSelected = value === color;
            return (
              <button
                key={color}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectPreset(color)}
                className={optionButtonClass(isSelected)}
              >
                <span
                  aria-hidden
                  className="size-4 shrink-0 rounded-full border border-slate-200"
                  style={swatchStyle(color)}
                />
                <span className="flex-1 font-medium">{color}</span>
                {isSelected ? <Check className="size-4 shrink-0" aria-hidden /> : null}
              </button>
            );
          })}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            role="option"
            aria-selected={customMode || (!!value && !isPresetVehicleColor(value))}
            onClick={() => {
              setCustomMode(true);
              if (value && !isPresetVehicleColor(value)) {
                setCustomDraft(value);
              }
            }}
            className={optionButtonClass(customMode || (!!value && !isPresetVehicleColor(value)))}
          >
            <Palette className="size-4 shrink-0 text-slate-500" aria-hidden />
            <span className="flex-1 font-medium">{customColorLabel}</span>
          </button>

          {customMode ? (
            <div className="space-y-2 px-2.5 py-2">
              <input
                ref={customInputRef}
                type="text"
                value={customDraft}
                onChange={(event) => setCustomDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyCustomColor();
                  }
                }}
                placeholder={customColorPlaceholder}
                required={required && !value}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3a7ca5]/40 focus:bg-white focus:ring-2 focus:ring-[#3a7ca5]/15"
              />
              <button
                type="button"
                disabled={!customDraft.trim()}
                onClick={applyCustomColor}
                className="w-full cursor-pointer rounded-lg bg-[#3a7ca5] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#2f6688] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applyCustomLabel}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {required && !value ? (
        <input
          tabIndex={-1}
          aria-hidden
          value=""
          required
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          onChange={() => undefined}
        />
      ) : null}
    </div>
  );
}
