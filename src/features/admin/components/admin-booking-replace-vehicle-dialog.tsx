"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import type { ReplacementReason, ReplacementUnitDisposition } from "@/lib/admin/bookings/vehicle-replacement-eligibility";
import type { ReplaceBookingVehicleOptions } from "@/lib/admin/bookings/replace-booking-vehicle-types";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { formatMaltaDateTime } from "@/lib/format-malta-datetime";

type AdminBookingReplaceVehicleDialogProps = Readonly<{
  booking: AdminBookingDetail;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (input: {
    vehicleUnitId: string;
    previousUnitStatus: ReplacementUnitDisposition;
    reason: ReplacementReason;
    note?: string;
    expectedUpdatedAt: string;
    expectedVehicleUnitId: string;
  }) => void;
}>;

const DISPOSITIONS: readonly ReplacementUnitDisposition[] = ["MAINTENANCE", "NOT_AVAILABLE", "AVAILABLE"];
const REASONS: readonly ReplacementReason[] = ["mechanical_issue", "damage", "customer_requested", "other"];

function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function inputClassName(): string {
  return "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3a7ca5]/40 focus:ring-2 focus:ring-[#3a7ca5]/15";
}

function labelClassName(): string {
  return "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";
}

export function AdminBookingReplaceVehicleDialog({
  booking,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: AdminBookingReplaceVehicleDialogProps) {
  const t = useTranslations("Admin.bookings.lifecycle");
  const [options, setOptions] = useState<ReplaceBookingVehicleOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsLoadedFor, setOptionsLoadedFor] = useState<string | null>(null);
  const [vehicleUnitId, setVehicleUnitId] = useState("");
  const [previousUnitStatus, setPreviousUnitStatus] = useState<ReplacementUnitDisposition>("MAINTENANCE");
  const [reason, setReason] = useState<ReplacementReason>("mechanical_issue");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");

  const isLoadingOptions = optionsLoadedFor !== booking.id;
  const selected = options?.units.find((unit) => unit.id === vehicleUnitId) ?? null;
  const groups = useMemo(() => {
    const grouped = new Map<string, { vehicleId: string; label: string; units: ReplaceBookingVehicleOptions["units"] }>();
    for (const unit of options?.units ?? []) {
      const brandModel = [unit.brand, unit.model].filter(Boolean).join(" ");
      const label = brandModel ? `${brandModel} · ${unit.vehicleName}` : unit.vehicleName;
      const group = grouped.get(unit.vehicleId) ?? {
        vehicleId: unit.vehicleId,
        label: `${label} · ${unit.vehicleType}`,
        units: [],
      };
      group.units.push(unit);
      grouped.set(unit.vehicleId, group);
    }
    return [...grouped.values()];
  }, [options]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/admin/bookings/${booking.id}/replace-vehicle/options`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          message?: string;
          options?: ReplaceBookingVehicleOptions;
        };
        if (controller.signal.aborted) return;
        if (!response.ok || !payload.success || !payload.options) {
          setOptionsError(payload.message ?? t("genericError"));
          setOptions(null);
          setOptionsLoadedFor(booking.id);
          return;
        }
        setOptionsError(null);
        setOptions(payload.options);
        setOptionsLoadedFor(booking.id);
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setOptionsError(fetchError instanceof Error ? fetchError.message : t("genericError"));
        setOptions(null);
        setOptionsLoadedFor(booking.id);
      });
    return () => controller.abort();
  }, [booking.id, t]);

  const currentStatus = options?.currentUnitStatus ?? booking.vehicleUnitStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-vehicle-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h4 id="replace-vehicle-title" className="text-lg font-bold text-slate-950">
          {t("replaceVehicle.title")}
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          {t("replaceVehicle.description", { reference: booking.bookingReference })}
        </p>

        {isLoadingOptions ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("replaceVehicle.loading")}
          </p>
        ) : null}
        {optionsError ? <p className="mt-4 text-sm text-red-600">{optionsError}</p> : null}

        {options && step === "select" ? (
          <div className="mt-4 space-y-4">
            <section className="rounded-xl border border-orange-200 bg-orange-50 p-3">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                {t("replaceVehicle.currentTitle")}
              </h5>
              <p className="mt-1 text-sm font-semibold text-slate-950">{options.currentVehicleName}</p>
              <p className="text-sm text-slate-700">
                {t("replaceVehicle.plate")}: {options.currentLicensePlate ?? "—"}
              </p>
              <p className="text-sm text-slate-700">
                {t("replaceVehicle.color")}: {options.currentColor ?? "—"}
              </p>
              <p className="text-sm text-slate-700">
                {t("replaceVehicle.status")}:{" "}
                {currentStatus ? t(`unitStatus.${currentStatus}` as "unitStatus.OUT_WITH_CUSTOMER") : "—"}
              </p>
            </section>

            <section>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("replaceVehicle.replacementTitle")}
              </h5>
              {options.units.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">{t("replaceVehicle.noUnits")}</p>
              ) : (
                <label className="mt-2 block">
                  <span className={labelClassName()}>{t("replaceVehicle.selectUnit")}</span>
                  <select
                    value={vehicleUnitId}
                    onChange={(event) => setVehicleUnitId(event.target.value)}
                    className={inputClassName()}
                  >
                    <option value="">{t("replaceVehicle.selectUnit")}</option>
                    {groups.map((group) => (
                      <optgroup key={group.vehicleId} label={group.label}>
                        {group.units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.licensePlate}
                            {unit.color ? ` · ${unit.color}` : ""}
                            {` · ${unit.vehicleType}`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              )}
              {selected ? (
                <p className="mt-2 text-sm text-slate-700">
                  {selected.vehicleName} · {selected.licensePlate}
                  {selected.color ? ` · ${selected.color}` : ""} · {selected.vehicleType}
                </p>
              ) : null}
            </section>

            <section className="rounded-xl border border-slate-200 p-3">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("replaceVehicle.remainingTitle")}
              </h5>
              <p className="mt-2 text-sm text-slate-700">
                {t("replaceVehicle.effective")}: {formatMaltaDateTime(options.replacementEffectiveAt)}
              </p>
              <p className="text-sm text-slate-700">
                {t("replaceVehicle.return")}: {formatMaltaDateTime(options.returnDateTime)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{t("replaceVehicle.effectiveHint")}</p>
            </section>

            <section>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("replaceVehicle.handlingTitle")}
              </h5>
              <label className="mt-2 block">
                <span className={labelClassName()}>{t("replaceVehicle.previousStatus")}</span>
                <select
                  value={previousUnitStatus}
                  onChange={(event) => setPreviousUnitStatus(event.target.value as ReplacementUnitDisposition)}
                  className={inputClassName()}
                >
                  {DISPOSITIONS.map((status) => (
                    <option key={status} value={status}>
                      {t(`unitStatus.${status}` as "unitStatus.MAINTENANCE")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block">
                <span className={labelClassName()}>{t("replaceVehicle.reason")}</span>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value as ReplacementReason)}
                  className={inputClassName()}
                >
                  {REASONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`replaceVehicle.reasons.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block">
                <span className={labelClassName()}>{t("replaceVehicle.note")}</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={t("replaceVehicle.notePlaceholder")}
                  className={inputClassName()}
                />
              </label>
            </section>

            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              {t("replaceVehicle.priceUnchanged")} {t("replaceVehicle.priceAmount", { amount: formatEur(options.subtotal) })}
            </p>
          </div>
        ) : null}

        {options && selected && step === "confirm" ? (
          <section className="mt-4 rounded-xl border border-slate-200 p-3">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("replaceVehicle.confirmTitle")}
            </h5>
            <dl className="mt-3 space-y-2 text-sm text-slate-800">
              <div>
                <dt className="text-slate-500">{t("replaceVehicle.currentTitle")}</dt>
                <dd className="font-semibold">
                  {options.currentVehicleName} — {options.currentLicensePlate ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("replaceVehicle.replacementTitle")}</dt>
                <dd className="font-semibold">
                  {selected.vehicleName} — {selected.licensePlate}
                  {selected.color ? ` · ${selected.color}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("replaceVehicle.effective")}</dt>
                <dd>{formatMaltaDateTime(options.replacementEffectiveAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("replaceVehicle.return")}</dt>
                <dd>{formatMaltaDateTime(options.returnDateTime)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("replaceVehicle.previousStatus")}</dt>
                <dd>{t(`unitStatus.${previousUnitStatus}` as "unitStatus.MAINTENANCE")}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("replaceVehicle.reason")}</dt>
                <dd>{t(`replaceVehicle.reasons.${reason}`)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm font-medium text-emerald-800">{t("replaceVehicle.priceUnchanged")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("replaceVehicle.effectiveHint")}</p>
          </section>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={step === "confirm" ? () => setStep("select") : onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {step === "confirm" ? t("replaceVehicle.back") : t("cancel")}
          </button>
          {step === "select" ? (
            <button
              type="button"
              disabled={!selected || isSubmitting}
              onClick={() => setStep("confirm")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {t("replaceVehicle.review")}
            </button>
          ) : (
            <button
              type="button"
              disabled={!selected || !options || isSubmitting}
              onClick={() => {
                if (!selected || !options) return;
                onConfirm({
                  vehicleUnitId: selected.id,
                  previousUnitStatus,
                  reason,
                  note: note.trim() || undefined,
                  expectedUpdatedAt: options.expectedUpdatedAt,
                  expectedVehicleUnitId: options.expectedVehicleUnitId,
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {t("replaceVehicle.confirm")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
