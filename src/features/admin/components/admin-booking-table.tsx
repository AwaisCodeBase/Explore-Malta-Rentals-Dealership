"use client";

import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import { buildBookingPaymentSummary } from "@/lib/booking/build-booking-payment-summary";
import type { AdminBookingListItem, AdminBookingListResult } from "@/lib/admin/bookings/types";
import { formatMaltaDateTime } from "@/lib/format-malta-datetime";

type AdminBookingTableProps = Readonly<{
  locale: string;
  result: AdminBookingListResult;
  searchParams: Record<string, string | undefined>;
}>;

function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusBadgeClass(status: string): string {
  if (status === "PENDING_PAYMENT") return "bg-amber-50 text-amber-700";
  if (status === "CONFIRMED") return "bg-emerald-50 text-emerald-700";
  if (status === "VEHICLE_HANDED_OVER") return "bg-sky-50 text-sky-700";
  if (status === "RETURNED") return "bg-indigo-50 text-indigo-700";
  if (status === "COMPLETED") return "bg-slate-100 text-slate-700";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function paymentStatusBadgeClass(status: string): string {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700";
  if (status === "REFUNDED") return "bg-blue-50 text-blue-700";
  if (status === "FAILED") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-800";
}

function buildPageUrl(
  locale: string,
  searchParams: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") {
      params.set(key, value);
    }
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return `/${locale}/admin/bookings${query ? `?${query}` : ""}`;
}

export function AdminBookingTable({ locale, result, searchParams }: AdminBookingTableProps) {
  const t = useTranslations("Admin.bookings");
  const { items, total, page, totalPages } = result;

  function formatPaymentSummaryAmount(booking: AdminBookingListItem): string {
    const summary = buildBookingPaymentSummary({
      subtotal: booking.subtotal,
      depositAmount: booking.depositAmount,
      depositMethod: booking.depositMethod,
      totalDueOnline: booking.totalDueOnline,
      totalDueLater: booking.totalDueLater,
    });

    return formatEur(summary.amountDueAtPickupLater);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">{t("table.reference")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.customer")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.vehicle")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.pickup")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.return")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.status")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.paymentStatus")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.amountDueAtPickupLater")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.hotelCode")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.created")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-500">
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              items.map((booking: AdminBookingListItem) => (
                <tr key={booking.id} className="border-t border-slate-100">
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-700">
                    {booking.bookingReference}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{booking.customerFullName}</div>
                    <div className="text-[11px] text-slate-500">{booking.customerEmail}</div>
                    <div className="text-[11px] text-slate-500">{booking.customerPhone}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <div>{booking.vehicleName}</div>
                    {booking.vehicleLicensePlate ? (
                      <div className="text-[11px] text-slate-500">{booking.vehicleLicensePlate}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatMaltaDateTime(booking.pickupDateTime)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatMaltaDateTime(booking.returnDateTime)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={[
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                        statusBadgeClass(booking.status),
                      ].join(" ")}
                    >
                      {t(`status.${booking.status}` as "status.CONFIRMED")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={[
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                        paymentStatusBadgeClass(booking.paymentStatus),
                      ].join(" ")}
                    >
                      {t(`paymentStatus.${booking.paymentStatus}` as "paymentStatus.PENDING")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {formatPaymentSummaryAmount(booking)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-600">
                    {booking.hotelCode ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatMaltaDateTime(booking.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <a
                      href={`/${locale}/admin/bookings/${booking.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#3a7ca5] hover:bg-[#3a7ca5]/10"
                    >
                      <Eye className="size-3.5" aria-hidden />
                      {t("table.view")}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label={t("pagination.label")}
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <p className="text-slate-600">
            {t("pagination.showing", {
              from: (page - 1) * result.pageSize + 1,
              to: Math.min(page * result.pageSize, total),
              total,
            })}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <a
                href={buildPageUrl(locale, searchParams, page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("pagination.previous")}
              </a>
            ) : (
              <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-slate-400">
                {t("pagination.previous")}
              </span>
            )}
            <span className="text-slate-600">
              {t("pagination.pageOf", { page, totalPages })}
            </span>
            {page < totalPages ? (
              <a
                href={buildPageUrl(locale, searchParams, page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("pagination.next")}
              </a>
            ) : (
              <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-slate-400">
                {t("pagination.next")}
              </span>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
