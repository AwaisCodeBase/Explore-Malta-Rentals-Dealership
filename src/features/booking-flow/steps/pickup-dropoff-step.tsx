"use client";

import { useTranslations } from "next-intl";
import { StepShell } from "@/features/booking-flow/components/step-shell";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import { isPickupDeliveryAllowedForDate } from "@/lib/booking/delivery-availability";
import { calculateDeliveryFees, formatEur } from "@/lib/pricing/calculate-booking-price";

/** Selection-card treatment shared with the insurance plan options. */
const optionBase =
  "mt-2 flex cursor-pointer items-center gap-3 rounded-[var(--r-card)] border p-3.5 text-sm transition duration-[var(--dur-base)] ease-[var(--ease-standard)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2";
const optionSelected =
  "border-blue-400 bg-blue-50/70 font-semibold text-blue-800 ring-2 ring-blue-500/25 shadow-[var(--elev-2)]";
const optionIdle =
  "border-[var(--line)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)]";
const optionDisabled =
  "cursor-not-allowed border-[var(--line-subtle)] bg-[var(--surface-sunken)] text-[var(--text-faint)]";

const radioClass = "h-4 w-4 shrink-0 accent-[var(--blue-500)] focus:outline-none";

const addressFieldBase =
  "mt-1.5 min-h-20 w-full rounded-[var(--r-field)] border bg-[var(--surface-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] shadow-[var(--elev-1)] outline-none transition duration-[var(--dur-fast)] placeholder:text-[var(--text-faint)]";
const addressFieldIdle =
  "border-[var(--line)] hover:border-[var(--line-strong)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";
const addressFieldError =
  "border-red-400 ring-2 ring-red-500/20 focus:border-red-500 focus:ring-red-500/25";

export function PickupDropoffStep() {
  const t = useTranslations("BookingWizard.pickupDropoff");
  const { state, updateSection, getFieldError, isFieldInvalid } = useBookingFlow();
  const pickupDeliveryBlocked = !isPickupDeliveryAllowedForDate(state.rental.pickupDate);
  const pickupDeliverySelected = state.delivery.pickupOption === "delivery";
  const dropoffDeliverySelected = state.delivery.dropoffOption === "dropoff";
  const pickupAddress = state.delivery.pickupAddress ?? "";
  const dropoffAddress = state.delivery.dropoffAddress ?? "";
  const offSiteQuote = calculateDeliveryFees(
    state.delivery.pickupOption,
    state.delivery.dropoffOption,
  );
  const deliveryOnlyQuote = calculateDeliveryFees("delivery", "office");
  const dropoffOnlyQuote = calculateDeliveryFees("office", "dropoff");
  const bothQuote = calculateDeliveryFees("delivery", "dropoff");

  return (
    <StepShell title={t("shellTitle")} description={t("shellDescription")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="rounded-[var(--r-panel)] border border-[var(--line)] bg-[var(--surface-card)] p-4 shadow-[var(--elev-1)]">
          <legend className="type-spec px-1 text-[var(--text-faint)]">{t("pickupLegend")}</legend>
          <label
            className={`${optionBase} ${
              state.delivery.pickupOption === "office" ? optionSelected : optionIdle
            }`}
          >
            <input
              type="radio"
              name="pickupType"
              data-field="delivery.pickupOption"
              value="office"
              checked={state.delivery.pickupOption === "office"}
              onChange={() => updateSection("delivery", { pickupOption: "office" })}
              className={radioClass}
            />
            {t("officePickup")}
          </label>
          <label
            className={`${optionBase} ${
              pickupDeliveryBlocked
                ? optionDisabled
                : pickupDeliverySelected
                  ? optionSelected
                  : optionIdle
            }`}
          >
            <input
              type="radio"
              name="pickupType"
              data-field="delivery.pickupOption"
              value="delivery"
              checked={state.delivery.pickupOption === "delivery"}
              disabled={pickupDeliveryBlocked}
              onChange={() => updateSection("delivery", { pickupOption: "delivery" })}
              className={`${radioClass} disabled:cursor-not-allowed`}
            />
            {t("requestDelivery")}
          </label>
          {pickupDeliveryBlocked ? (
            <p className="mt-2 rounded-[var(--r-field)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              {t("deliveryUnavailableSunday")}
            </p>
          ) : null}

          {pickupDeliverySelected ? (
            <div className="mt-3 rounded-[var(--r-card)] border border-[var(--line-subtle)] bg-[var(--surface-sunken)] p-3.5">
              <label className="block">
                <span className="type-spec block text-[var(--text-muted)]">
                  {t("pickupAddressLabel")}
                </span>
                <textarea
                  name="delivery.pickupAddress"
                  data-field="delivery.pickupAddress"
                  className={`${addressFieldBase} ${
                    isFieldInvalid("delivery.pickupAddress")
                      ? addressFieldError
                      : addressFieldIdle
                  }`}
                  value={pickupAddress}
                  onChange={(event) =>
                    updateSection("delivery", { pickupAddress: event.target.value })
                  }
                  placeholder={t("addressPlaceholder")}
                />
              </label>
              {getFieldError("delivery.pickupAddress") ? (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {getFieldError("delivery.pickupAddress")}
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                {t("textOnlyNote")}
              </p>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="rounded-[var(--r-panel)] border border-[var(--line)] bg-[var(--surface-card)] p-4 shadow-[var(--elev-1)]">
          <legend className="type-spec px-1 text-[var(--text-faint)]">{t("dropoffLegend")}</legend>
          <label
            className={`${optionBase} ${
              state.delivery.dropoffOption === "office" ? optionSelected : optionIdle
            }`}
          >
            <input
              type="radio"
              name="dropoffType"
              data-field="delivery.dropoffOption"
              value="office"
              checked={state.delivery.dropoffOption === "office"}
              onChange={() => updateSection("delivery", { dropoffOption: "office" })}
              className={radioClass}
            />
            {t("officeReturn")}
          </label>
          <label
            className={`${optionBase} ${dropoffDeliverySelected ? optionSelected : optionIdle}`}
          >
            <input
              type="radio"
              name="dropoffType"
              data-field="delivery.dropoffOption"
              value="dropoff"
              checked={state.delivery.dropoffOption === "dropoff"}
              onChange={() => updateSection("delivery", { dropoffOption: "dropoff" })}
              className={radioClass}
            />
            {t("requestDropoff")}
          </label>

          {dropoffDeliverySelected ? (
            <div className="mt-3 rounded-[var(--r-card)] border border-[var(--line-subtle)] bg-[var(--surface-sunken)] p-3.5">
              <label className="block">
                <span className="type-spec block text-[var(--text-muted)]">
                  {t("dropoffAddressLabel")}
                </span>
                <textarea
                  name="delivery.dropoffAddress"
                  data-field="delivery.dropoffAddress"
                  className={`${addressFieldBase} ${
                    isFieldInvalid("delivery.dropoffAddress")
                      ? addressFieldError
                      : addressFieldIdle
                  }`}
                  value={dropoffAddress}
                  onChange={(event) =>
                    updateSection("delivery", { dropoffAddress: event.target.value })
                  }
                  placeholder={t("addressPlaceholder")}
                />
              </label>
              {getFieldError("delivery.dropoffAddress") ? (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {getFieldError("delivery.dropoffAddress")}
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                {t("textOnlyNote")}
              </p>
            </div>
          ) : null}
        </fieldset>
      </div>

      <div className="mt-4 space-y-1 rounded-[var(--r-card)] border border-orange-200 bg-orange-50 px-4 py-3.5 text-sm tabular-nums text-orange-950">
        <p>{t("deliveryOnly", { amount: formatEur(deliveryOnlyQuote.deliveryTotal) })}</p>
        <p>{t("dropoffOnly", { amount: formatEur(dropoffOnlyQuote.deliveryTotal) })}</p>
        <p className="font-semibold">
          {t("bothLabel", { amount: formatEur(bothQuote.deliveryTotal) })}
          {bothQuote.discount > 0 ? t("youGetOff", { amount: formatEur(bothQuote.discount) }) : ""}
        </p>
        {offSiteQuote.deliveryFee + offSiteQuote.dropoffFee > 0 ? (
          <p className="pt-1 text-xs leading-relaxed text-orange-900">
            {t("currentTotal", {
              total: formatEur(offSiteQuote.deliveryTotal),
              pickup: formatEur(offSiteQuote.deliveryFee),
              dropoff: formatEur(offSiteQuote.dropoffFee),
              discount:
                offSiteQuote.discount > 0
                  ? t("bundleDiscountShort", { amount: formatEur(offSiteQuote.discount) })
                  : "",
            })}
          </p>
        ) : null}
      </div>
    </StepShell>
  );
}
