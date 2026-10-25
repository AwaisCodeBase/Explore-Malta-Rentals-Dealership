"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import type { GroupBase, StylesConfig } from "react-select";
import { useTranslations } from "next-intl";
import type { BookingOption } from "@/features/home/data/hero-booking-options";
import { loadMaltaLocationOptions } from "@/features/vehicles/lib/malta-pickup-location";

const addressSelectStyles: StylesConfig<BookingOption, false, GroupBase<BookingOption>> = {
  control: (base, state) => ({
    ...base,
    minHeight: 56,
    borderRadius: "var(--r-field)",
    borderColor: state.isFocused ? "var(--blue-500)" : "var(--line)",
    boxShadow: state.isFocused
      ? "0 0 0 2px color-mix(in srgb, var(--blue-500) 25%, transparent)"
      : "var(--elev-1)",
    background: "var(--surface-card)",
    cursor: "text",
    transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)",
    ":hover": {
      borderColor: state.isFocused ? "var(--blue-500)" : "var(--line-strong)",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "8px 12px",
  }),
  singleValue: (base) => ({
    ...base,
    margin: 0,
    color: "var(--ink-900)",
    fontWeight: 500,
    fontSize: "0.875rem",
    lineHeight: 1.45,
    whiteSpace: "normal",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    color: "var(--ink-900)",
    fontWeight: 500,
    fontSize: "0.875rem",
  }),
  placeholder: (base) => ({
    ...base,
    margin: 0,
    color: "var(--ink-400)",
    fontWeight: 500,
    fontSize: "0.875rem",
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
    padding: 8,
    ":hover": { color: "var(--ink-800)" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "var(--ink-400)",
    padding: 8,
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
    maxHeight: 280,
    padding: 6,
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "var(--r-field)",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
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
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

export type BookingAddressFieldProps = Readonly<{
  id: string;
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  placeholder: string;
  hasError?: boolean;
}>;

export function BookingAddressField({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  hasError = false,
}: BookingAddressFieldProps) {
  const t = useTranslations("HomeHeroPanel");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setIsMounted(true);
    });
  }, []);

  const selected: BookingOption | null = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return { value: trimmed, label: trimmed };
  }, [value]);

  const loadOptions = useCallback((input: string) => loadMaltaLocationOptions(input), []);

  if (!isMounted) {
    return (
      <div
        className="mt-1.5 min-h-14 rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)] sm:mt-2"
        aria-hidden
      />
    );
  }

  return (
    <div className={`mt-1.5 sm:mt-2${hasError ? " [&_.booking-address-control]:!border-red-400 [&_.booking-address-control]:!ring-2 [&_.booking-address-control]:!ring-red-500/15" : ""}`}>
      <AsyncCreatableSelect<BookingOption, false, GroupBase<BookingOption>>
        inputId={id}
        instanceId={`${id}-address`}
        value={selected}
        loadOptions={loadOptions}
        defaultOptions
        cacheOptions
        isClearable
        isSearchable
        allowCreateWhileLoading
        createOptionPosition="first"
        formatCreateLabel={(input) => input.trim()}
        getNewOptionData={(inputValue, optionLabel) => ({
          value: String(optionLabel),
          label: String(optionLabel),
        })}
        onChange={(option) => {
          onChange(option?.label?.trim() ?? "");
        }}
        onBlur={onBlur}
        styles={addressSelectStyles}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }) => {
          const q = inputValue.trim();
          if (!q) return null;
          return t("noLocationsMatch", { query: q });
        }}
        loadingMessage={() => t("searchingLocations")}
        className="booking-address-field min-w-0"
        classNames={{
          container: () => "w-full",
          control: () => "booking-address-control",
        }}
      />
    </div>
  );
}
