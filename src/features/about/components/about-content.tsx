import Image from "next/image";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { IndicativeDailyRatesCard } from "@/components/pricing/indicative-daily-rates-card";
import { SiteShell } from "@/components/site-shell";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/features/home/components/section-header";
import { WhatWeOfferSlider } from "@/features/about/components/what-we-offer-slider";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const EXPLORE_MALTA_BACKDROP = "/malta.png";
const ABOUT_US_IMAGE = "/about-us-image.png";

const FLEET_NECO_ONE_SRC = `/BikeImages/${encodeURIComponent("neco one.png")}`;
const FLEET_LEX_AURA_SRC = `/BikeImages/${encodeURIComponent("lex moto grey.png")}`;

export type AboutSiteContact = Readonly<{
  companyName: string;
}>;

function AboutUsHeadingWithWave({
  titleId,
  label,
}: Readonly<{ titleId: string; label: string }>) {
  return (
    <h2 id={titleId} className="type-h2 mx-auto inline-block">
      <span className="relative inline-flex flex-col items-center">
        <span className="px-0.5 text-[var(--text-primary)]">{label}</span>
        <svg
          viewBox="0 0 200 16"
          aria-hidden
          className="-mt-1 block h-[0.65rem] w-[68%] max-w-[9.5rem] min-w-[5.5rem] overflow-visible text-orange-400 sm:-mt-1.5 sm:h-[0.7rem] sm:w-[70%] sm:max-w-[10rem] sm:min-w-[6rem]"
          preserveAspectRatio="none"
        >
          <path
            d="M3 11 C 10 15, 22 7, 36 10 C 52 13, 64 4, 82 9 C 100 14, 114 5, 132 10 C 150 15, 166 6, 184 11 C 192 13, 197 12, 197 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </h2>
  );
}

function FleetDisplacementBadge({
  displacement,
  variant,
}: Readonly<{ displacement: string; variant: "orange" | "blue" }>) {
  const tone =
    variant === "orange"
      ? "bg-orange-50 text-orange-900 ring-orange-200/80"
      : "bg-blue-50 text-blue-900 ring-blue-200/80";
  return (
    <span
      className={`type-spec inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ${tone}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3 shrink-0 opacity-90"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v2.5l2.2 2.2" />
        <path d="M5 14h2" />
        <path d="M17 14h2" />
      </svg>
      {displacement}
    </span>
  );
}

function FleetModelCard({
  imageSrc,
  imageAlt,
  displacement,
  variant,
  categoryLabel,
  title,
  imagePanelClassName,
  children,
}: Readonly<{
  imageSrc: string;
  imageAlt: string;
  displacement: string;
  variant: "orange" | "blue";
  categoryLabel: string;
  title: string;
  imagePanelClassName: string;
  children: ReactNode;
}>) {
  return (
    <article className="surface-panel lift group grid min-h-0 grid-cols-1 overflow-hidden sm:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] sm:items-stretch">
      <div className="flex min-h-0 flex-col justify-center border-b border-[var(--line-subtle)] px-6 py-6 sm:border-b-0 sm:border-r sm:px-7 sm:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <FleetDisplacementBadge displacement={displacement} variant={variant} />
          <span className="type-spec text-[var(--text-muted)]">{categoryLabel}</span>
        </div>
        <h3 className="type-h3 mt-3 text-[var(--text-primary)]">{title}</h3>
        {children}
      </div>
      <div
        className={`relative flex min-h-[min(14rem,38svh)] items-center justify-center p-6 sm:min-h-0 sm:p-7 ${imagePanelClassName}`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={640}
          height={512}
          className="h-auto w-full max-h-[min(12rem,36svh)] object-contain object-center drop-shadow-[0_18px_32px_rgba(16,34,47,0.16)] transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:max-h-[min(16rem,36svh)] sm:w-full"
          sizes="(min-width: 640px) 38vw, 92vw"
        />
      </div>
    </article>
  );
}

function AboutHeroTitle({ titleId, title }: Readonly<{ titleId: string; title: string }>) {
  return (
    <h1
      id={titleId}
      className="type-display max-w-[22ch] text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.45)] lg:max-w-[24ch]"
    >
      {title}
    </h1>
  );
}

export async function AboutContent({ contact }: Readonly<{ contact: AboutSiteContact }>) {
  const { companyName } = contact;
  const t = await getTranslations("About");
  const tCommon = await getTranslations("Common");
  const tBrand = await getTranslations("Brand");

  return (
    <>
      <section
        id="company-story"
        aria-labelledby="about-story-hero-title"
        className="relative isolate flex min-h-svh w-full scroll-mt-28 flex-col overflow-hidden bg-[var(--ink-950)] pt-[var(--site-header-offset)]"
      >
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 bg-[var(--ink-950)]">
            <Image
              src={ABOUT_US_IMAGE}
              alt=""
              fill
              unoptimized
              className="object-cover object-center"
              sizes="100vw"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-[var(--ink-950)]/20" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,20,32,0.58)_0%,rgba(10,20,32,0.22)_48%,rgba(10,20,32,0.10)_100%)]" />
        </div>
        <div className="grain relative z-10 flex min-h-0 flex-1 flex-col justify-end pb-16 pt-12 sm:pb-20 sm:pt-14 lg:pb-28 lg:pt-16">
          <SiteShell>
            <Reveal className="w-full max-w-4xl text-left" y={28} duration={0.85}>
              <AboutHeroTitle titleId="about-story-hero-title" title={t("heroTitle")} />
            </Reveal>
          </SiteShell>
        </div>
      </section>

      <section
        id="company-story-narrative"
        aria-labelledby="company-story-narrative-title"
        className="scroll-mt-28 border-t border-[var(--line-subtle)] bg-[var(--surface-card)] py-20 sm:py-24 lg:py-32"
      >
        <Container>
          <div className="mx-auto w-full max-w-[68ch]">
            <Reveal as="header" className="text-center" y={16}>
              <AboutUsHeadingWithWave
                titleId="company-story-narrative-title"
                label={t("headingWave")}
              />
            </Reveal>
            <Reveal
              className="mt-12 space-y-6 text-left text-[length:var(--text-lead)] leading-[1.72] text-[var(--text-secondary)] sm:mt-14"
              y={20}
              delay={0.06}
            >
              <p>{t("narrativeP1", { companyName })}</p>
              <p>{t("narrativeP2")}</p>
              <p>{t("narrativeP3")}</p>
              <p>{t("narrativeP4")}</p>
              <p>{t("narrativeP5")}</p>
              <p>{t("narrativeP6")}</p>
              <hr className="rule-fade mt-12 mb-2" aria-hidden />
              <p className="type-h3 text-[var(--text-primary)]">{t("journeyStarts")}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section
        id="what-we-offer"
        aria-labelledby="about-offer-title"
        className="scroll-mt-28 border-t border-[var(--line-subtle)] bg-[var(--surface-band)] py-20 sm:py-24 lg:py-28"
      >
        <Container>
          <Reveal
            className="grain relative isolate overflow-hidden rounded-[var(--r-feature)] bg-[var(--surface-inverse)] p-7 text-white shadow-[var(--elev-5)] ring-1 ring-inset ring-[var(--line-inverse)] sm:p-10 lg:p-12"
            y={24}
            scale={0.985}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_58%_at_50%_0%,rgba(85,152,193,0.20),transparent_58%)]"
              aria-hidden
            />
            <div className="relative max-w-2xl">
              <p className="type-eyebrow text-orange-300">{tBrand("locationKicker")}</p>
              <h2 id="about-offer-title" className="type-h2 mt-4 text-white">
                {tBrand("primaryHeadline")}
              </h2>
              <p className="mt-5 text-[length:var(--text-lead)] leading-[1.62] text-white/82">
                {tBrand("primaryBody")}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-[1.7] text-white/62">
                {tBrand("primarySupporting")}
              </p>
            </div>
          </Reveal>
          <WhatWeOfferSlider />
        </Container>
      </section>

      <section
        id="explore-malta"
        aria-labelledby="about-explore-title"
        className="scroll-mt-28 border-t border-[var(--line-subtle)] bg-[var(--surface-sunken)] py-20 sm:py-24 lg:py-28"
      >
        <Container>
          <Reveal
            className="relative isolate min-h-[min(19rem,54svh)] overflow-hidden rounded-[var(--r-feature)] shadow-[var(--elev-4)] ring-1 ring-inset ring-[var(--line)] sm:min-h-[min(21rem,50svh)] lg:min-h-[min(23rem,46svh)]"
            y={24}
            scale={0.99}
          >
            <Image
              src={EXPLORE_MALTA_BACKDROP}
              alt={t("maltaImageAlt")}
              fill
              className="object-cover object-[center_35%]"
              sizes="(min-width: 1280px) 76rem, 100vw"
              priority={false}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-[rgba(10,20,32,0.94)] via-[rgba(10,20,32,0.74)] to-[rgba(10,20,32,0.34)] sm:via-[rgba(10,20,32,0.62)] sm:to-[rgba(10,20,32,0.22)]"
            />
            <div className="relative flex min-h-[inherit] flex-col justify-center px-7 py-11 sm:px-10 sm:py-12 lg:max-w-2xl lg:py-14 lg:pl-12 lg:pr-8">
              <p className="type-eyebrow text-white/70">{t("exploreKicker")}</p>
              <h2 id="about-explore-title" className="type-h2 mt-4 text-white">
                {t("exploreTitle")}
              </h2>
              <p className="mt-5 max-w-[52ch] text-[length:var(--text-lead)] leading-[1.62] text-white/86">
                {t("exploreBody")}
              </p>
              <p className="mt-6 max-w-[48ch] text-[0.9375rem] font-semibold leading-snug text-orange-300">
                {t("exploreCta")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/booking"
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--r-field)] bg-orange-400 px-6 py-2.5 text-sm font-semibold tracking-tight text-[var(--ink-950)] shadow-[var(--elev-orange)] transition-[background-color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-[var(--elev-orange-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-950)] motion-reduce:hover:translate-y-0"
                >
                  {tCommon("bookNow")}
                </Link>
                <Link
                  href="/#contact"
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--r-field)] bg-white/10 px-6 py-2.5 text-sm font-semibold tracking-tight text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm transition-[background-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-white/18 hover:ring-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-950)]"
                >
                  {t("checkAvailability")}
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <section
        id="fleet-licensing"
        aria-labelledby="about-fleet-title"
        className="scroll-mt-28 border-t border-[var(--line-subtle)] bg-[var(--surface-band)] py-20 sm:py-24 lg:py-32"
      >
        <Container>
          <Reveal y={18}>
            <SectionHeader
              titleId="about-fleet-title"
              title={t("fleetSectionTitle")}
              tone="light"
              description={t("fleetSectionDescription")}
            />
          </Reveal>
          <Stagger className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10" step={0.09}>
            <StaggerItem>
              <FleetModelCard
                imageSrc={FLEET_NECO_ONE_SRC}
                imageAlt={t("fleet50Alt")}
                displacement="50cc"
                variant="orange"
                categoryLabel={t("categoryScooter")}
                title="NECO ONE 12"
                imagePanelClassName="bg-[linear-gradient(160deg,var(--surface-sunken)_0%,#e6f0f8_44%,var(--surface-card)_100%)]"
              >
                <p className="mt-3 text-[0.9375rem] leading-[1.65] text-[var(--text-secondary)]">
                  {t("fleet50Body")}
                </p>
              </FleetModelCard>
            </StaggerItem>

            <StaggerItem>
              <FleetModelCard
                imageSrc={FLEET_LEX_AURA_SRC}
                imageAlt={t("fleet125Alt")}
                displacement="125cc"
                variant="blue"
                categoryLabel={t("categoryMotorcycle")}
                title="LEX MOTO AURA"
                imagePanelClassName="bg-[linear-gradient(160deg,var(--surface-sunken)_0%,#e7eef7_42%,var(--surface-card)_100%)]"
              >
                <p className="mt-3 text-[0.9375rem] leading-[1.65] text-[var(--text-secondary)]">
                  {t("fleet125Body")}
                </p>
              </FleetModelCard>
            </StaggerItem>
          </Stagger>

          <Reveal className="mt-14" y={20}>
            <IndicativeDailyRatesCard />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
