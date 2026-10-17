"use client";

import { Eye, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import type { AdminVehicleUnitDetailDto } from "@/lib/admin/vehicle-units/types";
import type { VehicleUnitStatus } from "@/generated/prisma/client";
import { formatMaltaDate, formatMaltaDateTime } from "@/lib/format-malta-datetime";

type AdminVehicleUnitDetailDialogProps = Readonly<{
  open: boolean;
  vehicleId: string;
  unitId: string | null;
  locale: string;
  onClose: () => void;
}>;

function unitStatusBadgeClass(status: VehicleUnitStatus, isActive: boolean): string {
  if (!isActive || status === "NOT_AVAILABLE") {
    return "bg-slate-100 text-slate-600";
  }
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";
    case "RESERVED":
      return "bg-blue-50 text-blue-700";
    case "OUT_WITH_CUSTOMER":
      return "bg-violet-50 text-violet-700";
    case "MAINTENANCE":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function bookingStatusBadgeClass(status: string): string {
  if (status === "CONFIRMED") return "bg-emerald-50 text-emerald-700";
  if (status === "VEHICLE_HANDED_OVER") return "bg-blue-50 text-blue-700";
  if (status === "RETURNED") return "bg-violet-50 text-violet-700";
  if (status === "COMPLETED") return "bg-slate-100 text-slate-700";
  if (status === "CANCELLED") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-800";
}

export function AdminVehicleUnitDetailDialog({
  open,
  vehicleId,
  unitId,
  locale,
  onClose,
}: AdminVehicleUnitDetailDialogProps) {
  const t = useTranslations("Admin.vehicles");
  const tUnits = useTranslations("Admin.vehicles.units");
  const tBookings = useTranslations("Admin.bookings");
  const [unit, setUnit] = useState<AdminVehicleUnitDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUnit = useCallback(async () => {
    if (!unitId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}/units/${unitId}`, {
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        unit?: AdminVehicleUnitDetailDto;
        message?: string;
      };

      if (!response.ok || !payload.success || !payload.unit) {
        setUnit(null);
        setError(payload.message ?? t("table.unitDetailLoadError"));
        return;
      }

      setUnit(payload.unit);
    } catch {
      setUnit(null);
      setError(t("table.unitDetailLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t, unitId, vehicleId]);

  useEffect(() => {
    if (!open || !unitId) {
      setUnit(null);
      setError(null);
      return;
    }
    void loadUnit();
  }, [loadUnit, open, unitId]);

  if (!open || !unitId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40"
        aria-label={t("table.unitDetailClose")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-vehicle-unit-detail-title"
        className="relative flex max-h-[min(90vh,48rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("table.unitDetailKicker")}
            </p>
            <h2 id="admin-vehicle-unit-detail-title" className="mt-1 truncate text-lg font-bold text-slate-950">
              {unit?.licensePlate ?? t("table.unitDetailLoadingTitle")}
            </h2>
            {unit ? (
              <p className="mt-0.5 truncate text-sm text-slate-600">
                {unit.vehicleName}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label={t("table.unitDetailClose")}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-slate-600">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("table.unitDetailLoading")}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => {
                  void loadUnit();
                }}
                className="mt-2 text-xs font-semibold underline underline-offset-2"
              >
                {t("table.unitsRetry")}
              </button>
            </div>
          ) : unit ? (
            <div className="space-y-5">
              <dl className="grid gap-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {tUnits("table.licensePlate")}
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">{unit.licensePlate}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {tUnits("table.color")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {unit.color ?? (
                      <span className="text-xs font-semibold text-amber-700">{tUnits("colorMissing")}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {tUnits("table.status")}
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        unitStatusBadgeClass(unit.status, unit.isActive),
                      ].join(" ")}
                    >
                      {tUnits(`statuses.${unit.status}`)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {tUnits("table.active")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {unit.isActive ? tUnits("table.yes") : tUnits("table.no")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {tUnits("notes")}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">{unit.notes?.trim() ? unit.notes : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("details.createdAt")}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">{formatMaltaDate(unit.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("table.unitUpdated")}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">{formatMaltaDate(unit.updatedAt)}</dd>
                </div>
              </dl>

              {unit.activeHolds.length > 0 ? (
                <section>
                  <h3 className="text-sm font-bold text-slate-900">{t("table.unitActiveHoldsTitle")}</h3>
                  <div className="mt-2 overflow-x-auto rounded-xl border border-amber-200/80 bg-amber-50/40">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-amber-100 text-xs uppercase tracking-wide text-amber-900/70">
                          <th className="px-3 py-2 font-semibold">{t("table.unitHoldReference")}</th>
                          <th className="px-3 py-2 font-semibold">{tBookings("table.pickup")}</th>
                          <th className="px-3 py-2 font-semibold">{tBookings("table.return")}</th>
                          <th className="px-3 py-2 font-semibold">{t("table.unitHoldExpires")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unit.activeHolds.map((hold) => (
                          <tr key={hold.holdReference} className="border-b border-amber-100/80 last:border-0">
                            <td className="px-3 py-2 font-mono text-xs font-semibold text-amber-950">
                              {hold.holdReference}
                            </td>
                            <td className="px-3 py-2 text-amber-950">{formatMaltaDateTime(hold.pickupDateTime)}</td>
                            <td className="px-3 py-2 text-amber-950">{formatMaltaDateTime(hold.returnDateTime)}</td>
                            <td className="px-3 py-2 text-amber-950">{formatMaltaDateTime(hold.expiresAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              <section>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {t("table.unitBookingsTitle", { count: unit.bookings.length })}
                  </h3>
                </div>

                {unit.bookings.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    {t("table.unitBookingsEmpty")}
                  </p>
                ) : (
                  <div className="mt-2 rounded-xl border border-slate-200/80">
                    <table className="w-full table-fixed text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                          <th className="w-[11%] px-3 py-2 font-semibold">{tBookings("table.reference")}</th>
                          <th className="w-[22%] px-3 py-2 font-semibold">{tBookings("table.customer")}</th>
                          <th className="w-[20%] px-3 py-2 font-semibold">{tBookings("table.pickup")}</th>
                          <th className="w-[20%] px-3 py-2 font-semibold">{tBookings("table.return")}</th>
                          <th className="w-[12%] px-3 py-2 font-semibold">{tBookings("table.status")}</th>
                          <th className="w-[15%] px-3 py-2 font-semibold">{tBookings("table.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unit.bookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-900">
                              {booking.bookingReference}
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-medium text-slate-900">{booking.customerFullName}</p>
                              <p className="text-xs text-slate-500">{booking.customerEmail}</p>
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {formatMaltaDateTime(booking.pickupDateTime)}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {formatMaltaDateTime(booking.returnDateTime)}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={[
                                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                  bookingStatusBadgeClass(booking.status),
                                ].join(" ")}
                              >
                                {tBookings(`status.${booking.status}`)}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <a
                                href={`/${locale}/admin/bookings/${booking.id}`}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#3a7ca5]/30 hover:text-[#3a7ca5]"
                              >
                                <Eye className="size-3.5" aria-hidden />
                                {tBookings("table.view")}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <a
            href={`/${locale}/admin/vehicles/${vehicleId}#vehicle-units`}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("table.manageUnits")}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-[#3a7ca5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f6688]"
          >
            {t("table.unitDetailClose")}
          </button>
        </div>
      </div>
    </div>
  );
}
