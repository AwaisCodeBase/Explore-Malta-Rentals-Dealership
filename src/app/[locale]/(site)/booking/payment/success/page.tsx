import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import {
  CheckCircle2,
  Calendar,
  Mail,
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  FileText,
  ArrowRight,
  Home,
  AlertCircle,
} from "lucide-react";
import { verifyCheckoutSession } from "@/lib/stripe/payment-service";
import type { VerifiedPaymentData } from "@/lib/stripe/payment-service";
import { PaymentVerifyingPoller } from "./payment-verifying-poller";

export const metadata: Metadata = {
  title: "Booking Confirmed | Explore Malta Rentals",
  description: "Your payment was successful and your rental is confirmed.",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return <NoSessionState locale={locale} />;
  }

  const result = await verifyCheckoutSession(sessionId);

  if (!result.ok) {
    return <ErrorState locale={locale} />;
  }

  const { data } = result;

  // Stripe confirmed payment (session.payment_status === "paid")
  if (data.paymentStatus === "paid") {
    return <SuccessState data={data} locale={locale} />;
  }

  // Edge case: user arrived before webhook fired — poll until confirmed
  return (
    <PaymentVerifyingPoller
      sessionId={sessionId}
      locale={locale}
      bookingReference={data.bookingReference}
    />
  );
}

// ─── Success State ─────────────────────────────────────────────────────────────

function SuccessState({ data, locale }: { data: VerifiedPaymentData; locale: string }) {
  const pickupLabel = data.pickupOption === "DELIVERY" ? "Delivery to" : "Pick up at office";
  const dropoffLabel = data.dropoffOption === "DROPOFF" ? "Drop off at" : "Return to office";
  const depositAtPickup = data.depositMethod === "IN_PERSON";

  return (
    <main className="min-h-[calc(100dvh-var(--site-header-offset))] bg-[var(--background)] px-4 pt-[calc(var(--site-header-offset)+3rem)] pb-20 sm:pt-[calc(var(--site-header-offset)+4rem)] sm:pb-24">
      <div className="mx-auto max-w-2xl space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex flex-col items-center text-center">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50"
            aria-hidden
          >
            <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
          </span>
          <p className="type-eyebrow mt-6 text-emerald-700">Payment confirmed</p>
          <h1 className="type-h1 mt-3 text-[var(--text-primary)]">Your rental is booked!</h1>
        </header>

        <div className="surface-panel overflow-hidden">
          <div className="p-6 sm:p-7">
            {/* Booking reference */}
            <div className="flex items-center justify-between gap-4 rounded-[var(--r-card)] border border-[var(--line-subtle)] bg-[var(--surface-sunken)] px-5 py-4">
              <div className="min-w-0">
                <p className="type-spec text-[var(--text-muted)]">Booking Reference</p>
                <p className="mt-1.5 font-mono text-2xl font-bold tracking-wider tabular-nums text-[var(--text-primary)]">
                  {data.bookingReference}
                </p>
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-field)] bg-emerald-100 text-emerald-700"
                aria-hidden
              >
                <FileText className="h-5 w-5" />
              </div>
            </div>

            {/* Payment row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-field)] border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2.5} aria-hidden />
                <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  €{data.amountEur.toFixed(2)} paid
                </span>
              </div>
              {data.paidAt && (
                <span className="text-xs tabular-nums text-[var(--text-muted)]">
                  {format(data.paidAt, "d MMM yyyy, HH:mm")}
                </span>
              )}
            </div>

            {/* Email + receipt links */}
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <div className="flex flex-1 items-center gap-2.5 rounded-[var(--r-field)] border border-[var(--line-subtle)] bg-[var(--surface-sunken)] px-4 py-3">
                <Mail className="h-4 w-4 shrink-0 text-[var(--text-faint)]" aria-hidden />
                <div className="min-w-0">
                  <p className="type-spec text-[var(--text-muted)]">Confirmation sent to</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {data.customerEmail}
                  </p>
                </div>
              </div>
              {data.stripeReceiptUrl && (
                <a
                  href={data.stripeReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--elev-1)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:border-[var(--line-strong)] hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  View Receipt
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Booking summary card ─────────────────────────────────────────── */}
        <div className="surface-panel">
          <div className="border-b border-[var(--line-subtle)] px-6 py-4">
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              Booking Summary
            </h2>
          </div>

          <div className="divide-y divide-[var(--line-subtle)]">
            {/* Vehicle */}
            <div className="flex items-start gap-4 px-6 py-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-field)] bg-blue-50">
                <span className="text-base">🛵</span>
              </div>
              <div>
                <p className="type-spec text-[var(--text-muted)]">Vehicle</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">{data.vehicleName}</p>
              </div>
            </div>

            {/* Dates + duration */}
            <div className="flex items-start gap-4 px-6 py-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-field)] bg-blue-50 text-blue-600">
                <Calendar className="h-4 w-4" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="type-spec text-[var(--text-muted)]">Rental Dates</p>
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <div>
                    <p className="type-spec text-[var(--text-faint)]">Pickup</p>
                    <p className="mt-1 font-semibold tabular-nums text-[var(--text-primary)]">
                      {format(data.pickupDateTime, "EEE, d MMM yyyy")}
                    </p>
                    <p className="text-sm tabular-nums text-[var(--text-secondary)]">
                      {format(data.pickupDateTime, "HH:mm")}
                    </p>
                  </div>
                  <div>
                    <p className="type-spec text-[var(--text-faint)]">Return</p>
                    <p className="mt-1 font-semibold tabular-nums text-[var(--text-primary)]">
                      {format(data.returnDateTime, "EEE, d MMM yyyy")}
                    </p>
                    <p className="text-sm tabular-nums text-[var(--text-secondary)]">
                      {format(data.returnDateTime, "HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-sunken)] px-3 py-1">
                  <Clock className="h-3 w-3 text-[var(--text-muted)]" aria-hidden />
                  <span className="text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
                    {data.billableDays} {data.billableDays === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pickup location */}
            <div className="flex items-start gap-4 px-6 py-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-field)] bg-blue-50 text-blue-600">
                <MapPin className="h-4 w-4" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="type-spec text-[var(--text-muted)]">Pickup</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">{pickupLabel}</p>
                {data.pickupAddress && (
                  <p className="text-sm text-[var(--text-secondary)]">{data.pickupAddress}</p>
                )}
                {data.pickupOption === "OFFICE" && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    42, Triq il-Marina, Pietà, PTA 9046
                  </p>
                )}

                <div className="mt-3 border-t border-[var(--line-subtle)] pt-3">
                  <p className="type-spec text-[var(--text-muted)]">Return</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {dropoffLabel}
                  </p>
                  {data.dropoffAddress && (
                    <p className="text-sm text-[var(--text-secondary)]">{data.dropoffAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security deposit notice */}
            {depositAtPickup && (
              <div className="flex items-start gap-4 px-6 py-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-field)] bg-amber-100 text-amber-600">
                  <Shield className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="type-spec text-[var(--text-muted)]">Security Deposit</p>
                  <p className="mt-1 font-semibold tabular-nums text-[var(--text-primary)]">
                    €{data.depositAmountEur.toFixed(2)} due at pickup
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    Fully refundable · payable in cash or card at the office
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── What to bring ────────────────────────────────────────────────── */}
        <div className="rounded-[var(--r-panel)] border border-blue-200/70 bg-blue-50/50 px-6 py-5">
          <h2 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            What to bring at pickup
          </h2>
          <ul className="mt-3 space-y-2">
            {[
              "Valid driving licence (original)",
              "Passport or national ID",
              depositAtPickup ? `€${data.depositAmountEur.toFixed(2)} security deposit (cash or card)` : null,
              "This booking reference: " + data.bookingReference,
            ]
              .filter(Boolean)
              .map((item) => (
                <li
                  key={item as string}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--text-secondary)]"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
          </ul>
        </div>

        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Link
            href={`/${locale}/booking?ref=${encodeURIComponent(data.bookingReference)}&submitted=1`}
            className="flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[var(--elev-orange)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[var(--elev-orange-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            View My Booking
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={`/${locale}`}
            className="flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-6 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--elev-1)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Home className="h-4 w-4" aria-hidden />
            Back to Home
          </Link>
        </div>

        <p className="pt-2 text-center text-xs text-[var(--text-faint)]">
          Questions?{" "}
          <a
            href="mailto:info@exploremaltarentals.com"
            className="underline underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-[var(--text-secondary)]"
          >
            info@exploremaltarentals.com
          </a>
          {" · "}
          <a
            href="https://wa.me/35677506799"
            className="underline underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-[var(--text-secondary)]"
          >
            WhatsApp
          </a>
        </p>
      </div>
    </main>
  );
}

// ─── Error States ──────────────────────────────────────────────────────────────

function NoSessionState({ locale }: { locale: string }) {
  return (
    <StateShell
      locale={locale}
      icon={<AlertCircle className="h-10 w-10 text-amber-500" />}
      iconBg="bg-amber-100 ring-8 ring-amber-50"
      title="No payment session found"
      message="If you completed a payment, check your email for a confirmation. If something went wrong, please contact us."
    />
  );
}

function ErrorState({ locale }: { locale: string }) {
  return (
    <StateShell
      locale={locale}
      icon={<AlertCircle className="h-10 w-10 text-amber-500" />}
      iconBg="bg-amber-100 ring-8 ring-amber-50"
      title="Could not verify payment"
      message="We couldn't confirm your payment status right now. If you were charged, check your email — a confirmation will arrive shortly. Otherwise contact us."
    />
  );
}

function StateShell({
  locale,
  icon,
  iconBg,
  title,
  message,
}: {
  locale: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  message: string;
}) {
  return (
    <main className="flex min-h-[calc(100dvh-var(--site-header-offset))] items-center justify-center bg-[var(--background)] px-4 pt-[calc(var(--site-header-offset)+3rem)] pb-20 sm:pb-24">
      <div className="surface-panel mx-auto w-full max-w-md p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${iconBg}`}
            aria-hidden
          >
            {icon}
          </div>
          <h1 className="type-h3 mt-6 text-[var(--text-primary)]">{title}</h1>
          <p className="type-lead mt-3">{message}</p>
        </div>
        <div className="mt-8 space-y-3">
          <Link
            href={`/${locale}/booking`}
            className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[var(--elev-orange)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[var(--elev-orange-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Look Up My Booking
          </Link>
          <Link
            href={`/${locale}`}
            className="flex min-h-[3.25rem] w-full items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-6 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--elev-1)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Back to Home
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--text-faint)]">
          <a
            href="mailto:info@exploremaltarentals.com"
            className="underline underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-[var(--text-secondary)]"
          >
            info@exploremaltarentals.com
          </a>
          {" · "}
          <a
            href="https://wa.me/35677506799"
            className="underline underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-[var(--text-secondary)]"
          >
            WhatsApp
          </a>
        </p>
      </div>
    </main>
  );
}
