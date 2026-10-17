"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DocumentUploadField } from "@/features/booking-flow/components/document-upload-field";
import { StepShell } from "@/features/booking-flow/components/step-shell";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import {
  getAllowedLicenseCategories,
  getLicenseCategoryHint,
  type LicenseCategory,
} from "@/features/booking-flow/lib/license-categories";

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

export function CustomerDetailsStep() {
  const t = useTranslations("BookingWizard.customer");
  const { state, updateSection, getFieldError, isFieldInvalid, bookingSessionId } = useBookingFlow();
  const [licenseMenuOpen, setLicenseMenuOpen] = useState(false);
  const requiresUploads = state.delivery.pickupOption === "delivery";
  const allowedLicenseOptions = getAllowedLicenseCategories(
    state.rental.vehicleType,
    state.rental.vehicleId,
    state.rental.engineCc,
  );
  const licenseCategoryHint = getLicenseCategoryHint(state.rental.vehicleType, state.rental.engineCc);
  const licenseCategoryOptions = [
    { value: "", label: t("selectCategory") },
    ...allowedLicenseOptions.map((option) => ({ value: option, label: option })),
  ] as const;
  const selectedLicenseCategoryOption =
    licenseCategoryOptions.find((option) => option.value === state.customer.licenseCategory) ??
    licenseCategoryOptions[0];

  useEffect(() => {
    if (
      state.customer.licenseCategory &&
      !allowedLicenseOptions.includes(state.customer.licenseCategory as LicenseCategory)
    ) {
      updateSection("customer", { licenseCategory: "" });
    }
  }, [allowedLicenseOptions, state.customer.licenseCategory, updateSection]);

  useEffect(() => {
    if (!requiresUploads && (state.customer.driverLicenseUpload || state.customer.passportUpload)) {
      updateSection("customer", { driverLicenseUpload: "", passportUpload: "" });
    }
  }, [requiresUploads, state.customer.driverLicenseUpload, state.customer.passportUpload, updateSection]);

  return (
    <StepShell title={t("shellTitle")} description={t("shellDescription")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <p className="type-spec sm:col-span-2 text-[var(--text-faint)]">{t("lead")}</p>
        <label className="block">
          <span className={captionClass}>{t("fullName")}</span>
          <input
            type="text"
            name="customer.fullName"
            data-field="customer.fullName"
            value={state.customer.fullName}
            onChange={(event) => updateSection("customer", { fullName: event.target.value })}
            className={fieldClass(isFieldInvalid("customer.fullName"))}
            placeholder={t("fullNamePh")}
          />
          {getFieldError("customer.fullName") ? (
            <span className={errorClass}>{getFieldError("customer.fullName")}</span>
          ) : null}
        </label>

        <label className="block">
          <span className={captionClass}>{t("phone")}</span>
          <input
            type="tel"
            name="customer.phone"
            data-field="customer.phone"
            value={state.customer.phone}
            onChange={(event) => updateSection("customer", { phone: event.target.value })}
            className={fieldClass(isFieldInvalid("customer.phone"))}
            placeholder={t("phonePh")}
          />
          {getFieldError("customer.phone") ? (
            <span className={errorClass}>{getFieldError("customer.phone")}</span>
          ) : null}
        </label>

        <label className="block">
          <span className={captionClass}>{t("email")}</span>
          <input
            type="email"
            name="customer.email"
            data-field="customer.email"
            value={state.customer.email}
            onChange={(event) => updateSection("customer", { email: event.target.value })}
            className={fieldClass(isFieldInvalid("customer.email"))}
            placeholder={t("emailPh")}
            suppressHydrationWarning
          />
          {getFieldError("customer.email") ? (
            <span className={errorClass}>{getFieldError("customer.email")}</span>
          ) : null}
        </label>

        <label className="block">
          <span className={captionClass}>{t("nationality")}</span>
          <input
            type="text"
            name="customer.nationality"
            data-field="customer.nationality"
            value={state.customer.nationality}
            onChange={(event) => updateSection("customer", { nationality: event.target.value })}
            className={fieldClass(isFieldInvalid("customer.nationality"))}
            placeholder={t("nationalityPh")}
          />
          {getFieldError("customer.nationality") ? (
            <span className={errorClass}>{getFieldError("customer.nationality")}</span>
          ) : null}
        </label>

        <label className="block">
          <span className={captionClass}>{t("dateOfBirth")}</span>
          <input
            type="date"
            name="customer.dateOfBirth"
            data-field="customer.dateOfBirth"
            value={state.customer.dateOfBirth}
            onChange={(event) => updateSection("customer", { dateOfBirth: event.target.value })}
            className={`${fieldClass(isFieldInvalid("customer.dateOfBirth"))} tabular-nums`}
          />
          {getFieldError("customer.dateOfBirth") ? (
            <span className={errorClass}>{getFieldError("customer.dateOfBirth")}</span>
          ) : null}
        </label>

        <label className="block">
          <span className={captionClass}>{t("licenseCategory")}</span>
          <Popover.Root open={licenseMenuOpen} onOpenChange={setLicenseMenuOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-haspopup="listbox"
                className={`${fieldClass(isFieldInvalid("customer.licenseCategory"))} flex items-center justify-between text-left`}
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
                  {licenseCategoryOptions.map((option) => {
                    const selected = option.value === state.customer.licenseCategory;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`flex w-full items-center justify-between gap-2 rounded-[var(--r-field)] px-3 py-2.5 text-left text-sm transition duration-[var(--dur-fast)] ${
                          selected
                            ? "bg-blue-50 font-semibold text-blue-800"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                        }`}
                        onClick={() => {
                          updateSection("customer", {
                            licenseCategory: option.value as "" | LicenseCategory,
                          });
                          setLicenseMenuOpen(false);
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
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
            {licenseCategoryHint}
          </p>
          {getFieldError("customer.licenseCategory") ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {getFieldError("customer.licenseCategory")}
            </p>
          ) : null}
        </label>
      </div>

      <div className="surface-card mt-4 p-4 sm:p-5">
        <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {t("licenseHeading")}
        </p>
        <p className="mt-1 pb-3 text-xs leading-relaxed text-[var(--text-secondary)]">
          {t("pickupContext")}{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            {requiresUploads ? t("requestDelivery") : t("collectFromOffice")}
          </span>
          .
        </p>
        <hr className="rule-fade" />
        <div className="mt-3">
          <span
            className={`flex items-center gap-2.5 text-sm font-medium ${
              requiresUploads ? "text-[var(--text-primary)]" : "text-[var(--text-faint)]"
            }`}
          >
            <input
              type="radio"
              checked={requiresUploads}
              readOnly
              className="h-4 w-4 shrink-0 accent-[var(--blue-500)]"
            />
            {t("deliveryLicenseUpload")}
          </span>
          <div className={`mt-2.5 ${!requiresUploads ? "pointer-events-none opacity-50" : ""}`}>
            <DocumentUploadField
              label={t("driversLicenceLabel")}
              category="customer_license"
              bookingSessionId={bookingSessionId}
              value={state.customer.driverLicenseUpload}
              onPathChange={(relativePath) => updateSection("customer", { driverLicenseUpload: relativePath })}
              disabled={!requiresUploads}
              name="customer.driverLicenseUpload"
              data-field="customer.driverLicenseUpload"
            />
          </div>
          {getFieldError("customer.driverLicenseUpload") ? (
            <span className={errorClass}>{getFieldError("customer.driverLicenseUpload")}</span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-1.5 border-t border-[var(--line-subtle)] pt-4 text-sm text-[var(--text-primary)]">
          <span className="flex items-center gap-2.5">
            <input
              type="radio"
              checked={!requiresUploads}
              readOnly
              className="h-4 w-4 shrink-0 accent-[var(--blue-500)]"
            />
            <span className="font-medium">{t("officeLicenseConfirm")}</span>
          </span>
          <label
            htmlFor="customer-license-confirmation"
            className="flex cursor-pointer items-center gap-2.5 pl-7"
          >
            <input
              id="customer-license-confirmation"
              type="checkbox"
              checked={state.customer.licenseConfirmationCheckbox}
              name="customer.licenseConfirmationCheckbox"
              data-field="customer.licenseConfirmationCheckbox"
              disabled={requiresUploads}
              onChange={(event) =>
                updateSection("customer", { licenseConfirmationCheckbox: event.target.checked })
              }
              className="h-4 w-4 shrink-0 rounded-sm accent-[var(--blue-500)] disabled:cursor-not-allowed"
            />
            <span
              className={
                requiresUploads ? "text-[var(--text-faint)]" : "text-[var(--text-secondary)]"
              }
            >
              {t("confirmPresentLicense")}
            </span>
          </label>
        </div>
      </div>

      <div className="surface-card mt-4 p-4 sm:p-5">
        <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {t("passportHeading")}
        </p>
        <p className="mt-1 pb-3 text-xs leading-relaxed text-[var(--text-secondary)]">
          {t("pickupContext")}{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            {requiresUploads ? t("requestDelivery") : t("collectFromOffice")}
          </span>
          .
        </p>
        <hr className="rule-fade" />
        <div className="mt-3">
          <span
            className={`flex items-center gap-2.5 text-sm font-medium ${
              requiresUploads ? "text-[var(--text-primary)]" : "text-[var(--text-faint)]"
            }`}
          >
            <input
              type="radio"
              checked={requiresUploads}
              readOnly
              className="h-4 w-4 shrink-0 accent-[var(--blue-500)]"
            />
            {t("deliveryPassportUpload")}
          </span>
          <div className={`mt-2.5 ${!requiresUploads ? "pointer-events-none opacity-50" : ""}`}>
            <DocumentUploadField
              label={t("passportNationalIdLabel")}
              category="customer_passport"
              bookingSessionId={bookingSessionId}
              value={state.customer.passportUpload}
              onPathChange={(relativePath) => updateSection("customer", { passportUpload: relativePath })}
              disabled={!requiresUploads}
              name="customer.passportUpload"
              data-field="customer.passportUpload"
            />
          </div>
          {getFieldError("customer.passportUpload") ? (
            <span className={errorClass}>{getFieldError("customer.passportUpload")}</span>
          ) : null}
        </div>
        <div className="mt-4 flex flex-col gap-1.5 border-t border-[var(--line-subtle)] pt-4 text-sm text-[var(--text-primary)]">
          <span className="flex items-center gap-2.5">
            <input
              type="radio"
              checked={!requiresUploads}
              readOnly
              className="h-4 w-4 shrink-0 accent-[var(--blue-500)]"
            />
            <span className="font-medium">{t("officePassportConfirm")}</span>
          </span>
          <label
            htmlFor="customer-passport-confirmation"
            className="flex cursor-pointer items-center gap-2.5 pl-7"
          >
            <input
              id="customer-passport-confirmation"
              type="checkbox"
              checked={state.customer.idConfirmationCheckbox}
              name="customer.idConfirmationCheckbox"
              data-field="customer.idConfirmationCheckbox"
              disabled={requiresUploads}
              onChange={(event) =>
                updateSection("customer", { idConfirmationCheckbox: event.target.checked })
              }
              className="h-4 w-4 shrink-0 rounded-sm accent-[var(--blue-500)] disabled:cursor-not-allowed"
            />
            <span
              className={
                requiresUploads ? "text-[var(--text-faint)]" : "text-[var(--text-secondary)]"
              }
            >
              {t("confirmPresentId")}
            </span>
          </label>
        </div>
      </div>

      <div className="mt-4">
        <label className="block">
          <span className={captionClass}>{t("specialNotes")}</span>
          <textarea
            value={state.customer.specialNotes}
            onChange={(event) => updateSection("customer", { specialNotes: event.target.value })}
            rows={4}
            placeholder={t("specialNotesPlaceholder")}
            className={`${fieldClass(false)} min-h-24 leading-relaxed`}
          />
        </label>
      </div>
    </StepShell>
  );
}
