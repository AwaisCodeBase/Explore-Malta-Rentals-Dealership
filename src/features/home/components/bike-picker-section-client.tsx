"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import {
  chooseUsPickerOptions,
  defaultChooseUsPickerOptionId,
  type ChooseUsPickerOptionId,
} from "@/features/home/data/home-sections";
import { Link } from "@/i18n/navigation";

const fleetLinks: Record<ChooseUsPickerOptionId, string> = {
  "125cc": "/vehicles?cc=125&type=scooter",
  "50cc": "/vehicles?cc=50&type=scooter",
};

export function BikePickerSectionClient() {
  const t = useTranslations("Home");
  const tCategories = useTranslations("Home.bikeCategories");
  const tDynamic = tCategories as unknown as (key: string) => string;
  const [selectedId, setSelectedId] =
    useState<ChooseUsPickerOptionId>(defaultChooseUsPickerOptionId);

  return (
    <section
      id="fleet-preview"
      aria-labelledby="bike-categories-title"
      className="scroll-mt-28 border-t border-white/[0.06] bg-black"
    >
      <div className="bike-picker-section-shell relative overflow-hidden">
        <div aria-hidden="true" className="bike-picker-section-shell__media absolute inset-0">
          {chooseUsPickerOptions.map((option) => {
            const isActive = selectedId === option.id;

            return (
              <div
                key={option.id}
                className={[
                  "absolute inset-0 transition-opacity duration-700 ease-out",
                  isActive ? "z-[1] opacity-100" : "z-0 opacity-0",
                ].join(" ")}
              >
                <Image
                  src={option.image}
                  alt=""
                  fill
                  unoptimized
                  sizes="100vw"
                  priority
                  className="object-cover object-[68%_42%] brightness-[1.04] contrast-[1.06] saturate-[1.08] sm:object-[82%_center] lg:object-right lg:object-center"
                />
              </div>
            );
          })}
        </div>

        <div
          aria-hidden="true"
          className="bike-picker-section-bg__mesh bike-picker-section-bg__mesh--with-image"
        />
        <div
          aria-hidden="true"
          className="bike-picker-section-bg__grain bike-picker-section-bg__grain--with-image"
        />

        <Container className="relative z-10 flex min-h-full flex-col justify-start pt-[3.2rem] pb-[3.2rem] sm:pt-16 sm:pb-16 lg:pt-[5.6rem] lg:pb-[5.6rem] xl:pt-[6.4rem] xl:pb-[6.4rem]">
          <div className="max-w-5xl text-left">
            <h2
              id="bike-categories-title"
              className="text-[clamp(2rem,4.8vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.045em] text-white"
            >
              {t("sectionBikePickerTitle")}
            </h2>
            <p className="mt-2.5 max-w-4xl text-[clamp(1.08rem,2.6vw,2rem)] font-bold leading-[1.15] tracking-[-0.035em] text-white/38 sm:mt-3">
              {t("sectionBikePickerDescription")}
            </p>
          </div>

          <div className="mt-auto mb-8 max-w-md pt-6 text-left sm:mb-10 sm:pt-8 lg:mb-12 lg:pt-10 xl:pt-12">
            <p className="text-sm font-medium tracking-[-0.01em] text-white/55 sm:text-[0.9375rem]">
              {t("sectionBikePickerKicker")}
            </p>

            <div
              role="tablist"
              aria-label={t("sectionBikePickerKicker")}
              className="bike-picker-selector mt-4 sm:mt-5"
            >
              {chooseUsPickerOptions.map((option) => {
                const isActive = selectedId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    id={`choose-us-tab-${option.id}`}
                    aria-selected={isActive}
                    aria-controls={`choose-us-panel-${option.id}`}
                    onClick={() => setSelectedId(option.id)}
                    className={[
                      "bike-picker-selector__option",
                      isActive ? "bike-picker-selector__option--active" : "",
                    ].join(" ")}
                  >
                    {option.id}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`choose-us-panel-${selectedId}`}
              aria-labelledby={`choose-us-tab-${selectedId}`}
              className="mt-5 max-w-sm sm:mt-6"
            >
              <p className="text-sm leading-6 text-white/58 sm:text-[0.9375rem] sm:leading-7">
                {tDynamic(`${selectedId}.description`)}
              </p>
              <Link
                href={fleetLinks[selectedId]}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#161616] px-4 py-2 text-sm font-medium tracking-[-0.01em] text-white/90 transition-[background-color,border-color,transform] duration-300 hover:border-white/20 hover:bg-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:mt-4"
              >
                <span>{t("heroViewFleet")}</span>
                <ArrowUpRight className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
