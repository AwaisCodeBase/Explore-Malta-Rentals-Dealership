"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, HardHat, Package, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DocumentUploadField } from "@/features/booking-flow/components/document-upload-field";
import { InsurancePlanOptions } from "@/features/booking-flow/components/insurance-plan-options";
import { StepShell } from "@/features/booking-flow/components/step-shell";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import { vehicleTypeNeedsHelmetFlow } from "@/features/booking-flow/lib/helmet-rental";
import { useVehicles } from "@/features/vehicles/lib/use-vehicles";
import {
  getAllowedLicenseCategories,
  getLicenseCategoryHint,
  type LicenseCategory,
} from "@/features/booking-flow/lib/license-categories";
import type { InsurancePlanCode } from "@/lib/pricing/insurance-plans";
import { calculateCalendarRentalDays } from "@/lib/pricing/rental-duration";

const fieldBase =
  "mt-1.5 min-h-12 w-full rounded-[var(--r-field)] border bg-[var(--surface-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] shadow-[var(--elev-1)] outline-none transition duration-[var(--dur-fast)] placeholder:text-[var(--text-faint)] disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:text-[var(--text-faint)] disabled:shadow-none";
const fieldIdle =
  "border-[var(--line)] hover:border-[var(--line-strong)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";
const fieldError =
  "border-red-400 ring-2 ring-red-500/20 focus:border-red-500 focus:ring-red-500/25";

function fieldClass(invalid: boolean) {
  return `${fieldBase} ${invalid ? fieldError : fieldIdle}`;
}

const captionClass = "type-spec block text-[var(--text-muted)]";
const errorClass = "mt-1.5 block text-xs font-medium text-red-600";
const popoverContentClass =
  "z-[100] w-[var(--radix-popover-trigger-width)] rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-card)] p-1.5 shadow-[var(--elev-4)]";
const popoverOptionBase =
  "flex w-full items-center justify-between gap-2 rounded-[var(--r-field)] px-3 py-2.5 text-left text-sm transition duration-[var(--dur-fast)]";
const popoverOptionSelected = "bg-blue-50 font-semibold text-blue-800";
const popoverOptionIdle =
  "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]";
const addonCardClass =
  "rounded-[var(--r-panel)] border border-[var(--line)] bg-[var(--surface-card)] p-4 shadow-[var(--elev-1)] transition duration-[var(--dur-base)] ease-[var(--ease-standard)] sm:p-5";
const addonIconClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)]";
const addonIconActiveClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700";

export function AddonsStep() {
  const t = useTranslations("BookingWizard.addons");
  const tCust = useTranslations("BookingWizard.customer");
  const tSteps = useTranslations("BookingSteps.addons");
  const helmetSizeOptions = useMemo(
    () =>
      [
        { value: "", label: t("selectSize") },
        { value: "S", label: "S" },
        { value: "M", label: "M" },
        { value: "L", label: "L" },
      ] as const,
    [t],
  );
  const licenseCategoryOptions = useMemo(
    () =>
      [
        { value: "", label: t("selectCategory") },
        { value: "B", label: "B" },
        { value: "AM", label: "AM" },
        { value: "A", label: "A" },
        { value: "A1", label: "A1" },
        { value: "A2", label: "A2" },
      ] as const,
    [t],
  );

  const { state, updateSection, getFieldError, isFieldInvalid, bookingSessionId } = useBookingFlow();
  const { vehicles } = useVehicles();
  const selectedVehicle = useMemo(() => {
    if (!state.rental.vehicleId) {
      return null;
    }
    return vehicles.find((vehicle) => vehicle.id === state.rental.vehicleId) ?? null;
  }, [state.rental.vehicleId, vehicles]);
  const supportsStorageBox = selectedVehicle?.supportsStorageBox === true;
  const [licenseMenuOpen, setLicenseMenuOpen] = useState(false);
  const [helmetSize1MenuOpen, setHelmetSize1MenuOpen] = useState(false);
  const [helmetSize2MenuOpen, setHelmetSize2MenuOpen] = useState(false);
  const helmetEnabled = state.addons.helmet;
  const supportsHelmet = vehicleTypeNeedsHelmetFlow(state.rental.vehicleType);

  const rentalDays = useMemo(
    () => calculateCalendarRentalDays(state.rental.pickupDate, state.rental.returnDate),
    [state.rental.pickupDate, state.rental.returnDate],
  );

  const selectedLicenseCategoryOption =
    licenseCategoryOptions.find(
      (option) => option.value === state.additionalDriver.licenseCategory,
    ) ?? licenseCategoryOptions[0];
  const allowedLicenseOptions = getAllowedLicenseCategories(
    state.rental.vehicleType,
    state.rental.vehicleId,
    state.rental.engineCc,
  );
  const allowedLicenseCategoryOptions = licenseCategoryOptions.filter(
    (option) =>
      option.value === "" || allowedLicenseOptions.includes(option.value as LicenseCategory),
  );
  const licenseCategoryHint = getLicenseCategoryHint(state.rental.vehicleType, state.rental.engineCc);
  const selectedHelmetSize1Option =
    helmetSizeOptions.find((option) => option.value === state.addons.helmetSize1) ??
    helmetSizeOptions[0];
  const selectedHelmetSize2Option =
    helmetSizeOptions.find((option) => option.value === state.addons.helmetSize2) ??
    helmetSizeOptions[0];

  useEffect(() => {
    if (supportsHelmet) {
      if (!state.addons.helmet) {
        updateSection("addons", { helmet: true });
      }
      return;
    }

    if (state.addons.helmet || state.addons.helmetSize1 || state.addons.helmetSize2) {
      updateSection("addons", {
        helmet: false,
        helmetSize1: "",
        helmetSize2: "",
      });
    }
  }, [
    state.addons.helmet,
    state.addons.helmetSize1,
    state.addons.helmetSize2,
    supportsHelmet,
    updateSection,
  ]);

  useEffect(() => {
    if (
      state.additionalDriver.licenseCategory &&
      !allowedLicenseOptions.includes(state.additionalDriver.licenseCategory as LicenseCategory)
    ) {
      updateSection("additionalDriver", { licenseCategory: "" });
    }
  }, [
    allowedLicenseOptions,
    state.additionalDriver.licenseCategory,
    updateSection,
  ]);

  useEffect(() => {
    if (state.delivery.pickupOption === "office" && state.additionalDriver.passportIdUpload) {
      updateSection("additionalDriver", { passportIdUpload: "" });
    }
  }, [state.delivery.pickupOption, state.additionalDriver.passportIdUpload, updateSection]);

  useEffect(() => {
    if (!supportsStorageBox && state.addons.storageBox) {
      updateSection("addons", { storageBox: false });
    }
  }, [supportsStorageBox, state.addons.storageBox, updateSection]);

  function handleInsuranceSelect(plan: InsurancePlanCode) {
    updateSection("addons", {
      cdwPlan: plan,
      cdw: plan !== "NO_INSURANCE",
    });
  }

  const additionalDriverSelected = state.addons.additionalDriver;

  return (
    <StepShell title={tSteps("title")} description={tSteps("description")}>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* ── Helmets ───────────────────────────────────────────────────── */}
        <div
          className={`${addonCardClass} ${
            supportsHelmet ? "border-blue-200 bg-blue-50/40" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <span className={supportsHelmet ? addonIconActiveClass : addonIconClass} aria-hidden>
              <HardHat className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={supportsHelmet}
                  readOnly
                  disabled
                  className="h-4 w-4 shrink-0 rounded-sm accent-[var(--blue-500)] disabled:cursor-not-allowed"
                />
                {t("helmetLabel")}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                {t("helmetIncludedNote")}
              </p>
            </div>
          </div>

          {supportsHelmet && helmetEnabled ? (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className={captionClass}>{t("helmetSize1")}</span>
                <Popover.Root open={helmetSize1MenuOpen} onOpenChange={setHelmetSize1MenuOpen}>
                  <Popover.Trigger asChild>
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      data-field="addons.helmetSize1"
                      className={`${fieldClass(isFieldInvalid("addons.helmetSize1"))} flex items-center justify-between text-left`}
                    >
                      <span>{selectedHelmetSize1Option.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[var(--text-faint)] transition-transform duration-[var(--dur-fast)] ${
                          helmetSize1MenuOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      side="bottom"
                      align="start"
                      sideOffset={6}
                      className={popoverContentClass}
                    >
                      <div role="listbox" className="max-h-64 overflow-y-auto">
                        {helmetSizeOptions.map((option) => {
                          const selected = option.value === state.addons.helmetSize1;
                          return (
                            <button
                              key={option.label}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              className={`${popoverOptionBase} ${
                                selected ? popoverOptionSelected : popoverOptionIdle
                              }`}
                              onClick={() => {
                                updateSection("addons", { helmetSize1: option.value });
                                setHelmetSize1MenuOpen(false);
                              }}
                            >
                              {option.label}
                              {selected ? (
                                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </label>
              {getFieldError("addons.helmetSize1") ? (
                <p className="text-xs font-medium text-red-600">
                  {getFieldError("addons.helmetSize1")}
                </p>
              ) : null}
              <label className="block">
                <span className={captionClass}>{t("helmetSize2")}</span>
                <Popover.Root open={helmetSize2MenuOpen} onOpenChange={setHelmetSize2MenuOpen}>
                  <Popover.Trigger asChild>
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      data-field="addons.helmetSize2"
                      className={`${fieldClass(isFieldInvalid("addons.helmetSize2"))} flex items-center justify-between text-left`}
                    >
                      <span>{selectedHelmetSize2Option.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[var(--text-faint)] transition-transform duration-[var(--dur-fast)] ${
                          helmetSize2MenuOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      side="bottom"
                      align="start"
                      sideOffset={6}
                      className={popoverContentClass}
                    >
                      <div role="listbox" className="max-h-64 overflow-y-auto">
                        {helmetSizeOptions.map((option) => {
                          const selected = option.value === state.addons.helmetSize2;
                          return (
                            <button
                              key={option.label}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              className={`${popoverOptionBase} ${
                                selected ? popoverOptionSelected : popoverOptionIdle
                              }`}
                              onClick={() => {
                                updateSection("addons", { helmetSize2: option.value });
                                setHelmetSize2MenuOpen(false);
                              }}
                            >
                              {option.label}
                              {selected ? (
                                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </label>
              {getFieldError("addons.helmetSize2") ? (
                <p className="text-xs font-medium text-red-600">
                  {getFieldError("addons.helmetSize2")}
                </p>
              ) : null}
            </div>
          ) : supportsHelmet ? (
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              {t("helmetAutoIncluded")}
            </p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              {t("helmetOnlyMotorbikeAtv")}
            </p>
          )}
        </div>

        {/* ── Additional driver ─────────────────────────────────────────── */}
        <div
          className={`${addonCardClass} ${
            additionalDriverSelected
              ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-[var(--elev-2)]"
              : "hover:border-[var(--line-strong)]"
          }`}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <span
              className={additionalDriverSelected ? addonIconActiveClass : addonIconClass}
              aria-hidden
            >
              <UserPlus className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={state.addons.additionalDriver}
                onChange={(event) =>
                  updateSection("addons", { additionalDriver: event.target.checked })
                }
                className="h-4 w-4 shrink-0 rounded-sm accent-[var(--blue-500)]"
              />
              {t("additionalDriver")}
            </span>
          </label>

          {state.addons.additionalDriver ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={captionClass}>{tCust("fullName")}</span>
                  <input
                    type="text"
                    name="additionalDriver.fullName"
                    data-field="additionalDriver.fullName"
                    value={state.additionalDriver.fullName}
                    onChange={(event) =>
                      updateSection("additionalDriver", { fullName: event.target.value })
                    }
                    className={fieldClass(isFieldInvalid("additionalDriver.fullName"))}
                  />
                  {getFieldError("additionalDriver.fullName") ? (
                    <span className={errorClass}>{getFieldError("additionalDriver.fullName")}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={captionClass}>{tCust("phone")}</span>
                  <input
                    type="tel"
                    name="additionalDriver.phone"
                    data-field="additionalDriver.phone"
                    value={state.additionalDriver.phone}
                    onChange={(event) =>
                      updateSection("additionalDriver", { phone: event.target.value })
                    }
                    className={fieldClass(isFieldInvalid("additionalDriver.phone"))}
                  />
                  {getFieldError("additionalDriver.phone") ? (
                    <span className={errorClass}>{getFieldError("additionalDriver.phone")}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={captionClass}>{tCust("email")}</span>
                  <input
                    type="email"
                    name="additionalDriver.email"
                    data-field="additionalDriver.email"
                    value={state.additionalDriver.email}
                    onChange={(event) =>
                      updateSection("additionalDriver", { email: event.target.value })
                    }
                    className={fieldClass(isFieldInvalid("additionalDriver.email"))}
                    suppressHydrationWarning
                  />
                  {getFieldError("additionalDriver.email") ? (
                    <span className={errorClass}>{getFieldError("additionalDriver.email")}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={captionClass}>{tCust("nationality")}</span>
                  <input
                    type="text"
                    name="additionalDriver.nationality"
                    data-field="additionalDriver.nationality"
                    value={state.additionalDriver.nationality}
                    onChange={(event) =>
                      updateSection("additionalDriver", { nationality: event.target.value })
                    }
                    className={fieldClass(isFieldInvalid("additionalDriver.nationality"))}
                  />
                  {getFieldError("additionalDriver.nationality") ? (
                    <span className={errorClass}>
                      {getFieldError("additionalDriver.nationality")}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={captionClass}>{tCust("dateOfBirth")}</span>
                  <input
                    type="date"
                    name="additionalDriver.dateOfBirth"
                    data-field="additionalDriver.dateOfBirth"
                    value={state.additionalDriver.dateOfBirth}
                    onChange={(event) =>
                      updateSection("additionalDriver", { dateOfBirth: event.target.value })
                    }
                    className={`${fieldClass(isFieldInvalid("additionalDriver.dateOfBirth"))} tabular-nums`}
                  />
                  {getFieldError("additionalDriver.dateOfBirth") ? (
                    <span className={errorClass}>
                      {getFieldError("additionalDriver.dateOfBirth")}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={captionClass}>{tCust("licenseCategory")}</span>
                  <Popover.Root open={licenseMenuOpen} onOpenChange={setLicenseMenuOpen}>
                    <Popover.Trigger asChild>
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        className={`${fieldClass(isFieldInvalid("additionalDriver.licenseCategory"))} flex items-center justify-between text-left`}
                      >
                        <span>{selectedLicenseCategoryOption.label}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[var(--text-faint)] transition-transform duration-[var(--dur-fast)] ${
                            licenseMenuOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        side="bottom"
                        align="start"
                        sideOffset={6}
                        className={popoverContentClass}
                      >
                        <div role="listbox" className="max-h-64 overflow-y-auto">
                          {allowedLicenseCategoryOptions.map((option) => {
                            const selected = option.value === state.additionalDriver.licenseCategory;
                            return (
                              <button
                                key={option.label}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                className={`${popoverOptionBase} ${
                                  selected ? popoverOptionSelected : popoverOptionIdle
                                }`}
                                onClick={() => {
                                  updateSection("additionalDriver", {
                                    licenseCategory: option.value,
                                  });
                                  setLicenseMenuOpen(false);
                                }}
                              >
                                {option.label}
                                {selected ? (
                                  <Check
                                    className="h-3.5 w-3.5 shrink-0"
                                    strokeWidth={3}
                                    aria-hidden
                                  />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                    {licenseCategoryHint}
                  </p>
                  {getFieldError("additionalDriver.licenseCategory") ? (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {getFieldError("additionalDriver.licenseCategory")}
                    </p>
                  ) : null}
                </label>
              </div>

              <div className="rounded-[var(--r-card)] border border-[var(--line-subtle)] bg-[var(--surface-sunken)] p-3.5">
                <p className="type-spec text-[var(--text-muted)]">{t("addDriverIdHeading")}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {t("addDriverIdBody")}
                </p>
                {state.delivery.pickupOption === "delivery" ? (
                  <div className="mt-3">
                    <DocumentUploadField
                      label={t("passportUploadLabel")}
                      description={t("passportUploadDesc")}
                      category="additional_driver_passport"
                      bookingSessionId={bookingSessionId}
                      value={state.additionalDriver.passportIdUpload}
                      onPathChange={(relativePath) =>
                        updateSection("additionalDriver", { passportIdUpload: relativePath })
                      }
                      name="additionalDriver.passportIdUpload"
                      data-field="additionalDriver.passportIdUpload"
                    />
                    {getFieldError("additionalDriver.passportIdUpload") ? (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {getFieldError("additionalDriver.passportIdUpload")}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--text-secondary)] transition duration-[var(--dur-fast)] hover:border-[var(--line-strong)] has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2">
                    <input
                      type="checkbox"
                      name="additionalDriver.officeIdConfirmed"
                      data-field="additionalDriver.officeIdConfirmed"
                      checked={state.additionalDriver.officeIdConfirmed}
                      onChange={(event) =>
                        updateSection("additionalDriver", { officeIdConfirmed: event.target.checked })
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-sm accent-[var(--blue-500)] focus:outline-none"
                    />
                    {t("addDriverOfficeConfirm")}
                  </label>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Insurance ───────────────────────────────────────────────────── */}
      <div className={`${addonCardClass} mt-3`}>
        <div className="flex items-start gap-3">
          <span className={addonIconActiveClass} aria-hidden>
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              {t("insuranceTitle")}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {t("insuranceIntro")}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <InsurancePlanOptions
            selectedPlan={state.addons.cdwPlan}
            rentalDays={rentalDays}
            onSelect={handleInsuranceSelect}
            name="addonsInsurancePlan"
          />
        </div>
        <hr className="rule-fade mt-5" />
        <p className="type-spec mt-4 text-[var(--text-muted)]">{t("cdwExclusionsTitle")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-[var(--text-secondary)] marker:text-[var(--orange-400)]">
          <li>{t("cdwEx3")}</li>
          <li>{t("cdwEx4")}</li>
          <li>{t("cdwEx5")}</li>
          <li>{t("cdwEx6")}</li>
          <li>{t("cdwEx7")}</li>
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-faint)]">
          {t("insuranceExclusionsNote")}
        </p>
      </div>

      {/* ── Extra equipment ─────────────────────────────────────────────── */}
      {supportsStorageBox ? (
        <div
          className={`${addonCardClass} mt-3 ${
            state.addons.storageBox
              ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-[var(--elev-2)]"
              : "hover:border-[var(--line-strong)]"
          }`}
        >
          <p className="type-spec text-[var(--text-muted)]">{t("extraEquipment")}</p>
          <label className="mt-3 flex cursor-pointer items-center gap-3">
            <span
              className={state.addons.storageBox ? addonIconActiveClass : addonIconClass}
              aria-hidden
            >
              <Package className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={state.addons.storageBox}
                onChange={(event) => updateSection("addons", { storageBox: event.target.checked })}
                className="h-4 w-4 shrink-0 rounded-sm accent-[var(--blue-500)]"
              />
              {t("storageBoxLabel")}
            </span>
          </label>
        </div>
      ) : null}
    </StepShell>
  );
}
