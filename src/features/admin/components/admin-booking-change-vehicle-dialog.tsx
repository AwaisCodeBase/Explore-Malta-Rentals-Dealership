"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import type {
  ChangeBookingVehicleOptions,
  ChangeBookingVehiclePreview,
} from "@/lib/admin/bookings/change-booking-vehicle-types";
import type { VehicleChangePriceMode } from "@/lib/admin/bookings/calculate-vehicle-change-price";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { formatMaltaDateTime } from "@/lib/format-malta-datetime";

type AdminBookingChangeVehicleDialogProps = Readonly<{
  booking: AdminBookingDetail;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (input: {
    vehicleId: string;
    color: string | null;
    priceMode: VehicleChangePriceMode;
    expectedUpdatedAt: string;
  }) => void;
}>;

function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatSignedEur(amount: number): string {
  const formatted = formatEur(Math.abs(amount));
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `−${formatted}`;
  return formatted;
}

function inputClassName(): string {
  return "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3a7ca5]/40 focus:ring-2 focus:ring-[#3a7ca5]/15";
}

export function AdminBookingChangeVehicleDialog({
  booking,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: AdminBookingChangeVehicleDialogProps) {
  const t = useTranslations("Admin.bookings.lifecycle");
  const [options, setOptions] = useState<ChangeBookingVehicleOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsLoadedFor, setOptionsLoadedFor] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [color, setColor] = useState("");
  const [priceMode, setPriceMode] = useState<VehicleChangePriceMode>("keep_existing");
  const [preview, setPreview] = useState<ChangeBookingVehiclePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoadedFor, setPreviewLoadedFor] = useState<string | null>(null);

  const selected = useMemo(
    () => options?.vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null,
    [options, vehicleId],
  );
  const canApplyCatalogPrice = options?.canApplyCatalogPrice ?? true;
  const effectivePriceMode: VehicleChangePriceMode =
    options && !canApplyCatalogPrice && priceMode === "apply_catalog" ? "keep_existing" : priceMode;
  const selectionReady = Boolean(vehicleId) && (!selected?.requiresColor || Boolean(color));
  const previewRequestKey = selectionReady ? `${vehicleId}:${color}:${effectivePriceMode}` : null;
  const isLoadingOptions = optionsLoadedFor !== booking.id;
  const visiblePreview = previewRequestKey && previewLoadedFor === previewRequestKey ? preview : null;
  const visiblePreviewError = previewRequestKey && previewLoadedFor === previewRequestKey ? previewError : null;
  const isPreviewing = previewRequestKey !== null && previewLoadedFor !== previewRequestKey;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/admin/bookings/${booking.id}/change-vehicle/options`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          message?: string;
          options?: ChangeBookingVehicleOptions;
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
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setOptionsError(t("genericError"));
        setOptionsLoadedFor(booking.id);
      });

    return () => controller.abort();
  }, [booking.id, t]);

  useEffect(() => {
    if (!previewRequestKey) return;

    const controller = new AbortController();
    void fetch(`/api/admin/bookings/${booking.id}/change-vehicle/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        vehicleId,
        color: color || null,
        priceMode: effectivePriceMode,
      }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          message?: string;
          preview?: ChangeBookingVehiclePreview;
        };
        if (controller.signal.aborted) return;
        if (!response.ok || !payload.success || !payload.preview) {
          setPreview(null);
          setPreviewError(payload.message ?? t("genericError"));
          setPreviewLoadedFor(previewRequestKey);
          return;
        }
        setPreview(payload.preview);
        setPreviewError(null);
        setPreviewLoadedFor(previewRequestKey);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setPreview(null);
        setPreviewError(t("genericError"));
        setPreviewLoadedFor(previewRequestKey);
      });

    return () => controller.abort();
  }, [booking.id, color, effectivePriceMode, previewRequestKey, t, vehicleId]);

  function selectVehicle(nextVehicleId: string) {
    setVehicleId(nextVehicleId);
    setColor("");
    setPreview(null);
    setPreviewError(null);
  }

  const confirmDisabled =
    isSubmitting || isPreviewing || isLoadingOptions || !visiblePreview || visiblePreview.replacementVehicleId !== vehicleId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-vehicle-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h4 id="change-vehicle-title" className="text-lg font-bold text-slate-950">
          {t("changeVehicle.title")}
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          {t("changeVehicle.description", { reference: booking.bookingReference })}
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("changeVehicle.currentTitle")}
            </h5>
            <dl className="mt-3 space-y-2 text-sm text-slate-800">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.vehicle")}</dt>
                <dd className="text-right font-medium">{booking.vehicleName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.color")}</dt>
                <dd className="text-right font-medium">{booking.vehicleColor ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.unit")}</dt>
                <dd className="text-right font-medium">{booking.vehicleLicensePlate ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.dates")}</dt>
                <dd className="text-right font-medium">
                  {formatMaltaDateTime(booking.pickupDateTime)} – {formatMaltaDateTime(booking.returnDateTime)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t("changeVehicle.newTitle")}
            </h5>
            {isLoadingOptions ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("changeVehicle.loading")}
              </p>
            ) : null}
            {optionsError ? <p className="mt-3 text-sm text-red-600">{optionsError}</p> : null}
            {options && options.vehicles.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">{t("changeVehicle.noAlternatives")}</p>
            ) : null}
            {options && options.vehicles.length > 0 ? (
              <div className="mt-3 space-y-3">
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("changeVehicle.selectVehicle")}
                  </span>
                  <select
                    value={vehicleId}
                    onChange={(event) => selectVehicle(event.target.value)}
                    className={inputClassName()}
                  >
                    <option value="">{t("changeVehicle.selectVehicle")}</option>
                    {options.vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} · {formatEur(vehicle.baseDailyRate)}
                        {t("changeVehicle.perDay")}
                      </option>
                    ))}
                  </select>
                </label>
                {selected?.requiresColor ? (
                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("changeVehicle.selectColor")}
                    </span>
                    <select
                      value={color}
                      onChange={(event) => setColor(event.target.value)}
                      className={inputClassName()}
                    >
                      <option value="">{t("changeVehicle.selectColor")}</option>
                      {selected.colors.map((option) => (
                        <option key={option.value} value={option.label}>
                          {option.label} ({option.availableUnitCount})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {selected && !selected.requiresColor ? (
                  <p className="text-sm text-slate-500">{t("changeVehicle.noColorRequired")}</p>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <fieldset className="mt-4 space-y-2" disabled={!selected}>
          <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("changeVehicle.priceMode")}
          </legend>
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="vehicle-change-price"
              checked={effectivePriceMode === "keep_existing"}
              onChange={() => setPriceMode("keep_existing")}
            />
            <span>
              <span className="font-medium">{t("changeVehicle.keepPrice")}</span>
              <span className="mt-0.5 block text-slate-500">{t("changeVehicle.keepPriceHint")}</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="vehicle-change-price"
              checked={effectivePriceMode === "apply_catalog"}
              disabled={Boolean(options) && !canApplyCatalogPrice}
              onChange={() => setPriceMode("apply_catalog")}
            />
            <span>
              <span className="font-medium">{t("changeVehicle.applyPrice")}</span>
              <span className="mt-0.5 block text-slate-500">
                {options && !canApplyCatalogPrice
                  ? t("changeVehicle.applyDisabled")
                  : t("changeVehicle.applyPriceHint")}
              </span>
            </span>
          </label>
        </fieldset>

        <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("changeVehicle.previewTitle")}
          </h5>
          {isPreviewing ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("changeVehicle.preview")}
            </p>
          ) : null}
          {!isPreviewing && !visiblePreview && !visiblePreviewError ? (
            <p className="mt-3 text-sm text-slate-500">{t("changeVehicle.emptySelection")}</p>
          ) : null}
          {visiblePreview ? (
            <dl className="mt-3 space-y-2 text-sm text-slate-800">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.vehicle")}</dt>
                <dd className="text-right font-medium">{visiblePreview.replacementVehicleName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.color")}</dt>
                <dd className="text-right font-medium">{visiblePreview.proposedColor ?? visiblePreview.selectedColor ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.unit")}</dt>
                <dd className="text-right font-medium">
                  {visiblePreview.assignsUnitNow
                    ? (visiblePreview.proposedUnitLabel ?? "—")
                    : t("changeVehicle.assignedLater")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.currentPrice")}</dt>
                <dd className="text-right font-medium">{formatEur(visiblePreview.currentSubtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.calculatedPrice")}</dt>
                <dd className="text-right font-medium">{formatEur(visiblePreview.calculatedSubtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t("changeVehicle.difference")}</dt>
                <dd className="text-right font-medium">{formatSignedEur(visiblePreview.priceDifference)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
                <dt className="font-semibold text-slate-700">{t("changeVehicle.finalPrice")}</dt>
                <dd className="text-right font-semibold">
                  {formatEur(visiblePreview.finalSubtotal)}{" "}
                  <span className="font-medium text-slate-500">
                    {visiblePreview.priceMode === "keep_existing"
                      ? t("changeVehicle.keepFinal")
                      : t("changeVehicle.applyFinal")}
                  </span>
                </dd>
              </div>
              <p className="pt-1 text-sm text-emerald-700">{t("changeVehicle.available")}</p>
              {visiblePreview.vehicleTypeChanged ? (
                <p className="text-sm text-slate-600">{t("changeVehicle.typeNote")}</p>
              ) : null}
              <p className="text-xs text-slate-500">
                {visiblePreview.priceMode === "apply_catalog" && visiblePreview.duesUpdated
                  ? t("changeVehicle.duesNote")
                  : t("changeVehicle.paymentNote")}
              </p>
            </dl>
          ) : null}
          {visiblePreviewError ? <p className="mt-3 text-sm text-red-600">{visiblePreviewError}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </section>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={() => {
              if (!visiblePreview) return;
              onConfirm({
                vehicleId: visiblePreview.replacementVehicleId,
                color: visiblePreview.selectedColor,
                priceMode: visiblePreview.priceMode,
                expectedUpdatedAt: visiblePreview.expectedUpdatedAt,
              });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t("changeVehicle.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
