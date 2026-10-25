import Image from "next/image";

import { Container } from "@/components/ui/container";
import { SiteShell } from "@/components/site-shell";
import { BrandBlueUnderlinedText } from "@/features/guide/components/brand-blue-underlined-text";
import { SectionHeader } from "@/features/home/components/section-header";
import { TourRequestForm } from "@/features/tours/components/tour-request-form";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const TOUR_BIKES_PHOTO_SRC = `/TourPage-images/${encodeURIComponent("TOURS PAGE BIKES PHOTO.webp")}`;
const TOUR_QUAD_PHOTO_SRC = `/TourPage-images/${encodeURIComponent("TOURS PAGE PHOTO QUAD.jpg")}`;
const LOCAL_EXPERTS_BG_SRC = "/local-experts.png";

function BulletList({ items }: Readonly<{ items: readonly string[] }>) {
  return (
    <ul className="mt-6 space-y-3 text-left text-sm leading-relaxed text-slate-700 sm:text-[0.9375rem] sm:leading-7">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-orange)]"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export type TourSiteContact = Readonly<{
  companyName: string;
}>;

export async function TourContent({ contact }: Readonly<{ contact: TourSiteContact }>) {
  const { companyName } = contact;
  const t = await getTranslations("Tours");

  const tourOptions = [
    t("option1"),
    t("option2"),
    t("option3"),
    t("option4"),
    t("option5"),
    t("option6"),
  ];
  const whyChoose = [t("why1"), t("why2"), t("why3"), t("why4"), t("why5")];

  return (
    <>
      <section
        id="tours-hero"
        aria-labelledby="tours-hero-title"
        className="relative isolate flex min-h-svh scroll-mt-28 flex-col overflow-hidden border-t border-slate-200/70 bg-[var(--surface-elevated)] pt-20 sm:pt-24"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-[center_38%] bg-no-repeat"
          style={{
            backgroundImage: [
              "linear-gradient(100deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.88) 42%, rgba(245,251,255,0.78) 100%)",
              `url("${TOUR_BIKES_PHOTO_SRC}")`,
            ].join(", "),
          }}
        />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center py-10 sm:py-12 lg:py-14">
          <SiteShell>
            <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
              <div className="min-w-0 max-w-2xl">
                <h1
                  id="tours-hero-title"
                  className="flex flex-col items-start gap-1 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:gap-1.5 sm:text-5xl sm:leading-[1.06] lg:text-[3.15rem]"
                >
                  <span className="text-slate-950">{t("heroLine1")}</span>
                  <BrandBlueUnderlinedText>{t("heroLine2")}</BrandBlueUnderlinedText>
                </h1>
                <p className="mt-6 max-w-xl text-base font-normal leading-7 text-slate-800 sm:text-lg sm:leading-8">
                  {t("heroLead", { companyName })}
                </p>
              </div>
              <div className="relative mx-auto hidden min-h-[min(18rem,42svh)] w-full max-w-md overflow-hidden rounded-xl border border-slate-200/90 bg-[color-mix(in_srgb,var(--surface-card)_88%,transparent)] shadow-md ring-1 ring-slate-950/[0.04] sm:min-h-[min(20rem,44svh)] lg:block lg:max-w-none">
                <Image
                  src={TOUR_QUAD_PHOTO_SRC}
                  alt={t("quadPhotoAlt")}
                  fill
                  className="object-cover object-center"
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  priority
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent"
                />
                <p className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white drop-shadow-sm">
                  {t("quadImageCaption")}
                </p>
              </div>
            </div>
          </SiteShell>
        </div>
      </section>

      <section
        id="custom-tours"
        aria-labelledby="custom-tours-title"
        className="scroll-mt-28 border-t border-slate-200/80 bg-[var(--surface-elevated)] py-12 sm:py-14 lg:py-16"
      >
        <Container>
          <div className="mx-auto w-full max-w-prose">
            <h2
              id="custom-tours-title"
              className="text-center text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[1.65rem]"
            >
              {t("customTitle")}
            </h2>
            <div className="mt-6 space-y-5 text-left text-sm leading-relaxed text-slate-600 sm:mt-7 sm:text-[0.9375rem] sm:leading-7">
              <p>{t("customP1")}</p>
              <p className="rounded-xl border border-slate-200/90 bg-[var(--surface-soft)] px-4 py-3 text-slate-700">
                {t("customHighlight")}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section
        id="guided-tours"
        aria-labelledby="guided-tours-title"
        className="relative isolate scroll-mt-28 overflow-hidden border-t border-slate-200/70 py-12 sm:py-14 lg:py-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: [
              "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(248,250,252,0.78) 50%, rgba(241,245,249,0.84) 100%)",
              `url("${LOCAL_EXPERTS_BG_SRC}")`,
            ].join(", "),
          }}
        />
        <Container className="relative z-10">
          <div className="mx-auto w-full max-w-prose">
            <h2
              id="guided-tours-title"
              className="text-center text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[1.65rem]"
            >
              {t("guidedTitle")}
            </h2>
            <p className="mt-6 text-left text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem] sm:leading-7">
              {t("guidedBody")}
            </p>
          </div>
        </Container>
      </section>

      <section
        id="tour-options"
        aria-labelledby="tour-options-title"
        className="scroll-mt-28 border-t border-slate-200/70 bg-[var(--surface-elevated)] py-14 sm:py-16"
      >
        <Container>
          <SectionHeader
            titleId="tour-options-title"
            title={t("optionsTitle")}
            tone="light"
            description={t("optionsDescription")}
          />
          <div className="mx-auto mt-2 max-w-xl">
            <BulletList items={tourOptions} />
          </div>
        </Container>
      </section>

      <section
        id="why-choose-tours"
        aria-labelledby="why-choose-tours-title"
        className="scroll-mt-28 border-t border-slate-200/70 bg-[var(--surface-soft)] py-14 sm:py-16"
      >
        <Container>
          <SectionHeader
            titleId="why-choose-tours-title"
            title={t("whyTitle")}
            tone="light"
            description={t("whyDescription")}
          />
          <div className="mx-auto mt-2 max-w-xl">
            <BulletList items={whyChoose} />
          </div>
        </Container>
      </section>

      <section
        id="book-tour-cta"
        aria-labelledby="book-tour-title"
        className="scroll-mt-28 border-t border-slate-200/70 bg-[var(--surface-soft)] py-14 sm:py-16"
      >
        <Container>
          <div className="relative isolate min-h-[min(18rem,48svh)] overflow-hidden rounded-lg border border-slate-200/60 shadow-md ring-1 ring-black/[0.04] sm:min-h-[min(19rem,44svh)]">
            <Image
              src={TOUR_BIKES_PHOTO_SRC}
              alt={t("bikesPhotoAlt")}
              fill
              className="object-cover object-[center_42%]"
              sizes="(min-width: 1280px) 76rem, 100vw"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-slate-950/[0.92] via-slate-950/72 to-slate-900/35 sm:via-slate-950/62 sm:to-slate-900/28"
            />
            <div className="relative flex min-h-[inherit] flex-col justify-center px-6 py-9 sm:px-9 sm:py-10 lg:max-w-2xl lg:py-11 lg:pl-10 lg:pr-8">
              <h2
                id="book-tour-title"
                className="text-2xl font-bold tracking-[-0.03em] text-white sm:text-[1.65rem] sm:leading-snug"
              >
                {t("ctaTitle")}
              </h2>
              <p className="mt-3 max-w-prose text-sm leading-6 text-white/90 sm:text-[0.9375rem] sm:leading-7">
                {t("ctaBody", { companyName })}
              </p>
              <p className="mt-5 max-w-prose text-sm font-semibold leading-snug text-[var(--brand-orange)] sm:text-[0.9375rem]">
                {t("ctaTagline")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/booking"
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--brand-orange)] px-5 py-2.5 text-sm font-medium tracking-tight text-slate-950 transition-colors hover:bg-[var(--brand-orange-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {t("ctaRequestTour")}
                </Link>
                <Link
                  href="/#booking-preview"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/20 bg-white px-5 py-2.5 text-sm font-medium tracking-tight text-slate-900 transition-colors hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {t("ctaVehicleRental")}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section
        id="tour-contact"
        aria-labelledby="tour-contact-title"
        className="scroll-mt-28 border-t border-slate-200/70 bg-[var(--surface-elevated)] py-14 sm:py-16"
      >
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeader
                titleId="tour-contact-title"
                title={t("contactTitle")}
                tone="light"
                align="left"
                description={t("contactDescription")}
              />
              <p className="mt-6 text-sm leading-6 text-slate-600">{t("contactWhatsAppHint")}</p>
            </div>
            <div className="lg:col-span-7">
              <TourRequestForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
