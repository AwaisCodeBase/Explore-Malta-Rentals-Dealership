"use client";

import Image from "next/image";
import { useCallback, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

/** Paths under `/public` (spaces encoded for Next/Image). */
const IMG_LEX_GREY = `/product-images/${encodeURIComponent("lex moto grey.png")}`;
const IMG_ATV_QUAD = `/TourPage-images/${encodeURIComponent("TOURS PAGE PHOTO QUAD.jpg")}`;
const IMG_BICYCLES = "/about-page-image/bicycles.png";
const IMG_MALTA_MAP = `/${encodeURIComponent("guide map.png")}`;

type Slide = Readonly<{
  id: "motorcycles" | "atvs" | "bicycles" | "tours";
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}>;

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function WhatWeOfferSlider() {
  const t = useTranslations("About");
  const [index, setIndex] = useState(0);
  const labelId = useId();

  const slides = useMemo(
    (): Slide[] => [
      {
        id: "motorcycles",
        title: t("offerMotorcyclesTitle"),
        description: t("offerMotorcyclesDesc"),
        imageSrc: IMG_LEX_GREY,
        imageAlt: t("offerMotorcyclesAlt"),
      },
      {
        id: "atvs",
        title: t("offerAtvsTitle"),
        description: t("offerAtvsDesc"),
        imageSrc: IMG_ATV_QUAD,
        imageAlt: t("offerAtvsAlt"),
      },
      {
        id: "bicycles",
        title: t("offerBicyclesTitle"),
        description: t("offerBicyclesDesc"),
        imageSrc: IMG_BICYCLES,
        imageAlt: t("offerBicyclesAlt"),
      },
      {
        id: "tours",
        title: t("offerToursTitle"),
        description: t("offerToursDesc"),
        imageSrc: IMG_MALTA_MAP,
        imageAlt: t("offerToursAlt"),
      },
    ],
    [t],
  );

  const count = slides.length;

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const trackWidthPercent = count * 100;
  const slideWidthOnTrackPercent = 100 / count;
  const translatePercent = (index * 100) / count;

  return (
    <div className="mt-16">
      <div
        className="relative w-full overflow-hidden rounded-[var(--r-feature)]"
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={labelId}
      >
        <p id={labelId} className="sr-only">
          {t("carouselSrOnly", { current: index + 1, total: count })}
        </p>
        <div
          className="flex will-change-transform motion-safe:transition-transform motion-safe:duration-[var(--dur-slower)] motion-safe:ease-[var(--ease-out-expo)]"
          style={{
            width: `${trackWidthPercent}%`,
            transform: `translate3d(-${translatePercent}%, 0, 0)`,
          }}
        >
          {slides.map((slide) => (
            <article
              key={slide.id}
              aria-hidden={slides[index]!.id !== slide.id}
              className="box-border shrink-0 px-1.5 py-3"
              style={{ width: `${slideWidthOnTrackPercent}%` }}
            >
              <div className="surface-panel grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:gap-12 lg:p-10">
                <div className="min-w-0 text-left lg:pr-2">
                  <h3 className="type-h2 text-[var(--text-primary)]">{slide.title}</h3>
                  <p className="mt-5 max-w-[46ch] text-[length:var(--text-lead)] leading-[1.68] text-[var(--text-secondary)]">
                    {slide.description}
                  </p>
                </div>
                <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col lg:mx-0 lg:max-w-none">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative flex min-h-[min(18rem,48svh)] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[var(--r-card)] bg-[var(--surface-sunken)] p-3 ring-1 ring-inset ring-[var(--line-subtle)] sm:min-h-[min(20rem,52svh)] sm:p-4 lg:min-h-[min(26rem,58svh)] lg:p-5">
                      <Image
                        src={slide.imageSrc}
                        alt={slide.imageAlt}
                        width={1200}
                        height={900}
                        className="h-auto max-h-[min(24rem,56svh)] w-full max-w-full rounded-[var(--r-field)] object-contain object-center sm:max-h-[min(28rem,58svh)] lg:max-h-[min(34rem,64svh)]"
                        sizes="(min-width: 1024px) 50vw, 92vw"
                        priority={slide.id === "motorcycles"}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label={t("carouselNext")}
                      className="group inline-flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-[var(--elev-2)] ring-1 ring-inset ring-[var(--line)] transition-[background-color,color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-orange-400 hover:text-[var(--ink-950)] hover:shadow-[var(--elev-orange)] hover:ring-transparent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 motion-reduce:active:scale-100"
                    >
                      <ChevronRight className="h-5 w-5 transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div
        className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        role="tablist"
        aria-label={t("carouselTablist")}
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={t("carouselShow", { title: s.title })}
            onClick={() => setIndex(i)}
            className={
              i === index
                ? "h-2.5 w-9 shrink-0 rounded-full bg-orange-400 shadow-[var(--elev-1)] transition-[width,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                : "h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ink-300)] transition-[width,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:bg-[var(--ink-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            }
          />
        ))}
      </div>
    </div>
  );
}
