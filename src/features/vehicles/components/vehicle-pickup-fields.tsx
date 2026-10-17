"use client";

import { useMemo } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import AsyncSelect from "react-select/async";
import type { GroupBase, StylesConfig } from "react-select";
import { MapPin } from "lucide-react";
import {
  type BookingOption,
  locationOptions,
} from "@/features/home/data/hero-booking-options";
import { loadMaltaLocationOptions } from "@/features/vehicles/lib/malta-pickup-location";

/** Shared shell for vehicle filter controls — matches the trip-date filter trigger styling. */
export const vehicleFilterControlShellClass =
  "mt-2 flex w-full min-w-0 min-h-[2.875rem] items-center gap-2 rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)] px-3.5 shadow-[var(--elev-1)] transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:border-[var(--line-strong)] focus-within:border-[var(--blue-500)] focus-within:ring-2 focus-within:ring-[var(--blue-500)]/25";

const fieldWrapClass = vehicleFilterControlShellClass;

const fieldLabelClass =
  "type-spec flex min-w-0 w-full flex-col text-[var(--text-muted)]";

/** react-select menu + options — same look for location, type, and transmission. */
export const vehicleFilterReactSelectStyles: StylesConfig<
  BookingOption,
  false,
  GroupBase<BookingOption>
> = {
  container: (base) => ({
    ...base,
    width: "100%",
  }),
  control: (base) => ({
    ...base,
    border: "none",
    boxShadow: "none",
    minHeight: 42,
    minWidth: 0,
    flex: 1,
    width: "100%",
    alignItems: "center",
    background: "transparent",
    cursor: "pointer",
  }),
  valueContainer: (base) => ({ ...base, padding: 0 }),
  singleValue: (base) => ({
    ...base,
    margin: 0,
    color: "var(--ink-900)",
    fontWeight: 600,
    fontSize: "0.875rem",
    lineHeight: 1.25,
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
    lineHeight: 1.25,
  }),
  indicatorsContainer: (base) => ({ ...base, gap: 2 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "var(--ink-500)",
    padding: "0 0 0 4px",
    transition: "color var(--dur-fast) var(--ease-standard)",
    ":hover": { color: "var(--ink-800)" },
  }),
  loadingIndicator: (base) => ({ ...base, color: "var(--ink-400)" }),
  menu: (base) => ({
    ...base,
    borderRadius: "var(--r-card)",
    border: "1px solid var(--line-subtle)",
    backgroundColor: "var(--surface-card)",
    boxShadow: "var(--elev-5)",
    overflow: "hidden",
    zIndex: 9999,
    marginTop: 6,
    padding: 0,
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: 260,
    padding: "6px",
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
  option: (base, state) => ({
    ...base,
    borderRadius: "calc(var(--r-field) - 2px)",
    fontSize: "0.875rem",
    fontWeight: state.isSelected ? 600 : 500,
    letterSpacing: "-0.01em",
    padding: "9px 12px",
    marginBottom: 2,
    cursor: "pointer",
    transition:
      "background-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)",
    backgroundColor: state.isSelected
      ? "color-mix(in srgb, var(--orange-600) 10%, var(--surface-card))"
      : state.isFocused
        ? "var(--surface-soft)"
        : "transparent",
    color: "var(--ink-900)",
    boxShadow: state.isSelected
      ? "inset 0 0 0 1px color-mix(in srgb, var(--orange-600) 20%, var(--line))"
      : "none",
    ":active": {
      ...base[":active"],
      backgroundColor: state.isSelected
        ? "color-mix(in srgb, var(--orange-600) 14%, var(--surface-card))"
        : "var(--surface-band)",
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

type VehiclePickupLocationFieldProps = Readonly<{
  pickupLocation: BookingOption | null;
  onPickupLocationChange: (option: BookingOption | null) => void;
}>;

export function VehiclePickupLocationField({
  pickupLocation,
  onPickupLocationChange,
}: VehiclePickupLocationFieldProps) {
  const defaultLocationOptions = useMemo(() => [...locationOptions], []);

  return (
    <label className={fieldLabelClass}>
      Pick-up location
      <div className={fieldWrapClass}>
        <MapPin
          className="h-4 w-4 shrink-0 text-[var(--orange-500)]"
          aria-hidden
        />
        <AsyncSelect
          className="min-w-0 flex-1"
          inputId="vehicles-pickup-location"
          instanceId="vehicles-pickup-location"
          value={pickupLocation}
          defaultOptions={defaultLocationOptions}
          loadOptions={loadMaltaLocationOptions}
          isSearchable
          onChange={(option) => onPickupLocationChange(option)}
          styles={vehicleFilterReactSelectStyles}
          menuPortalTarget={
            typeof window !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          placeholder="enter your location"
          noOptionsMessage={({ inputValue }) => {
            const q = inputValue.trim();
            if (!q) return null;
            return `No locations match "${q}"`;
          }}
          loadingMessage={() => "Searching locations..."}
          cacheOptions
          aria-label="Pick-up location"
        />
      </div>
    </label>
  );
}

type VehiclePickupDateFieldProps = Readonly<{
  pickupDate: Date;
  onPickupDateChange: (date: Date) => void;
}>;

export function VehiclePickupDateField({
  pickupDate,
  onPickupDateChange,
}: VehiclePickupDateFieldProps) {
  const onDateChange = (value: Dayjs | null) => {
    if (!value) {
      return;
    }
    onPickupDateChange(value.toDate());
  };

  return (
    <label className={fieldLabelClass}>
      Pick-up date
      <div className={fieldWrapClass}>
        <DatePicker
          value={dayjs(pickupDate)}
          onChange={onDateChange}
          minDate={dayjs("2026-06-01")}
          format="DD MMM YYYY"
          slotProps={{
            textField: {
              variant: "standard",
              InputProps: { disableUnderline: true },
              sx: {
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                "& .MuiInputBase-root": {
                  p: 0,
                  minHeight: 36,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--ink-900)",
                  alignItems: "center",
                },
                "& .MuiInputBase-input": {
                  p: 0,
                  py: 0,
                  cursor: "pointer",
                },
                "& .MuiIconButton-root": {
                  color: "var(--ink-500)",
                  p: 0,
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "1.1rem",
                },
              },
            },
            desktopPaper: {
              sx: {
                borderRadius: "var(--r-card)",
                border: "1px solid var(--line)",
                boxShadow: "var(--elev-4)",
              },
            },
          }}
        />
      </div>
    </label>
  );
}
