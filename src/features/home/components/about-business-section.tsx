import Image from "next/image";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeader } from "@/features/home/components/section-header";
import { aboutBusiness } from "@/features/home/data/home-sections";
import { getTranslations } from "next-intl/server";

const BIKE_IMAGES_BASE = "/BikeImages";

const iconStroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const badgeClass =
  "inline-flex items-center gap-2 rounded-full bg-[var(--surface-card)] px-4 py-2.5 text-sm font-semibold text-ink-800 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-1)]";

function BadgeTouristIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-orange-500"
      {...iconStroke}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function BadgeSafetyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-blue-600"
      {...iconStroke}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export async function AboutBusinessSection() {
  const t = await getTranslations("Home");
  const bgSrc = `${BIKE_IMAGES_BASE}/${encodeURIComponent(aboutBusiness.backgroundImage)}`;

  return (
    <section
      id="about"
      aria-labelledby="about-business-title"
      className="relative scroll-mt-28 overflow-hidden border-t border-[var(--line-subtle)] bg-[var(--surface-card)] py-20 sm:py-24 lg:py-32"
    >
      <Container className="relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <Reveal as="div" y={24} className="min-w-0">
            <SectionHeader
              titleId="about-business-title"
              title={t("aboutBusinessTitle")}
              tone="light"
              description={
                <span className="block">{t("aboutBusinessTagline")}</span>
              }
              align="left"
            />

            <div className="mt-9">
              <p className="text-base leading-[1.75] text-ink-700">
                {t("aboutParagraph1")}
              </p>
              <p className="mt-4 text-base leading-[1.75] text-ink-600">
                {t("aboutParagraph2")}
              </p>

              <div
                className="surface-card mt-9 p-5 sm:p-6"
                role="note"
                aria-label={t("aboutPricingLabel")}
              >
                <p className="type-eyebrow text-orange-600">
                  {t("aboutPricingLabel")}
                </p>
                <p className="mt-3 text-xl font-bold tracking-[-0.03em] tabular-nums text-ink-900 sm:text-2xl">
                  {t("aboutPricingFrom")}
                </p>
                <p className="mt-2.5 text-sm leading-[1.65] text-ink-600 sm:text-[0.9375rem]">
                  {t("aboutPricingSupporting")}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className={badgeClass}>
                  <BadgeTouristIcon />
                  {t("aboutBadgeTourist")}
                </span>
                <span className={badgeClass}>
                  <BadgeSafetyIcon />
                  {t("aboutBadgeSafety")}
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal
            as="div"
            delay={0.1}
            y={26}
            scale={0.97}
            className="relative mx-auto w-full"
          >
            <div className="relative isolate flex h-[min(22rem,58vh)] min-h-[18rem] w-full items-center justify-center overflow-hidden rounded-[var(--r-feature)] bg-[linear-gradient(170deg,var(--blue-50)_0%,#f4f7fa_52%,var(--surface-sunken)_100%)] shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-3)] sm:h-[min(26rem,56vh)] sm:min-h-[20rem] lg:h-[min(30rem,32rem)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[80%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgb(58_124_165_/_0.12),transparent_70%)] blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 right-[-8%] h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgb(255_169_57_/_0.18),transparent_66%)] blur-2xl"
              />
              <Image
                src={bgSrc}
                alt={t("aboutFleetImageAlt")}
                fill
                className="origin-center scale-[1.04] object-contain object-center p-6 sm:p-8"
                sizes="(min-width: 1024px) 42vw, 100vw"
                priority={false}
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
