import type { CSSProperties } from "react";
import fs from "node:fs";
import path from "node:path";
import { getTranslations } from "next-intl/server";import { SiteShell } from "@/components/site-shell";
import {
  HeroCinematicStage,
  HeroVideoTrigger,
} from "@/features/home/components/hero-cinematic-stage";
import { Link } from "@/i18n/navigation";

function getHeroBackgroundSrc(filename: string): string {
  const filePath = path.join(process.cwd(), "public", "hero-section", filename);
  try {
    const { mtimeMs } = fs.statSync(filePath);
    return `/hero-section/${filename}?v=${mtimeMs}`;
  } catch {
    return `/hero-section/${filename}`;
  }
}

function delay(ms: number): CSSProperties {
  return { "--hero-delay": `${ms}ms` } as CSSProperties;
}

function PinIcon({ className = "h-4 w-4 text-[var(--brand-orange)]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s6-5.2 6-10.2a6 6 0 1 0-12 0C6 15.8 12 21 12 21Z" />
      <circle cx="12" cy="10.8" r="2.2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Splits "Explore Malta Your Way" → lead + script accent phrase. */
function splitHeroTitle(title: string): { lead: string; accent: string } {
  const trimmed = title.trim();
  const yourWayMatch = trimmed.match(/^(.*)\s+(Your Way)$/i);
  if (yourWayMatch) {
    return { lead: yourWayMatch[1].trim(), accent: yourWayMatch[2] };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { lead: "", accent: trimmed };
  const accent = parts.pop() as string;
  return { lead: parts.join(" "), accent };
}

export async function PremiumLandingHero() {
  const tBrand = await getTranslations("Brand");
  const tNav = await getTranslations("Nav");

  const { lead, accent } = splitHeroTitle(tBrand("heroTitle"));
  const heroBackgroundSrc = getHeroBackgroundSrc("background-2.png");
  const heroBackgroundSrcMobile = getHeroBackgroundSrc("background.png");

  return (
    <HeroCinematicStage
      heroBackgroundSrc={heroBackgroundSrc}
      heroBackgroundSrcMobile={heroBackgroundSrcMobile}
    >
        <SiteShell>
          <div className="flex min-h-[calc(100svh-var(--site-header-offset)-var(--site-hero-content-inset)-2.5rem)] flex-col pt-6 pb-1 sm:pt-8 sm:pb-2 lg:pt-10 lg:pb-3">
            {/* Location pill — top right */}
            <div className="hero-rise mt-6 flex shrink-0 justify-end sm:mt-4 lg:mt-6" style={delay(0)}>
              <span className="hero-cinematic__location inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 backdrop-blur-md sm:gap-2 sm:px-4 sm:py-2">
                <PinIcon className="h-3 w-3 shrink-0 text-[var(--brand-orange)] sm:h-4 sm:w-4" />
                {tBrand("locationKicker")}
              </span>
            </div>

            {/* Main copy — anchored lower in the hero, lifted slightly from the bottom edge */}
            <div className="mt-auto mb-4 translate-y-8 sm:mb-8 sm:translate-y-10 lg:mb-10 lg:translate-y-12">
              <div className="max-w-xl lg:max-w-2xl">
              <h1
                id="home-hero-title"
                className="hero-aquatico-heading hero-rise text-balance"
                style={delay(80)}
              >
                <span className="hero-aquatico-heading__line block">
                  {lead}
                </span>
                <span className="hero-display-accent mt-1 block">
                  {accent}
                </span>
              </h1>

              <p
                className="hero-cinematic__description hero-rise mt-5 sm:mt-6"
                style={delay(160)}
              >
                {tBrand("heroDescription")}
              </p>

              <div className="hero-rise mt-7 sm:mt-8" style={delay(240)}>
                <Link href="/booking" className="hero-cta-book">
                  <span className="hero-cta-book__shine" aria-hidden="true" />
                  <span className="hero-cta-book__label">{tNav("bookNow")}</span>
                  <span className="hero-cta-book__arrow" aria-hidden="true">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </div>

              <div className="hero-rise mt-4 sm:mt-5" style={delay(320)}>
                <HeroVideoTrigger />
              </div>
            </div>
            </div>
          </div>
        </SiteShell>
    </HeroCinematicStage>
  );
}
