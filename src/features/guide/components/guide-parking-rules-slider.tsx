"use client";

import Image from "next/image";
import { m, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { startTransition, useCallback, useEffect, useId, useMemo, useState } from "react";

const GUIDE_IMAGES_BASE = "/GuidePageImages";

/** Shared easing for slide entrances (matches `--ease-out-expo`). */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Green line — `public/GuidePageImages/green-line.png`. */
const IMG_GREEN_LINE = `${GUIDE_IMAGES_BASE}/${encodeURIComponent("green-line.png")}`;
/** White parking bay — `white parking.jpg`. */
const IMG_WHITE_PARKING = `${GUIDE_IMAGES_BASE}/${encodeURIComponent("white parking.jpg")}`;
/** Motorcycle (MC) bay — `mc parking.png`. */
const IMG_MC_PARKING = `${GUIDE_IMAGES_BASE}/${encodeURIComponent("mc parking.png")}`;
/** Disabled bay — `disabled.jpg`. */
const IMG_BLUE_DISABLED = `${GUIDE_IMAGES_BASE}/${encodeURIComponent("disabled.jpg")}`;

export type ActiveLineColorId = "white" | "yellow" | "blue" | "green";

type LineColorSubrule = Readonly<{
  id: ActiveLineColorId;
  title: string;
  tag: string;
  description: string;
  images: readonly { src: string; alt: string }[];
}>;

type MajorRuleLineColors = Readonly<{
  id: "line-colors";
  title: string;
  description: string;
}>;

type MajorRuleValidSpaces = Readonly<{
  id: "valid-spaces";
  title: string;
  description: string;
  images: readonly { src: string; alt: string }[];
}>;

type MajorRule = MajorRuleLineColors | MajorRuleValidSpaces;

const LINE_COLOR_TAG_STYLES: Record<ActiveLineColorId, string> = {
  white: "bg-[var(--surface-sunken)] text-[var(--ink-900)] ring-[var(--line-strong)]",
  yellow: "bg-orange-50 text-orange-900 ring-orange-300",
  blue: "bg-blue-50 text-blue-900 ring-blue-300",
  green: "bg-emerald-50 text-emerald-900 ring-emerald-300",
};

const LINE_COLOR_FOCUS_RING: Record<ActiveLineColorId, string> = {
  white: "focus-visible:ring-[var(--ink-500)]",
  yellow: "focus-visible:ring-orange-500",
  blue: "focus-visible:ring-blue-500",
  green: "focus-visible:ring-emerald-500",
};

/** Callout accent for the active line colour — left rule + tinted ground. */
const LINE_COLOR_CALLOUT: Record<ActiveLineColorId, string> = {
  white: "border-l-[var(--ink-400)] bg-[var(--surface-sunken)]",
  yellow: "border-l-orange-400 bg-orange-50/80",
  blue: "border-l-blue-400 bg-blue-50/80",
  green: "border-l-emerald-400 bg-emerald-50/80",
};

const CIRCLE_CONTROL_CLASS =
  "group inline-flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-[var(--elev-2)] ring-1 ring-inset ring-[var(--line)] transition-[background-color,color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:bg-orange-400 hover:text-[var(--ink-950)] hover:shadow-[var(--elev-orange)] hover:ring-transparent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 motion-reduce:active:scale-100";

const CIRCLE_CONTROL_ICON_CLASS =
  "h-5 w-5 transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0";

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

/** Decorative step index for a major rule — the copy itself is untouched. */
function StepPlate({ step }: { step: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink-900)] text-[0.8125rem] font-bold tabular-nums leading-none text-white shadow-[var(--elev-1)]"
    >
      {step}
    </span>
  );
}

export type GuideParkingRulesSliderProps = Readonly<{
  onActiveLineColorChange?: (id: ActiveLineColorId | null) => void;
}>;

function imageGridClass(imageCount: number) {
  if (imageCount >= 3) return "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4";
  if (imageCount === 2) return "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4";
  return "grid w-[min(15rem,82vw)] max-w-full grid-cols-1 sm:w-[17rem]";
}

export function GuideParkingRulesSlider({ onActiveLineColorChange }: GuideParkingRulesSliderProps = {}) {
  const t = useTranslations("Guide");
  const reduceMotion = useReducedMotion();

  const lineColorSubrules = useMemo(
    (): LineColorSubrule[] => [
      {
        id: "white",
        title: t("parkingLineWhiteTitle"),
        tag: t("parkingLineWhiteTag"),
        description: t("parkingLineWhiteDescription"),
        images: [
          { src: IMG_WHITE_PARKING, alt: t("parkingLineWhiteImg1Alt") },
          { src: IMG_MC_PARKING, alt: t("parkingLineWhiteImg2Alt") },
        ],
      },
      {
        id: "yellow",
        title: t("parkingLineYellowTitle"),
        tag: t("parkingLineYellowTag"),
        description: t("parkingLineYellowDescription"),
        images: [
          {
            src: `${GUIDE_IMAGES_BASE}/${encodeURIComponent("double-yellow-lines.jpg")}`,
            alt: t("parkingLineYellowImg1Alt"),
          },
          {
            src: `${GUIDE_IMAGES_BASE}/${encodeURIComponent("reserved.jpg")}`,
            alt: t("parkingLineYellowImg2Alt"),
          },
          {
            src: `${GUIDE_IMAGES_BASE}/${encodeURIComponent("Yellow_lines_1.jpg")}`,
            alt: t("parkingLineYellowImg3Alt"),
          },
        ],
      },
      {
        id: "blue",
        title: t("parkingLineBlueTitle"),
        tag: t("parkingLineBlueTag"),
        description: t("parkingLineBlueDescription"),
        images: [{ src: IMG_BLUE_DISABLED, alt: t("parkingLineBlueImg1Alt") }],
      },
      {
        id: "green",
        title: t("parkingLineGreenTitle"),
        tag: t("parkingLineGreenTag"),
        description: t("parkingLineGreenDescription"),
        images: [{ src: IMG_GREEN_LINE, alt: t("parkingLineGreenImg1Alt") }],
      },
    ],
    [t],
  );

  const majorRules = useMemo(
    (): MajorRule[] => [
      { id: "line-colors", title: t("parkingMajor1Title"), description: t("parkingMajor1Description") },
      {
        id: "valid-spaces",
        title: t("parkingMajor2Title"),
        description: t("parkingMajor2Description"),
        images: [{ src: IMG_MC_PARKING, alt: t("parkingMajor2ImgAlt") }],
      },
    ],
    [t],
  );

  const [majorIndex, setMajorIndex] = useState(0);
  const [lineColorIndex, setLineColorIndex] = useState(0);
  const majorCount = majorRules.length;
  const lineColorCount = lineColorSubrules.length;
  const majorLabelId = useId();
  const lineColorRegionId = useId();

  const goNextMajor = useCallback(() => {
    setMajorIndex((i) => (i + 1) % majorCount);
  }, [majorCount]);

  useEffect(() => {
    startTransition(() => {
      setLineColorIndex(0);
    });
  }, [majorIndex]);

  useEffect(() => {
    onActiveLineColorChange?.(majorIndex === 0 ? lineColorSubrules[lineColorIndex]!.id : null);
  }, [majorIndex, lineColorIndex, onActiveLineColorChange, lineColorSubrules]);

  const activeLineColorRule = lineColorSubrules[lineColorIndex]!;
  const lineColorSingleImage = activeLineColorRule.images.length === 1;

  return (
    <div className="mt-14">
      <div
        className="relative w-full overflow-hidden rounded-[var(--r-feature)] bg-transparent"
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={majorLabelId}
      >
        <p id={majorLabelId} className="sr-only">
          {t("parkingSrMajorSlide", { current: majorIndex + 1, total: majorCount })}
        </p>
        {majorRules.map((rule, slideIdx) => (
          <article
            key={rule.id}
            aria-hidden={majorIndex !== slideIdx}
            className={`bg-transparent px-1.5 py-4 ${slideIdx === majorIndex ? "block" : "hidden"}`}
          >
            <m.div
              key={`${rule.id}-${majorIndex}`}
              initial={reduceMotion ? false : { opacity: 0, x: 28 }}
              animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            >
              {rule.id === "line-colors" ? (
                <div
                  className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-12"
                  role="region"
                  aria-roledescription="carousel"
                  aria-labelledby={lineColorRegionId}
                >
                  <div className="flex flex-col gap-4">
                    <p id={lineColorRegionId} className="sr-only">
                      {t("parkingSrLineColourSlide", { current: lineColorIndex + 1, total: lineColorCount })}
                    </p>
                    <article className="surface-panel p-6 sm:p-7">
                      <div className="flex items-center gap-3">
                        <StepPlate step={slideIdx + 1} />
                        <h3 className="type-h3 text-[var(--text-primary)]">{rule.title}</h3>
                      </div>
                      <p className="mt-5 text-[0.9375rem] leading-[1.7] text-[var(--text-secondary)]">
                        {rule.description}
                      </p>
                      <div className="mt-6 space-y-4">
                        <div
                          className="flex flex-wrap gap-2"
                          role="tablist"
                          aria-label={t("parkingAriaTablistLineColour")}
                        >
                          {lineColorSubrules.map((sub, i) => (
                            <button
                              key={sub.id}
                              type="button"
                              role="tab"
                              aria-selected={i === lineColorIndex}
                              aria-label={t("parkingAriaShowLine", { line: sub.tag })}
                              onClick={() => setLineColorIndex(i)}
                              className={
                                i === lineColorIndex
                                  ? `type-spec inline-flex items-center rounded-full px-3 py-1.5 ring-1 ring-inset shadow-[var(--elev-1)] transition-[background-color,color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${LINE_COLOR_FOCUS_RING[sub.id]} ${LINE_COLOR_TAG_STYLES[sub.id]}`
                                  : "type-spec inline-flex items-center rounded-full bg-transparent px-3 py-1.5 text-[var(--text-muted)] ring-1 ring-inset ring-[var(--line)] transition-[background-color,color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] hover:ring-[var(--line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              }
                            >
                              {sub.tag}
                            </button>
                          ))}
                        </div>
                        <p
                          className={`rounded-r-[var(--r-field)] border-l-[3px] px-4 py-3 text-[0.9375rem] font-semibold leading-[1.6] text-[var(--text-primary)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] ${LINE_COLOR_CALLOUT[activeLineColorRule.id]}`}
                        >
                          {activeLineColorRule.description}
                        </p>
                      </div>
                    </article>
                  </div>

                  <div
                    className={`flex min-w-0 items-center gap-4 ${lineColorSingleImage ? "justify-center" : ""}`}
                  >
                    <div
                      className={
                        lineColorSingleImage
                          ? "relative w-fit max-w-full shrink-0 overflow-hidden rounded-[var(--r-panel)] bg-[var(--surface-card)] p-3 shadow-[var(--elev-3)] ring-1 ring-inset ring-[var(--line-subtle)] sm:p-4"
                          : "relative min-w-0 flex-1 overflow-hidden rounded-[var(--r-panel)] bg-[var(--surface-card)] p-3 shadow-[var(--elev-3)] ring-1 ring-inset ring-[var(--line-subtle)] sm:p-4"
                      }
                    >
                      <m.div
                        key={`line-images-${lineColorIndex}`}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                        animate={reduceMotion ? {} : { opacity: 1, scale: 1 }}
                        transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
                        className={
                          lineColorSingleImage
                            ? "relative w-fit overflow-hidden rounded-[var(--r-card)]"
                            : "relative mx-auto w-full max-w-[min(34rem,92vw)] overflow-hidden rounded-[var(--r-card)] sm:max-w-xl lg:max-w-2xl"
                        }
                      >
                        {lineColorSubrules.map((sub, i) => (
                          <div
                            key={sub.id}
                            aria-hidden={lineColorIndex !== i}
                            className={lineColorIndex === i ? "block" : "hidden"}
                          >
                            <div className={imageGridClass(sub.images.length)}>
                              {sub.images.map((img, imgIdx) => (
                                <figure
                                  key={img.src}
                                  className="relative isolate aspect-square w-full min-w-0 overflow-hidden rounded-[var(--r-card)] bg-[var(--surface-sunken)] ring-1 ring-inset ring-[var(--line-subtle)]"
                                >
                                  <Image
                                    src={img.src}
                                    alt={img.alt}
                                    width={900}
                                    height={900}
                                    className="block h-full w-full object-cover"
                                    sizes={
                                      sub.images.length > 2
                                        ? "(min-width: 640px) 28vw, 88vw"
                                        : sub.images.length > 1
                                          ? "(min-width: 640px) 18vw, 44vw"
                                          : "(max-width: 640px) min(82vw, 15rem), 17rem"
                                    }
                                    priority={i === 0 && imgIdx === 0}
                                  />
                                </figure>
                              ))}
                            </div>
                          </div>
                        ))}
                      </m.div>
                    </div>
                    <button
                      type="button"
                      onClick={goNextMajor}
                      aria-label={t("parkingAriaNextMajor")}
                      className={CIRCLE_CONTROL_CLASS}
                    >
                      <ChevronRight className={CIRCLE_CONTROL_ICON_CLASS} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-12">
                  <article className="surface-panel p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                      <StepPlate step={slideIdx + 1} />
                      <h3 className="type-h3 text-[var(--text-primary)]">{rule.title}</h3>
                    </div>
                    <p className="mt-5 text-[0.9375rem] leading-[1.7] text-[var(--text-secondary)]">
                      {rule.description}
                    </p>
                  </article>

                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative min-w-0 flex-1 overflow-hidden rounded-[var(--r-panel)] bg-[var(--surface-card)] p-3 shadow-[var(--elev-3)] ring-1 ring-inset ring-[var(--line-subtle)] sm:p-4">
                      <div className="mx-auto max-w-lg">
                        {"images" in rule &&
                          rule.images.map((image) => (
                            <Image
                              key={image.src}
                              src={image.src}
                              alt={image.alt}
                              width={1200}
                              height={900}
                              className="h-auto w-full rounded-[var(--r-card)] object-cover object-center"
                              sizes="(min-width: 1024px) 28rem, 92vw"
                            />
                          ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={goNextMajor}
                      aria-label={t("parkingAriaNextMajor")}
                      className={CIRCLE_CONTROL_CLASS}
                    >
                      <ChevronRight className={CIRCLE_CONTROL_ICON_CLASS} />
                    </button>
                  </div>
                </div>
              )}
            </m.div>
          </article>
        ))}
      </div>

      <div
        className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        role="tablist"
        aria-label={t("parkingAriaMajorTablist")}
      >
        {majorRules.map((rule, i) => (
          <button
            key={rule.id}
            type="button"
            role="tab"
            aria-selected={i === majorIndex}
            aria-label={t("parkingAriaShowMajor", { title: rule.title })}
            onClick={() => setMajorIndex(i)}
            className={
              i === majorIndex
                ? "h-2.5 w-9 shrink-0 rounded-full bg-orange-400 shadow-[var(--elev-1)] transition-[width,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                : "h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ink-300)] transition-[width,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:bg-[var(--ink-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            }
          />
        ))}
      </div>
    </div>
  );
}
