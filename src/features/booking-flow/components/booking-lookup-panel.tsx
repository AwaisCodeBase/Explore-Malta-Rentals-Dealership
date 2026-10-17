"use client";

import { type FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { lookupBooking } from "@/features/booking-flow/lib/lookup-booking-api";
import type { PublicBookingSummary } from "@/lib/booking/lookupPublicBooking";

/** Single field style shared by the lookup inputs. */
const lookupFieldClass =
  "mt-1.5 min-h-12 w-full rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)] px-3.5 py-2.5 text-sm font-normal text-[var(--text-primary)] shadow-[var(--elev-1)] outline-none transition duration-[var(--dur-fast)] placeholder:text-[var(--text-faint)] hover:border-[var(--line-strong)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";

type BookingLookupPanelProps = {
  initialReference?: string;
  initialEmail?: string;
  showSubmittedBanner?: boolean;
};

function formatIsoDateTime(iso: string, format: ReturnType<typeof useFormatter>): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return format.dateTime(d, { dateStyle: "medium", timeStyle: "short" });
}

function bookingStatusLabel(status: PublicBookingSummary["status"], t: (key: string) => string): string {
  switch (status) {
    case "CONFIRMED":
      return t("status.CONFIRMED");
    case "VEHICLE_HANDED_OVER":
      return t("status.VEHICLE_HANDED_OVER");
    case "RETURNED":
      return t("status.RETURNED");
    case "COMPLETED":
      return t("status.COMPLETED");
    case "CANCELLED":
      return t("status.CANCELLED");
    default:
      return status;
  }
}

function BookingSummaryCard({
  summary,
  format,
}: {
  summary: PublicBookingSummary;
  format: ReturnType<typeof useFormatter>;
}) {
  const t = useTranslations("BookingPage.lookup");

  return (
    <div className="mt-5 overflow-hidden rounded-[var(--r-card)] border border-emerald-200/80 bg-emerald-50/40 text-sm text-[var(--text-primary)] shadow-[var(--elev-1)]">
      <div className="border-b border-emerald-200/70 bg-[var(--surface-card)]/70 px-4 py-3.5">
        <p className="type-spec text-[var(--text-muted)]">{t("referenceLabel")}</p>
        <p className="mt-1 font-mono text-lg font-bold tracking-tight tabular-nums text-blue-700">
          {summary.bookingReference}
        </p>
      </div>
      <dl className="divide-y divide-emerald-200/60">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5">
          <dt className="text-[var(--text-secondary)]">{t("statusLabel")}</dt>
          <dd className="font-semibold text-[var(--text-primary)]">
            {bookingStatusLabel(summary.status, t)}
          </dd>
        </div>
        {summary.vehicleName ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5">
            <dt className="text-[var(--text-secondary)]">{t("vehicleLabel")}</dt>
            <dd className="font-semibold text-[var(--text-primary)]">{summary.vehicleName}</dd>
          </div>
        ) : null}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5">
          <dt className="text-[var(--text-secondary)]">{t("pickupLabel")}</dt>
          <dd className="font-medium tabular-nums text-[var(--text-primary)]">
            {formatIsoDateTime(summary.pickupDateTime, format)}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5">
          <dt className="text-[var(--text-secondary)]">{t("returnLabel")}</dt>
          <dd className="font-medium tabular-nums text-[var(--text-primary)]">
            {formatIsoDateTime(summary.returnDateTime, format)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function BookingLookupPanel({
  initialReference,
  initialEmail,
  showSubmittedBanner,
}: BookingLookupPanelProps) {
  const t = useTranslations("BookingPage.lookup");
  const format = useFormatter();
  const [reference, setReference] = useState(() => initialReference?.trim() ?? "");
  const [email, setEmail] = useState(() => initialEmail?.trim() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PublicBookingSummary | null>(null);
  const [autoLookupDone, setAutoLookupDone] = useState(false);

  useEffect(() => {
    const next = initialReference?.trim();
    if (next) {
      setReference(next);
    }
  }, [initialReference]);

  useEffect(() => {
    const next = initialEmail?.trim();
    if (next) {
      setEmail(next);
    }
  }, [initialEmail]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSummary(null);
    setLoading(true);
    const result = await lookupBooking(reference, email);
    setLoading(false);
    if (result.ok) {
      setSummary(result.booking);
      return;
    }
    setError(result.message);
  }

  useEffect(() => {
    if (autoLookupDone || !showSubmittedBanner || !reference.trim() || !email.trim()) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary(null);
    void lookupBooking(reference, email).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      setAutoLookupDone(true);
      if (result.ok) {
        setSummary(result.booking);
        return;
      }
      setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [autoLookupDone, email, reference, showSubmittedBanner]);

  return (
    <section
      aria-labelledby="booking-lookup-heading"
      className="surface-panel p-5 sm:p-6"
    >
      {showSubmittedBanner ? (
        <div className="mb-5 flex items-start gap-3 rounded-[var(--r-card)] border border-emerald-200 bg-emerald-50/70 px-4 py-3.5 text-sm text-emerald-950">
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
            aria-hidden
          >
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold tracking-[-0.01em]">{t("submittedTitle")}</p>
            <p className="mt-0.5 text-emerald-900/90">{t("submittedBody")}</p>
          </div>
        </div>
      ) : null}

      <h2 id="booking-lookup-heading" className="type-h3 text-[var(--text-primary)]">
        {t("title")}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{t("lead")}</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {t("referenceLabelShort")}
            <input
              type="text"
              name="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoComplete="off"
              className={`${lookupFieldClass} font-mono uppercase tabular-nums`}
              placeholder={t("referencePlaceholder")}
            />
          </label>
          <label className="block text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {t("emailLabel")}
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={lookupFieldClass}
              placeholder={t("emailPlaceholder")}
              suppressHydrationWarning
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading || !reference.trim() || !email.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-500 px-6 text-sm font-semibold text-white shadow-[var(--elev-3)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-[var(--elev-4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[var(--ink-200)] disabled:text-[var(--text-faint)] disabled:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("loading")}
            </>
          ) : (
            t("submit")
          )}
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-[var(--r-field)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}
      {summary ? <BookingSummaryCard summary={summary} format={format} /> : null}
    </section>
  );
}
