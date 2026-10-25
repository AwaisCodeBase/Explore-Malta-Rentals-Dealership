"use client";

import Select, {
  components as selectComponents,
  type DropdownIndicatorProps,
  type StylesConfig,
} from "react-select";
import type { ReactNode } from "react";
import type { BookingOption } from "@/features/home/data/hero-booking-options";
import {
  VEHICLE_TYPES,
  type Transmission,
  type VehicleColor,
  type VehicleSeatsFilter,
  type VehicleType,
} from "@/features/vehicles/data/vehicles";

const VEHICLE_TYPE_OPTIONS: readonly (VehicleType | "All")[] = ["All", ...VEHICLE_TYPES];

const TRANSMISSIONS: readonly (Transmission | "All")[] = [
  "All",
  "Automatic",
  "Manual",
];

const SEAT_OPTIONS: readonly BookingOption[] = [
  { value: "All", label: "Any" },
  { value: "1", label: "1 seat" },
  { value: "2", label: "2 seats" },
  { value: "3", label: "3 seats" },
];

type VehicleListingSidebarProps = Readonly<{
  brandOptions: readonly string[];
  selectedBrand: string | "All";
  onBrandChange: (value: string | "All") => void;
  colorOptions: readonly (VehicleColor | "All")[];
  selectedType: VehicleType | "All";
  onTypeChange: (value: VehicleType | "All") => void;
  selectedTransmission: Transmission | "All";
  onTransmissionChange: (value: Transmission | "All") => void;
  selectedColor: VehicleColor | "All";
  onColorChange: (value: VehicleColor | "All") => void;
  selectedSeats: VehicleSeatsFilter;
  onSeatsChange: (value: VehicleSeatsFilter) => void;
  /** `rail`: flat panel for a full-height left column (e.g. Kayak-style). `card`: self-contained rounded box. */
  variant?: "rail" | "card";
  /** When set with `onToggleCollapsed`, desktop (`lg+`) sidebar can collapse to a narrow strip. Mobile always shows the full panel. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  className?: string;
}>;

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m12 6-4 4 4 4" />
    </svg>
  );
}

function CollapsedRailFilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 3H2l8 9.32V20l4 2v-7.68L22 3z" />
    </svg>
  );
}

function optionByValue(
  options: readonly BookingOption[],
  value: string,
): BookingOption {
  return options.find((o) => o.value === value) ?? options[0]!;
}

function SeatDropdownIndicator(
  props: DropdownIndicatorProps<BookingOption, false>,
) {
  return (
    <selectComponents.DropdownIndicator {...props}>
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 text-slate-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m6 8 4 4 4-4" />
      </svg>
    </selectComponents.DropdownIndicator>
  );
}

const seatSelectComponents = {
  DropdownIndicator: SeatDropdownIndicator,
};

function FilterSection({
  title,
  children,
  sleek,
}: Readonly<{ title: string; children: ReactNode; sleek?: boolean }>) {
  if (sleek) {
    return (
      <div className="border-b border-slate-200/35 pb-3.5 last:border-b-0 last:pb-0">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </h3>
        <div className="mt-2 flex flex-col gap-0.5">{children}</div>
      </div>
    );
  }
  return (
    <div className="border-b border-slate-200/90 pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {title}
      </h3>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}

function RadioRow({
  name,
  id,
  label,
  checked,
  onChange,
  sleek,
}: Readonly<{
  name: string;
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  sleek?: boolean;
}>) {
  if (sleek) {
    return (
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-[13px] font-medium leading-snug text-slate-600 transition-[background-color,border-color,box-shadow,color] duration-150 hover:border-slate-200/70 hover:bg-white/60 has-[:checked]:border-[color-mix(in_srgb,var(--brand-orange)_28%,transparent)] has-[:checked]:bg-[color-mix(in_srgb,var(--brand-orange)_10%,white)] has-[:checked]:text-slate-800 has-[:checked]:shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
      >
        <input
          id={id}
          name={name}
          type="radio"
          checked={checked}
          onChange={onChange}
          className="size-3.5 shrink-0 border-slate-300/80 text-[var(--brand-orange)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]/35"
        />
        <span>{label}</span>
      </label>
    );
  }
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100/80 has-[:checked]:bg-slate-100/90"
    >
      <input
        id={id}
        name={name}
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 border-slate-300 text-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)]/35"
      />
      <span>{label}</span>
    </label>
  );
}

function SeatsDropdown({
  value,
  onChange,
  sleek,
}: Readonly<{
  value: VehicleSeatsFilter;
  onChange: (v: VehicleSeatsFilter) => void;
  sleek?: boolean;
}>) {
  const styles: StylesConfig<BookingOption, false> = {
    container: (base) => ({
      ...base,
      width: "100%",
      marginTop: 8,
    }),
    control: (base, state) => ({
      ...base,
      minHeight: sleek ? 36 : 38,
      borderRadius: sleek ? 10 : 8,
      borderColor: state.isFocused
        ? "rgba(58,124,165,0.35)"
        : sleek
          ? "rgba(148,163,184,0.35)"
          : "rgba(148,163,184,0.45)",
      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(58,124,165,0.2)"
        : "0 1px 2px rgba(15,23,42,0.04)",
      backgroundColor: sleek ? "rgba(255,255,255,0.9)" : "#fff",
      cursor: "pointer",
      paddingLeft: 4,
      paddingRight: 4,
      ":hover": {
        borderColor: "rgba(148,163,184,0.55)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 6px",
    }),
    singleValue: (base) => ({
      ...base,
      margin: 0,
      color: "#334155",
      fontWeight: 600,
      fontSize: sleek ? 13 : 14,
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#64748b",
      padding: 3,
      ":hover": { color: "#334155" },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 10,
      border: "1px solid rgba(58,124,165,0.22)",
      boxShadow: "0 16px 34px -22px rgba(15,23,42,0.45)",
      overflow: "hidden",
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      paddingTop: 4,
      paddingBottom: 4,
    }),
    option: (base, state) => ({
      ...base,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      backgroundColor: state.isSelected
        ? "var(--brand-blue)"
        : state.isFocused
          ? "rgba(58,124,165,0.1)"
          : "#fff",
      color: state.isSelected ? "#fff" : "#334155",
      ":active": {
        backgroundColor: "rgba(58,124,165,0.18)",
      },
    }),
  };

  return (
    <Select<BookingOption, false>
      inputId="vehicle-sidebar-seats"
      instanceId="vehicle-sidebar-seats"
      aria-label="Seats"
      value={optionByValue(SEAT_OPTIONS, value === "All" ? "All" : String(value))}
      onChange={(opt) => {
        if (!opt) return;
        if (opt.value === "All") onChange("All");
        else onChange(Number(opt.value) as 1 | 2 | 3);
      }}
      options={[...SEAT_OPTIONS]}
      isSearchable={false}
      styles={styles}
      components={seatSelectComponents}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      classNamePrefix="vehicle-sidebar-seats"
    />
  );
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function VehicleListingSidebar({
  brandOptions,
  selectedBrand,
  onBrandChange,
  colorOptions,
  selectedType,
  onTypeChange,
  selectedTransmission,
  onTransmissionChange,
  selectedColor,
  onColorChange,
  selectedSeats,
  onSeatsChange,
  variant = "card",
  collapsed = false,
  onToggleCollapsed,
  className,
}: VehicleListingSidebarProps) {
  const surfaceClass =
    variant === "rail"
      ? "border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
      : "rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-sm lg:sticky lg:top-24 lg:self-start";

  const collapsibleRail = variant === "rail" && onToggleCollapsed;

  const filterPanelId = "vehicle-filters-panel";
  const sleekRail = variant === "rail";

  const filterSections = (
    <div
      id={filterPanelId}
      className={sleekRail ? "space-y-3.5" : "space-y-5"}
    >
      <FilterSection title="Brand" sleek={sleekRail}>
        <RadioRow
          name="brand"
          id="brand-all"
          label="All brands"
          checked={selectedBrand === "All"}
          onChange={() => onBrandChange("All")}
          sleek={sleekRail}
        />
        {brandOptions.map((brand) => (
          <RadioRow
            key={brand}
            name="brand"
            id={`brand-${brand.toLowerCase().replace(/\s+/g, "-")}`}
            label={brand}
            checked={selectedBrand === brand}
            onChange={() => onBrandChange(brand)}
            sleek={sleekRail}
          />
        ))}
      </FilterSection>

      <FilterSection title="Vehicle type" sleek={sleekRail}>
        {VEHICLE_TYPE_OPTIONS.map((value) => (
          <RadioRow
            key={value}
            name="vehicle-type"
            id={`vehicle-type-${value === "All" ? "all" : value.toLowerCase()}`}
            label={value === "All" ? "All types" : value}
            checked={selectedType === value}
            onChange={() => onTypeChange(value)}
            sleek={sleekRail}
          />
        ))}
      </FilterSection>

      <FilterSection title="Transmission" sleek={sleekRail}>
        {TRANSMISSIONS.map((value) => (
          <RadioRow
            key={value}
            name="transmission"
            id={`transmission-${value === "All" ? "all" : value.toLowerCase()}`}
            label={value === "All" ? "Any" : value}
            checked={selectedTransmission === value}
            onChange={() => onTransmissionChange(value)}
            sleek={sleekRail}
          />
        ))}
      </FilterSection>

      <FilterSection title="Seats" sleek={sleekRail}>
        <SeatsDropdown
          value={selectedSeats}
          onChange={onSeatsChange}
          sleek={sleekRail}
        />
      </FilterSection>

      <FilterSection title="Color" sleek={sleekRail}>
        {colorOptions.map((value) => (
          <RadioRow
            key={value}
            name="color"
            id={`color-${value === "All" ? "all" : value.toLowerCase()}`}
            label={value === "All" ? "Any color" : value}
            checked={selectedColor === value}
            onChange={() => onColorChange(value)}
            sleek={sleekRail}
          />
        ))}
      </FilterSection>
    </div>
  );

  const expandedHeader = collapsibleRail ? (
    <div className="mb-3.5 flex items-center justify-between gap-2">
      <p
        id="vehicle-filters-heading"
        className="text-[13px] font-semibold tracking-[-0.02em] text-slate-800"
      >
        Filters
      </p>
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded="true"
        aria-controls={filterPanelId}
        title="Hide filters"
        className="hidden size-8 items-center justify-center rounded-full border border-slate-200/70 bg-white/90 text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-[color,box-shadow,background-color] hover:border-slate-300/80 hover:bg-white hover:text-slate-800 hover:shadow-[0_2px_6px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]/35 lg:inline-flex"
      >
        <ChevronLeftIcon />
        <span className="sr-only">Hide filters</span>
      </button>
    </div>
  ) : (
    <p className="mb-4 text-sm font-semibold text-slate-900">Filters</p>
  );

  const expandedBody = (
    <>
      {expandedHeader}
      {filterSections}
    </>
  );

  const collapsedStrip = collapsibleRail && (
    <div
      className={joinClasses(
        "hidden flex-col items-center pt-1",
        collapsed ? "lg:flex" : "",
      )}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded="false"
        aria-controls={filterPanelId}
        title="Show filters"
        className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-2 text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]/35 focus-visible:ring-offset-0"
      >
        <CollapsedRailFilterIcon />
        <span className="sr-only">Show filters</span>
      </button>
    </div>
  );

  if (variant === "rail") {
    return (
      <div
        role="complementary"
        aria-label="Refine vehicle results"
        className={joinClasses(surfaceClass, className)}
      >
        {collapsedStrip}
        {collapsibleRail ? (
          <div
            className={joinClasses(
              collapsed ? "max-lg:block lg:hidden" : "",
            )}
          >
            {expandedBody}
          </div>
        ) : (
          expandedBody
        )}
      </div>
    );
  }

  return (
    <aside
      aria-label="Refine vehicle results"
      className={joinClasses(surfaceClass, className)}
    >
      {expandedBody}
    </aside>
  );
}
