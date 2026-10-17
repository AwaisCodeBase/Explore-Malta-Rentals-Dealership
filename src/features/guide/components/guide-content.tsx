import Image from "next/image";
import { MapPin } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { BrandBlueUnderlinedText } from "@/features/guide/components/brand-blue-underlined-text";
import { GuideParkingRulesSection } from "@/features/guide/components/guide-parking-rules-section";
import { SectionHeader } from "@/features/home/components/section-header";
import { SITE_GOOGLE_MAPS_URL } from "@/lib/site-brand-copy";
import { getTranslations } from "next-intl/server";

const TOURIST_GUIDE_MAP_SRC = "/guide%20map.png";
const GUIDE_PAGE_HERO_BACKDROP = `/${encodeURIComponent("guide pge photo.webp")}`;

function isHttpUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GuideContent({
  location,
  address,
}: Readonly<{
  location: string;
  address: string;
}>) {
  const t = await getTranslations("Guide");
  const tBrand = await getTranslations("Brand");
  const mapsPageUrl = isHttpUrl(location) ? location.trim() : undefined;
  const locationTitle = mapsPageUrl ? address : location;
  const openMapsHref = SITE_GOOGLE_MAPS_URL;
  const mapEmbedSrc =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL?.trim() ||
    `https://maps.google.com/maps?q=Explore+Malta+Rentals,+Pieta,+Malta&ll=35.8930132,14.4967482&z=16&hl=en&output=embed`;

  return (
    <>
      <section
        id="guide-location"
        aria-labelledby="guide-location-title"
        className="relative isolate flex min-h-svh scroll-mt-28 items-center overflow-hidden bg-[var(--surface-card)] pt-[calc(var(--site-header-offset)+2rem)] pb-16 sm:pt-[calc(var(--site-header-offset)+3rem)] sm:pb-20 lg:pb-24"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: [
              "linear-gradient(100deg, rgba(251,251,250,0.95) 0%, rgba(243,245,248,0.90) 45%, rgba(238,241,245,0.92) 100%)",
              `url("${GUIDE_PAGE_HERO_BACKDROP}")`,
            ].join(", "),
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,var(--background))]"
        />
        <Container>
          <div className="relative z-10">
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
              <Reveal className="text-left" y={24} duration={0.8}>
                <h1 id="guide-location-title" className="type-h1 text-[var(--text-primary)]">
                  <span>{t("findUsLine1")} </span>
                  <BrandBlueUnderlinedText>{t("findUsLine2")}</BrandBlueUnderlinedText>
                </h1>
                <p className="mt-7 max-w-[52ch] text-[length:var(--text-lead)] leading-[1.68] text-[var(--text-secondary)]">
                  {t("mapIntro")}
                </p>
              </Reveal>
              <Reveal
                className="surface-panel overflow-hidden"
                y={28}
                delay={0.08}
                scale={0.985}
              >
                <div className="grid gap-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <iframe
                    title={t("mapIframeTitle")}
                    src={mapEmbedSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-[min(23rem,56svh)] w-full border-0 md:h-[min(28rem,62svh)]"
                  />
                  <div className="flex flex-col justify-center border-t border-[var(--line-subtle)] bg-[var(--surface-band)] px-6 py-7 md:border-t-0 md:border-l">
                    <p className="type-eyebrow flex items-center gap-2 text-orange-600">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-200/80">
                        <MapPin className="size-3.5 shrink-0 stroke-[2.25]" aria-hidden />
                      </span>
                      {t("currentLocation")}
                    </p>
                    <h2 className="type-h3 mt-4 text-[var(--text-primary)]">{locationTitle}</h2>
                    {mapsPageUrl ? null : (
                      <p className="mt-3 text-[0.9375rem] leading-[1.65] text-[var(--text-secondary)]">
                        {address}
                      </p>
                    )}
                    <a
                      href={openMapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex w-fit items-center text-sm font-semibold text-[var(--text-primary)] underline decoration-orange-400/50 decoration-2 underline-offset-4 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:text-orange-700 hover:decoration-orange-400"
                    >
                      {t("openMaps")}
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <section
        id="guide-pieta-brand"
        aria-labelledby="guide-pieta-brand-title"
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
              <h2 id="guide-pieta-brand-title" className="type-h2 mt-4 text-white">
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
        </Container>
      </section>

      <section
        id="guide-map"
        aria-labelledby="guide-map-title"
        className="scroll-mt-28 border-t border-[var(--line-subtle)] bg-[var(--surface-card)] py-20 sm:py-24 lg:py-32"
      >
        <Container>
          <Reveal y={18}>
            <SectionHeader
              titleId="guide-map-title"
              title={t("mapSectionTitle")}
              tone="light"
              description={t("mapSectionDescription")}
            />
          </Reveal>
          <Reveal
            className="mt-14 overflow-hidden rounded-[var(--r-feature)] bg-[var(--surface-band)] p-3 shadow-[var(--elev-3)] ring-1 ring-inset ring-[var(--line-subtle)] sm:p-4"
            y={24}
            scale={0.99}
          >
            <Image
              src={TOURIST_GUIDE_MAP_SRC}
              alt={t("mapImageAlt")}
              width={2200}
              height={1500}
              className="h-auto w-full rounded-[var(--r-card)] object-cover object-center"
              sizes="(min-width: 1280px) 76rem, 96vw"
              priority
            />
          </Reveal>
        </Container>
      </section>

      <GuideParkingRulesSection />
    </>
  );
}
