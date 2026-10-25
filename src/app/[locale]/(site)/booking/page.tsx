import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { IndicativeDailyRatesCard } from "@/components/pricing/indicative-daily-rates-card";
import { Container } from "@/components/ui/container";
import { BookingFlow } from "@/features/booking-flow/components/booking-flow";
import { Link } from "@/i18n/navigation";

const RATE_AT_GLANCE_BACKGROUND_PATH = path.join(
  process.cwd(),
  "public",
  "rate-at-glance.png",
);

function getRateAtGlanceBackgroundSrc(): string {
  try {
    const { mtimeMs } = fs.statSync(RATE_AT_GLANCE_BACKGROUND_PATH);
    return `/rate-at-glance.png?v=${mtimeMs}`;
  } catch {
    return "/rate-at-glance.png";
  }
}

type BookingPageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    vehicle?: string;
    date?: string;
    returnDate?: string;
    pickupDate?: string;
    dropoffDate?: string;
    pickupTime?: string;
    dropoffTime?: string;
    returnTime?: string;
    ref?: string;
    email?: string;
    submitted?: string;
  }>;
}>;

export async function generateMetadata({ params }: Pick<BookingPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("bookingTitle");
  const description = t("bookingDescription");
  return {
    title,
    description,
    openGraph: { title, description, locale },
  };
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "BookingPage" });
  const {
    vehicle,
    date,
    returnDate,
    pickupDate,
    dropoffDate,
    pickupTime,
    dropoffTime,
    returnTime,
    ref,
    email,
    submitted,
  } = await searchParams;
  const resolvedPickupDate = date ?? pickupDate;
  const resolvedReturnDate = returnDate ?? dropoffDate;
  const bookingLookupReference = typeof ref === "string" && ref.trim().length > 0 ? ref.trim() : undefined;
  const bookingLookupEmail = typeof email === "string" && email.trim().length > 0 ? email.trim() : undefined;
  const bookedVehicleLabel =
    typeof vehicle === "string" && vehicle.trim().length > 0 ? vehicle.trim() : undefined;
  const bookingSubmittedBanner = submitted === "1" || submitted === "true";
  const rateAtGlanceBackgroundSrc = getRateAtGlanceBackgroundSrc();

  return (
    <main className="flex flex-1 flex-col">
      <section
        aria-labelledby="booking-heading"
        className="relative isolate flex min-h-dvh scroll-mt-28 flex-col overflow-hidden border-b border-slate-200/70 bg-[var(--surface-elevated)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-slate-100"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-white/35"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-white/[0.08]"
        />

        <Container className="relative z-10 flex min-h-0 flex-1 flex-col justify-end pt-20 pb-10 sm:pt-24 sm:pb-14">
          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <header className="text-center sm:text-left">
              <h1
                id="booking-heading"
                className="text-4xl font-bold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl"
              >
                {t("heading")}
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:mx-0 sm:text-lg">
                {t("intro")}
              </p>
            </header>

            <div className="mt-10">
              <BookingFlow
                initialVehicleSlug={vehicle}
                initialRental={{
                  pickupDate: resolvedPickupDate,
                  returnDate: resolvedReturnDate,
                  pickupTime,
                  returnTime: returnTime ?? dropoffTime,
                }}
                bookingLookupReference={bookingLookupReference}
                bookingLookupEmail={bookingLookupEmail}
                bookingSubmittedBanner={bookingSubmittedBanner}
                bookedVehicleLabel={bookedVehicleLabel}
              />
            </div>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="booking-indicative-rates-heading"
        className="relative isolate scroll-mt-28 overflow-hidden border-t border-slate-200/70 py-12 sm:py-16"
      >
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src={rateAtGlanceBackgroundSrc}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/40 to-slate-950/65" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_45%,rgba(0,0,0,0.22),transparent)]" />
        </div>

        <Container className="relative z-10">
          <div className="mx-auto max-w-5xl">
            <h2
              id="booking-indicative-rates-heading"
              className="text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl"
            >
              {t("ratesHeading")}
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-300">{t("ratesDescription")}</p>
            <div className="mt-8 w-full">
              <IndicativeDailyRatesCard />
            </div>
            <p className="mt-8 text-center text-sm text-slate-300 sm:text-left">
              {t("ratesLinkLead")}{" "}
              <Link
                href="/#services"
                className="font-semibold text-white underline decoration-[var(--brand-orange)]/55 underline-offset-4 transition-colors hover:text-[var(--brand-orange-strong)] hover:decoration-[var(--brand-orange)]"
              >
                {t("ratesLink")}
              </Link>
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
