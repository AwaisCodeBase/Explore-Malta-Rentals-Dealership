import type { ReactNode } from "react";

import { getTranslations } from "next-intl/server";

import { buildAdminBookingPriceBuildup } from "@/lib/admin/bookings/build-admin-booking-price-buildup";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { formatMaltaDateTime } from "@/lib/format-malta-datetime";

type AdminBookingPriceBuildupProps = Readonly<{
  locale: string;
  booking: AdminBookingDetail;
}>;

function formatEur(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value}%`;
}

function formatSignedEur(amount: number, negative = false): string {
  const formatted = formatEur(Math.abs(amount));
  if (negative && amount > 0) {
    return `−${formatted}`;
  }
  return formatted;
}

function BuildupSubsection({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h4>
      <dl className="mt-3 space-y-0">{children}</dl>
    </div>
  );
}

function BuildupRow({
  label,
  value,
  emphasis = false,
  muted = false,
}: Readonly<{
  label: ReactNode;
  value: ReactNode;
  emphasis?: boolean;
  muted?: boolean;
}>) {
  return (
    <div
      className={[
        "flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-slate-200/70 py-2 last:border-0",
        emphasis ? "font-semibold text-slate-900" : "",
        muted ? "text-slate-500" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <dt className="text-sm">{label}</dt>
      <dd className="text-right text-sm tabular-nums">{value}</dd>
    </div>
  );
}

function FormulaLabel({
  label,
  formula,
}: Readonly<{ label: string; formula: string }>) {
  return (
    <span>
      {label}
      <span className="mt-0.5 block text-xs font-normal text-slate-400">{formula}</span>
    </span>
  );
}

export async function AdminBookingPriceBuildup({ locale, booking }: AdminBookingPriceBuildupProps) {
  const t = await getTranslations({ locale, namespace: "Admin.bookings" });
  const buildup = buildAdminBookingPriceBuildup(booking);

  const formatYesNo = (value: boolean) => (value ? t("details.yes") : t("details.no"));

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {t("details.sections.priceBuildup")}
      </h3>
      <p className="mt-1 text-xs text-slate-500">{t("details.priceBuildup.snapshotNote")}</p>

      <div className="mt-4 space-y-4">
        <BuildupSubsection title={t("details.priceBuildup.rentalTitle")}>
          <BuildupRow
            label={t("details.fields.baseDailyRateSnapshot")}
            value={formatEur(buildup.rental.baseDailyRate)}
          />
          <BuildupRow
            label={t("details.fields.billableDays")}
            value={buildup.rental.billableDays}
          />
          {buildup.rental.originalRentalBeforeDiscount !== null ? (
            <BuildupRow
              label={
                <FormulaLabel
                  label={t("details.priceBuildup.originalRental")}
                  formula={t("details.priceBuildup.originalRentalFormula", {
                    rate: formatEur(buildup.rental.baseDailyRate),
                    days: buildup.rental.billableDays,
                  })}
                />
              }
              value={formatEur(buildup.rental.originalRentalBeforeDiscount)}
            />
          ) : null}
          {buildup.rental.durationDiscountPercent !== null &&
          buildup.rental.durationDiscountPercent > 0 ? (
            <BuildupRow
              label={t("details.priceBuildup.durationDiscountLine", {
                percent: formatPercent(buildup.rental.durationDiscountPercent),
              })}
              value={formatSignedEur(buildup.rental.durationDiscountAmount ?? 0, true)}
              muted
            />
          ) : null}
          <BuildupRow
            label={t("details.fields.appliedDailyRateSnapshot")}
            value={formatEur(buildup.rental.appliedDailyRate)}
          />
          <BuildupRow
            emphasis
            label={
              <FormulaLabel
                label={t("details.fields.rentalCost")}
                formula={t("details.priceBuildup.rentalSubtotalFormula", {
                  rate: formatEur(buildup.rental.appliedDailyRate),
                  days: buildup.rental.billableDays,
                })}
              />
            }
            value={formatEur(buildup.rental.rentalSubtotal)}
          />
        </BuildupSubsection>

        {buildup.hotel.used ? (
          <BuildupSubsection title={t("details.priceBuildup.hotelTitle")}>
            <BuildupRow label={t("details.fields.hotelCode")} value={buildup.hotel.hotelCode ?? "—"} />
            {buildup.hotel.hotelName ? (
              <BuildupRow label={t("details.fields.hotelName")} value={buildup.hotel.hotelName} />
            ) : null}
            <BuildupRow
              label={t("details.fields.rentalCost")}
              value={formatEur(booking.rentalCost)}
            />
            <BuildupRow
              label={t("details.priceBuildup.hotelDiscountLine", {
                percent: formatPercent(buildup.hotel.discountPercent),
              })}
              value={formatSignedEur(buildup.hotel.discountAmount ?? 0, true)}
              muted
            />
            <BuildupRow
              emphasis
              label={t("details.fields.subtotalAfterHotelDiscountSnapshot")}
              value={formatEur(buildup.hotel.rentalAfterHotelDiscount)}
            />
          </BuildupSubsection>
        ) : null}

        <BuildupSubsection title={t("details.priceBuildup.deliveryTitle")}>
          <BuildupRow label={t("details.fields.deliveryFee")} value={formatEur(buildup.delivery.pickupFee)} />
          <BuildupRow label={t("details.fields.dropoffFee")} value={formatEur(buildup.delivery.dropoffFee)} />
          {buildup.delivery.hasAdjustment ? (
            <>
              <BuildupRow
                label={t("details.priceBuildup.combinedSubtotal")}
                value={formatEur(buildup.delivery.combinedBeforeAdjustment)}
              />
              <BuildupRow
                label={t("details.priceBuildup.bundleDiscount")}
                value={formatSignedEur(buildup.delivery.adjustment, true)}
                muted
              />
            </>
          ) : null}
          <BuildupRow
            emphasis
            label={t("details.fields.deliveryTotal")}
            value={formatEur(buildup.delivery.deliveryTotal)}
          />
        </BuildupSubsection>

        <BuildupSubsection title={t("details.priceBuildup.cdwTitle")}>
          <BuildupRow label={t("details.fields.cdwOption")} value={buildup.cdw.optionLabel} />
          <BuildupRow label={t("details.fields.cdwDailyRate")} value={formatEur(buildup.cdw.dailyRate)} />
          <BuildupRow label={t("details.fields.billableDays")} value={buildup.cdw.billableDays} />
          <BuildupRow
            emphasis
            label={
              <FormulaLabel
                label={t("details.fields.cdwTotal")}
                formula={t("details.priceBuildup.cdwTotalFormula", {
                  rate: formatEur(buildup.cdw.dailyRate),
                  days: buildup.cdw.billableDays,
                })}
              />
            }
            value={formatEur(buildup.cdw.total)}
          />
        </BuildupSubsection>

        <BuildupSubsection title={t("details.priceBuildup.addonsTitle")}>
          <BuildupRow
            label={t("details.fields.additionalDriverEnabled")}
            value={formatYesNo(buildup.addons.additionalDriverEnabled)}
          />
          <BuildupRow
            label={t("details.fields.additionalDriverTotal")}
            value={formatEur(buildup.addons.additionalDriverTotal)}
          />
          <BuildupRow
            label={t("details.fields.storageBoxSelected")}
            value={formatYesNo(buildup.addons.storageBoxSelected)}
          />
          <BuildupRow
            label={t("details.fields.storageBoxCost")}
            value={
              buildup.addons.storageBoxSelected
                ? formatEur(buildup.addons.storageBoxCost)
                : formatEur(0)
            }
          />
        </BuildupSubsection>

        <BuildupSubsection title={t("details.priceBuildup.subtotalTitle")}>
          <BuildupRow
            label={
              buildup.hotel.used
                ? t("details.fields.subtotalAfterHotelDiscountSnapshot")
                : t("details.priceBuildup.rentalLineForSubtotal")
            }
            value={formatEur(buildup.subtotal.rentalAfterHotelDiscount)}
          />
          <BuildupRow
            label={t("details.priceBuildup.plusDeliveryTotal")}
            value={formatEur(buildup.subtotal.deliveryTotal)}
          />
          <BuildupRow
            label={t("details.priceBuildup.plusCdwTotal")}
            value={formatEur(buildup.subtotal.cdwTotal)}
          />
          <BuildupRow
            label={t("details.priceBuildup.plusAdditionalDriver")}
            value={formatEur(buildup.subtotal.additionalDriverTotal)}
          />
          <BuildupRow
            label={t("details.priceBuildup.plusStorageBox")}
            value={formatEur(buildup.subtotal.storageBoxCost)}
          />
          <BuildupRow
            emphasis
            label={
              <FormulaLabel
                label={t("details.fields.bookingChargesTotal")}
                formula={t("details.priceBuildup.bookingChargesExcludesDepositNote")}
              />
            }
            value={formatEur(buildup.subtotal.subtotal)}
          />
          {buildup.extensionAmountDue > 0 ? (
            <BuildupRow
              emphasis
              label={t("details.priceBuildup.extensionAmountDue")}
              value={formatEur(buildup.extensionAmountDue)}
            />
          ) : null}
        </BuildupSubsection>

        {booking.extensions.length > 0 ? (
          <BuildupSubsection title={t("details.priceBuildup.extensionsTitle")}>
            {booking.extensions.map((extension) => (
              <BuildupRow
                key={extension.id}
                label={t("details.priceBuildup.extensionLine", {
                  from: formatMaltaDateTime(extension.previousReturnDateTime, locale),
                  to: formatMaltaDateTime(extension.newReturnDateTime, locale),
                  days: extension.additionalBillableDays,
                })}
                value={formatEur(extension.additionalAmount)}
              />
            ))}
            <p className="pt-2 text-xs text-slate-500">{t("details.priceBuildup.extensionAmountDueNote")}</p>
          </BuildupSubsection>
        ) : null}

        <BuildupSubsection title={t("details.priceBuildup.paymentSummaryTitle")}>
          <BuildupRow
            label={t("details.fields.bookingChargesTotal")}
            value={formatEur(buildup.paymentSummary.bookingChargesTotal)}
          />
          <BuildupRow
            label={
              buildup.paymentSummary.securityDepositDueAtPickup
                ? t("details.fields.securityDepositDueAtPickup")
                : t("details.fields.securityDeposit")
            }
            value={formatEur(buildup.paymentSummary.securityDeposit)}
          />
          <BuildupRow
            label={t("details.fields.securityDepositMethod")}
            value={t(`depositMethod.${buildup.deposit.method}` as "depositMethod.ONLINE")}
          />
          <BuildupRow
            label={t("details.fields.amountDueAtPickupLater")}
            value={formatEur(buildup.paymentSummary.amountDueAtPickupLater)}
          />
          <BuildupRow
            emphasis
            label={t("details.fields.totalCustomerLiability")}
            value={formatEur(buildup.paymentSummary.totalCustomerLiability)}
          />
          <div className="space-y-2 border-b border-slate-200/70 py-3 text-xs text-slate-500 last:border-0">
            <p>{t("details.priceBuildup.securityDepositHelperText")}</p>
            {buildup.paymentSummary.securityDepositDueAtPickup ? (
              <p>{t("details.priceBuildup.securityDepositAtPickupNote")}</p>
            ) : null}
          </div>
        </BuildupSubsection>
      </div>
    </section>
  );
}
