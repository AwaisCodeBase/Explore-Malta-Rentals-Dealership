"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AdminBookingExtendCalendar } from "@/features/admin/components/admin-booking-extend-calendar";
import type { BookingExtensionAvailability, BookingExtensionPreview } from "@/lib/admin/bookings/extendBooking";
import {
  isSelectableExtensionReturn,
  latestExtensionReturn,
  maltaCalendarDateKey,
  maltaDateTimeToUtc,
  maltaTimeKey,
  maxExtensionReturn,
} from "@/lib/admin/bookings/extension-calendar-days";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { formatMaltaDateTime } from "@/lib/format-malta-datetime";

type AdminBookingExtendDialogProps = Readonly<{
  booking: AdminBookingDetail;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (input: { newReturnDateTime: string; expectedUpdatedAt: string }) => void;
}>;

function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function originalDailyRate(booking: AdminBookingDetail): number | null {
  if (booking.appliedDailyRateSnapshot !== null) {
    return booking.appliedDailyRateSnapshot;
  }
  if (booking.billableDays > 0) {
    return Math.round((booking.rentalCost / booking.billableDays) * 100) / 100;
  }
  return null;
}

export function AdminBookingExtendDialog({
  booking,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: AdminBookingExtendDialogProps) {
  const t = useTranslations("Admin.bookings.lifecycle");
  const anchorDateKey = maltaCalendarDateKey(new Date(booking.returnDateTime));
  const [availability, setAvailability] = useState<BookingExtensionAvailability | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [time, setTime] = useState(() => maltaTimeKey(new Date(booking.returnDateTime)));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<BookingExtensionPreview | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const dailyRate = originalDailyRate(booking);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingAvailability(true);
    setAvailabilityError(null);
    void fetch(`/api/admin/bookings/${booking.id}/extend/availability`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          message?: string;
          availability?: BookingExtensionAvailability;
        };
        if (cancelled) return;
        if (!response.ok || !payload.success || !payload.availability) {
          setAvailabilityError(payload.message ?? t("genericError"));
          setAvailability(null);
          return;
        }
        setAvailability(payload.availability);
      })
      .catch(() => {
        if (!cancelled) setAvailabilityError(t("genericError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [booking.id, t]);

  const proposedReturn = (() => {
    if (!availability || !selectedDateKey) return null;
    const currentReturn = new Date(availability.currentReturnDateTime);
    const cap = maxExtensionReturn(currentReturn, availability.billableDays, time);
    if (!cap) return null;
    const latest = latestExtensionReturn(
      currentReturn,
      availability.blocks.map((block) => ({
        pickupAt: new Date(block.pickupAt),
        returnAt: new Date(block.returnAt),
      })),
      cap,
    );
    if (!isSelectableExtensionReturn(selectedDateKey, time, currentReturn, latest)) {
      return null;
    }
    return maltaDateTimeToUtc(selectedDateKey, time);
  })();

  const proposedIso = proposedReturn?.toISOString() ?? null;

  useEffect(() => {
    if (!proposedIso) {
      setPreview(null);
      setPreviewMessage(selectedDateKey ? t("extend.dayUnavailable") : null);
      return;
    }

    let cancelled = false;
    setIsPreviewing(true);
    setPreviewMessage(null);
    void fetch(`/api/admin/bookings/${booking.id}/extend/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newReturnDateTime: proposedIso }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          message?: string | null;
          preview?: BookingExtensionPreview;
        };
        if (cancelled) return;
        if (!response.ok || !payload.success || !payload.preview) {
          setPreview(null);
          setPreviewMessage(payload.message ?? t("genericError"));
          return;
        }
        setPreview(payload.preview);
        setPreviewMessage(payload.preview.available ? null : (payload.message ?? null));
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
          setPreviewMessage(t("genericError"));
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreviewing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [booking.id, proposedIso, selectedDateKey, t]);

  function changeTime(nextTime: string) {
    setTime(nextTime);
    setPreview(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h4 className="text-lg font-bold text-slate-950">{t("extend.title")}</h4>
        <p className="mt-1 text-sm text-slate-600">
          {t("extend.description", { reference: booking.bookingReference })}
        </p>

        <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("extend.currentTitle")}</h5>
              <dl className="mt-3 space-y-2 text-sm text-slate-800">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t("extend.vehicle")}</dt>
                  <dd className="text-right font-medium">{booking.vehicleName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t("extend.unit")}</dt>
                  <dd className="text-right font-medium">{booking.vehicleLicensePlate ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t("extend.pickup")}</dt>
                  <dd className="text-right font-medium">{formatMaltaDateTime(booking.pickupDateTime)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t("extend.return")}</dt>
                  <dd className="text-right font-medium">{formatMaltaDateTime(booking.returnDateTime)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t("extend.billableDays")}</dt>
                  <dd className="text-right font-medium">{booking.billableDays}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t("extend.dailyRate")}</dt>
                  <dd className="text-right font-medium">{dailyRate === null ? "—" : formatEur(dailyRate)}</dd>
                </div>
              </dl>
            </div>

            {preview ? (
              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("extend.previewTitle")}</h5>
                <dl className="mt-3 space-y-2 text-sm text-slate-800">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t("extend.return")}</dt>
                    <dd className="text-right">{formatMaltaDateTime(preview.currentReturnDateTime)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t("extend.proposedReturn")}</dt>
                    <dd className="text-right">{formatMaltaDateTime(preview.proposedReturnDateTime)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t("extend.additionalDays")}</dt>
                    <dd className="text-right">{preview.additionalBillableDays}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t("extend.dailyRate")}</dt>
                    <dd className="text-right">{formatEur(preview.appliedDailyRate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t("extend.additionalRental")}</dt>
                    <dd className="text-right">{formatEur(preview.additionalRentalAmount)}</dd>
                  </div>
                  {preview.additionalHotelDiscountAmount > 0 ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">{t("extend.additionalHotel")}</dt>
                      <dd className="text-right">−{formatEur(preview.additionalHotelDiscountAmount)}</dd>
                    </div>
                  ) : null}
                  {preview.additionalCdwAmount > 0 ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">{t("extend.additionalCdw")}</dt>
                      <dd className="text-right">{formatEur(preview.additionalCdwAmount)}</dd>
                    </div>
                  ) : null}
                  {preview.additionalDriverAmount > 0 ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">{t("extend.additionalDriver")}</dt>
                      <dd className="text-right">{formatEur(preview.additionalDriverAmount)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4 font-semibold">
                    <dt>{t("extend.additionalAmount")}</dt>
                    <dd className="text-right">{formatEur(preview.additionalAmount)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t("extend.updatedSubtotal")}</dt>
                    <dd className="text-right">
                      {t("extend.updatedSubtotalSum", {
                        current: formatEur(preview.currentSubtotal),
                        additional: formatEur(preview.additionalAmount),
                        total: formatEur(preview.updatedSubtotal),
                      })}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-slate-500">{t("extend.unchangedCharges")}</p>
                {preview.available ? <p className="mt-2 text-sm text-emerald-700">{t("extend.available")}</p> : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">{t("extend.pickDay")}</p>
            )}

            {isPreviewing ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("extend.preview")}
              </p>
            ) : null}
            {previewMessage ? <p className="mt-3 text-sm text-red-600">{previewMessage}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

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
                disabled={isSubmitting || isPreviewing || !preview?.available || preview.proposedReturnDateTime !== proposedIso}
                onClick={() => {
                  if (!preview?.available) return;
                  onConfirm({
                    newReturnDateTime: preview.proposedReturnDateTime,
                    expectedUpdatedAt: preview.expectedUpdatedAt,
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {t("extend.confirm")}
              </button>
            </div>
          </div>

          <div>
            <AdminBookingExtendCalendar
              anchorDateKey={anchorDateKey}
              availability={availability}
              isLoading={isLoadingAvailability}
              loadError={availabilityError}
              selectedDateKey={selectedDateKey}
              time={time}
              onTimeChange={changeTime}
              onSelectDate={setSelectedDateKey}
              timeLabel={t("extend.returnTime")}
              timeHint={t("extend.maltaTime")}
              loadingLabel={t("extend.loadingAvailability")}
              unavailableLabel={t("extend.unavailableDay")}
              availableLabel={t("extend.availableDay")}
              selectedLabel={t("extend.selectedDay")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
