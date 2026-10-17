"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/features/home/components/section-header";

import { BrandBlueUnderlinedText } from "@/features/guide/components/brand-blue-underlined-text";
import {
  GuideParkingRulesSlider,
  type ActiveLineColorId,
} from "@/features/guide/components/guide-parking-rules-slider";

/** Radial wash from bottom-left — keyed by active line-colour tab */
const LINE_COLOR_CORNER_SHADE: Record<ActiveLineColorId, string> = {
  white:
    "radial-gradient(ellipse 130% 125% at 0% 100%, rgba(214, 223, 232, 0.55) 0%, rgba(234, 239, 244, 0.16) 48%, rgba(251, 251, 250, 0) 78%)",
  yellow:
    "radial-gradient(ellipse 130% 125% at 0% 100%, rgba(255, 194, 113, 0.42) 0%, rgba(255, 239, 212, 0.18) 48%, rgba(251, 251, 250, 0) 78%)",
  blue:
    "radial-gradient(ellipse 130% 125% at 0% 100%, rgba(130, 184, 216, 0.42) 0%, rgba(216, 234, 245, 0.16) 48%, rgba(251, 251, 250, 0) 78%)",
  green:
    "radial-gradient(ellipse 130% 125% at 0% 100%, rgba(122, 199, 168, 0.40) 0%, rgba(214, 238, 229, 0.14) 48%, rgba(251, 251, 250, 0) 78%)",
};

const NEUTRAL_CORNER_SHADE =
  "radial-gradient(ellipse 125% 118% at 0% 100%, rgba(214, 223, 232, 0.34) 0%, rgba(234, 239, 244, 0.10) 50%, rgba(251, 251, 250, 0) 76%)";

export function GuideParkingRulesSection() {
  const t = useTranslations("Guide");
  const [activeLineTint, setActiveLineTint] = useState<ActiveLineColorId | null>("white");

  const shade =
    activeLineTint === null ? NEUTRAL_CORNER_SHADE : LINE_COLOR_CORNER_SHADE[activeLineTint];

  return (
    <section
      id="guide-parking-rules"
      aria-labelledby="guide-parking-rules-title"
      className="relative isolate scroll-mt-28 overflow-hidden border-t border-[var(--line-subtle)] bg-[var(--surface-band)] py-20 sm:py-24 lg:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[length:100%_100%] transition-[background-image] duration-[var(--dur-slower)] ease-[var(--ease-out-expo)]"
        style={{ backgroundImage: shade }}
      />
      <Container className="relative z-10">
        <Reveal y={18}>
          <SectionHeader
            titleId="guide-parking-rules-title"
            title={
              <>
                {t("parkingTitleBefore")}
                <BrandBlueUnderlinedText>{t("parkingTitleHighlight")}</BrandBlueUnderlinedText>
                {t("parkingTitleAfter")}
              </>
            }
            tone="light"
            description={t("parkingSectionIntro")}
          />
        </Reveal>

        <GuideParkingRulesSlider onActiveLineColorChange={setActiveLineTint} />
      </Container>
    </section>
  );
}
