"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import type { GroupBase, StylesConfig } from "react-select";
import type { BookingOption } from "@/features/home/data/hero-booking-options";
import {
  CUSTOM_LOCATION_ID,
  LOCATION_ENTRIES,
  locationLabelById,
} from "@/features/booking/data/locations";
import { loadMaltaLocationOptions } from "@/features/vehicles/lib/malta-pickup-location";

const HERO_VALUE_TO_BOOKING_ID: Readonly<Record<string, string>> = {
  "luqa-airport": "mla",
  "st-pauls-bay": "st-pauls",
  bugibba: "st-pauls",
  qawra: "st-pauls",
  rabat: "mdina",
};

const locationSelectStyles: StylesConfig<BookingOption, false, GroupBase<BookingOption>> = {
  control: (base) => ({
    ...base,
    border: "none",
    boxShadow: "none",
    minHeight: 28,
    background: "transparent",
    cursor: "pointer",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: 0,
    paddingLeft: 2,
  }),
  singleValue: (base) => ({
    ...base,
    margin: 0,
    color: "var(--ink-900)",
    fontWeight: 600,
    fontSize: "0.875rem",
    letterSpacing: "-0.01em",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: "var(--ink-900)",
    fontWeight: 600,
    fontSize: "0.875rem",
  }),
  placeholder: (base) => ({
    ...base,
    margin: 0,
    color: "var(--ink-400)",
    fontWeight: 500,
    fontSize: "0.875rem",
    letterSpacing: "-0.01em",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    gap: 2,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "var(--ink-500)",
    padding: 2,
    transition: "color var(--dur-fast) var(--ease-standard)",
    ":hover": { color: "var(--ink-800)" },
  }),
  loadingIndicator: (base) => ({ ...base, color: "var(--ink-400)" }),
  menu: (base) => ({
    ...base,
    borderRadius: "var(--r-card)",
    border: "1px solid var(--line)",
    boxShadow: "var(--elev-4)",
    overflow: "hidden",
    zIndex: 9999,
    marginTop: 8,
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: 300,
    padding: 6,
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "var(--r-field)",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color var(--dur-fast) var(--ease-standard)",
    background: state.isSelected
      ? "var(--blue-500)"
      : state.isFocused
        ? "color-mix(in srgb, var(--blue-500) 10%, white)"
        : "transparent",
    color: state.isSelected ? "#ffffff" : "var(--ink-900)",
    ":active": {
      ...base[":active"],
      background: state.isSelected
        ? "var(--blue-600)"
        : "color-mix(in srgb, var(--blue-500) 16%, white)",
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    fontSize: "0.8125rem",
    color: "var(--text-muted)",
  }),
  loadingMessage: (base) => ({
    ...base,
    fontSize: "0.8125rem",
    color: "var(--text-muted)",
  }),
  groupHeading: (base) => ({
    ...base,
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-faint)",
    paddingTop: 8,
    paddingBottom: 4,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

function mapOptionToFormFields(option: BookingOption): { id: string; custom: string } {
  if (LOCATION_ENTRIES.some((e) => e.id === option.value)) {
    return { id: option.value, custom: "" };
  }
  const aliased = HERO_VALUE_TO_BOOKING_ID[option.value];
  if (aliased) {
    return { id: aliased, custom: "" };
  }
  if (/^\d+$/.test(option.value)) {
    return { id: CUSTOM_LOCATION_ID, custom: option.label };
  }
  return { id: CUSTOM_LOCATION_ID, custom: option.label };
}

const groupedDefaults: GroupBase<BookingOption>[] = (() => {
  const map = new Map<string, BookingOption[]>();
  for (const e of LOCATION_ENTRIES) {
    const list = map.get(e.group) ?? [];
    list.push({ value: e.id, label: e.label });
    map.set(e.group, list);
  }
  return [...map.entries()].map(([label, options]) => ({ label, options }));
})();

async function loadBookingLocationOptions(inputValue: string): Promise<BookingOption[]> {
  const q = inputValue.trim().toLowerCase();
  const curatedMatches = LOCATION_ENTRIES.filter(
    (e) => !q || e.label.toLowerCase().includes(q) || e.group.toLowerCase().includes(q),
  ).map((e) => ({ value: e.id, label: e.label }));

  const remote = await loadMaltaLocationOptions(inputValue);
  const seen = new Set(curatedMatches.map((o) => `${o.value}:${o.label.toLowerCase()}`));
  const out: BookingOption[] = [...curatedMatches];
  for (const o of remote) {
    const key = `${o.value}:${o.label.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(o);
    }
  }
  return out;
}

export type BookingLocationSelectProps = Readonly<{
  id: string;
  "aria-labelledby"?: string;
  locationId: string;
  locationCustom: string;
  onChange: (next: { locationId: string; locationCustom: string }) => void;
  onBlur?: () => void;
  placeholder: string;
}>;

export function BookingLocationSelect({
  id,
  "aria-labelledby": ariaLabelledBy,
  locationId,
  locationCustom,
  onChange,
  onBlur,
  placeholder,
}: BookingLocationSelectProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setIsMounted(true);
    });
  }, []);

  const value: BookingOption | null = useMemo(() => {
    if (!locationId) return null;
    if (locationId === CUSTOM_LOCATION_ID) {
      const label = locationCustom.trim() || "Other address (custom)";
      return { value: CUSTOM_LOCATION_ID, label };
    }
    const label = locationLabelById(locationId) ?? locationId;
    return { value: locationId, label };
  }, [locationId, locationCustom]);

  const loadOptions = useCallback((input: string) => loadBookingLocationOptions(input), []);

  if (!isMounted) {
    return (
      <div
        className="skeleton min-h-[3rem] flex-1 rounded-[var(--r-field)]"
        aria-hidden
      />
    );
  }

  return (
    <AsyncSelect<BookingOption, false, GroupBase<BookingOption>>
      inputId={id}
      instanceId={`${id}-location`}
      aria-labelledby={ariaLabelledBy}
      value={value}
      defaultOptions={groupedDefaults}
      loadOptions={loadOptions}
      isSearchable
      onChange={(option) => {
        if (!option) {
          onChange({ locationId: "", locationCustom: "" });
          return;
        }
        const mapped = mapOptionToFormFields(option);
        onChange({ locationId: mapped.id, locationCustom: mapped.custom });
      }}
      onBlur={onBlur}
      styles={locationSelectStyles}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      placeholder={placeholder}
      noOptionsMessage={({ inputValue }) => {
        const v = inputValue.trim();
        if (!v) return null;
        return `No locations match "${v}"`;
      }}
      loadingMessage={() => "Searching locations…"}
      cacheOptions
      className="min-w-0 flex-1"
      classNames={{
        container: () => "w-full",
        control: () => "!min-h-0",
      }}
    />
  );
}
