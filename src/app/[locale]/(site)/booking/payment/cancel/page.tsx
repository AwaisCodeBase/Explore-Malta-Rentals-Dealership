import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, AlertTriangle, MessageCircle, ArrowLeft, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { RetryPaymentButton } from "./retry-payment-button";

export const metadata: Metadata = {
  title: "Payment Cancelled | Explore Malta Rentals",
  description: "Your payment was cancelled. Retry within the checkout window to confirm your rental.",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
};

export default async function PaymentCancelPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { ref: bookingReference } = await searchParams;

  const booking = bookingReference
    ? await prisma.booking.findUnique({
        where: { bookingReference },
        select: {
          bookingReference: true,
          customerFullName: true,
          customerEmail: true,
          vehicleNameSnapshot: true,
          pickupDateTime: true,
          returnDateTime: true,
          billableDays: true,
          totalDueOnline: true,
          paymentStatus: true,
          status: true,
        },
      })
    : null;

  // If already paid (user came back to cancel URL by mistake)
  if (booking?.paymentStatus === "PAID") {
    return (
      <main className="flex min-h-[calc(100dvh-var(--site-header-offset))] items-center justify-center bg-[var(--background)] px-4 pt-[calc(var(--site-header-offset)+3rem)] pb-20 sm:pb-24">
        <div className="surface-panel mx-auto w-full max-w-md p-8 text-center sm:p-10">
          <p className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl ring-8 ring-emerald-50/60 mx-auto">
            ✅
          </p>
          <h1 className="type-h3 mt-6 text-[var(--text-primary)]">This booking is already paid</h1>
          <p className="type-lead mt-3">
            Your rental{" "}
            <span className="font-mono font-bold tabular-nums text-[var(--text-primary)]">
              {bookingReference}
            </span>{" "}
            is confirmed.
          </p>
          <Link
            href={`/${locale}/booking?ref=${encodeURIComponent(bookingReference ?? "")}&submitted=1`}
            className="mt-8 flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[var(--elev-orange)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[var(--elev-orange-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            View My Booking
          </Link>
        </div>
      </main>
    );
  }

  // Checkout window expired / payment failed — vehicle already released
  if (booking?.status === "CANCELLED") {
    return (
      <main className="flex min-h-[calc(100dvh-var(--site-header-offset))] items-center justify-center bg-[var(--background)] px-4 pt-[calc(var(--site-header-offset)+3rem)] pb-20 sm:pb-24">
        <div className="surface-panel mx-auto w-full max-w-md p-8 text-center sm:p-10">
          <span
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-faint)] ring-8 ring-[var(--surface-band)]"
            aria-hidden
          >
            <XCircle className="h-10 w-10" />
          </span>
          <h1 className="type-h3 mt-6 text-[var(--text-primary)]">Payment window expired</h1>
          <p className="type-lead mt-3">
            Booking{" "}
            <span className="font-mono font-bold tabular-nums text-[var(--text-primary)]">
              {bookingReference}
            </span>{" "}
            was cancelled because payment was not completed in time. The vehicle has been released
            for other customers.
          </p>
          <Link
            href={`/${locale}/vehicles`}
            className="mt-8 flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[var(--elev-orange)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[var(--elev-orange-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Browse vehicles
          </Link>
        </div>
      </main>
    );
  }

  const amountDue = booking ? Number(booking.totalDueOnline).toFixed(2) : null;
  const canRetry =
    !!booking &&
    (booking.status === "PENDING_PAYMENT" || booking.status === "CONFIRMED");

  return (
    <main className="min-h-[calc(100dvh-var(--site-header-offset))] bg-[var(--background)] px-4 pt-[calc(var(--site-header-offset)+3rem)] pb-20 sm:pt-[calc(var(--site-header-offset)+4rem)] sm:pb-24">
      <div className="mx-auto max-w-xl space-y-5">

        <header className="flex flex-col items-center text-center">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 ring-8 ring-red-50"
            aria-hidden
          >
            <XCircle className="h-10 w-10" strokeWidth={2} />
          </span>
          <p className="type-eyebrow mt-6 text-red-700">Payment not completed</p>
          <h1 className="type-h1 mt-3 text-[var(--text-primary)]">Payment cancelled</h1>
        </header>

        <div className="surface-panel overflow-hidden">
          <div className="p-6 sm:p-7">
            <p className="type-lead">
              You left the payment page before completing the transaction. Your booking is held
              temporarily — complete payment now to confirm your rental.
            </p>

            <div className="mt-5 flex items-start gap-3 rounded-[var(--r-card)] border border-amber-200 bg-amber-50 px-4 py-3.5">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                strokeWidth={2}
                aria-hidden
              />
              <p className="text-sm leading-relaxed text-amber-900">
                <span className="font-semibold">Vehicle held for 30 minutes.</span>{" "}
                If payment is not completed within the checkout window, this booking is cancelled
                automatically and the vehicle is released.
              </p>
            </div>
          </div>
        </div>

        {booking && (
          <div className="surface-panel">
            <div className="border-b border-[var(--line-subtle)] px-6 py-4">
              <p className="type-spec text-[var(--text-muted)]">Awaiting Payment</p>
              <p className="mt-1.5 font-mono text-xl font-bold tracking-wider tabular-nums text-[var(--text-primary)]">
                {booking.bookingReference}
              </p>
            </div>

            <div className="divide-y divide-[var(--line-subtle)]">
              <div className="flex justify-between gap-4 px-6 py-3 text-sm">
                <span className="text-[var(--text-secondary)]">Vehicle</span>
                <span className="text-right font-semibold text-[var(--text-primary)]">
                  {booking.vehicleNameSnapshot ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4 px-6 py-3 text-sm">
                <span className="text-[var(--text-secondary)]">Pickup</span>
                <span className="text-right font-semibold tabular-nums text-[var(--text-primary)]">
                  {format(booking.pickupDateTime, "EEE d MMM, HH:mm")}
                </span>
              </div>
              <div className="flex justify-between gap-4 px-6 py-3 text-sm">
                <span className="text-[var(--text-secondary)]">Return</span>
                <span className="text-right font-semibold tabular-nums text-[var(--text-primary)]">
                  {format(booking.returnDateTime, "EEE d MMM, HH:mm")}
                </span>
              </div>
              <div className="flex justify-between gap-4 px-6 py-3 text-sm">
                <span className="text-[var(--text-secondary)]">Duration</span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {booking.billableDays} {booking.billableDays === 1 ? "day" : "days"}
                </span>
              </div>
              {amountDue && (
                <div className="flex items-baseline justify-between gap-4 px-6 py-3.5 text-sm">
                  <span className="text-[var(--text-secondary)]">Amount due</span>
                  <span className="text-lg font-bold tabular-nums tracking-[-0.02em] text-[var(--text-primary)]">
                    €{amountDue}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-1">
          {canRetry && bookingReference ? (
            <RetryPaymentButton
              bookingReference={bookingReference}
              locale={locale}
              amountDue={amountDue}
            />
          ) : null}

          <Link
            href={`/${locale}/vehicles`}
            className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-6 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--elev-1)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Browse vehicles instead
          </Link>
        </div>

        <div className="surface-card px-6 py-5">
          <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            Need help?
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
            If your card was declined or you hit an issue, contact us and we&apos;ll sort it out.
          </p>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <a
              href="mailto:info@exploremaltarentals.com"
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-sunken)] px-4 text-sm font-semibold text-[var(--text-primary)] transition duration-[var(--dur-fast)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Email us
            </a>
            <a
              href="https://wa.me/35677506799"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--r-field)] border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition duration-[var(--dur-fast)] hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <Phone className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
