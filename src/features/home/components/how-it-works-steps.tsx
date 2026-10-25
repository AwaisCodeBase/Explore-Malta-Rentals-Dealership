"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bike, CalendarCheck, MapPinned } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";

import type { howItWorksSteps } from "@/features/home/data/home-sections";
import { HowItWorksStepAbstract } from "@/features/home/components/how-it-works-step-abstract";

gsap.registerPlugin(ScrollTrigger);

const STEP_ICONS: Record<(typeof howItWorksSteps)[number], LucideIcon> = {
  choose: Bike,
  schedule: CalendarCheck,
  ride: MapPinned,
};

type HowItWorksStep = Readonly<{
  id: (typeof howItWorksSteps)[number];
  title: string;
  description: string;
}>;

type HowItWorksStepsProps = Readonly<{
  steps: HowItWorksStep[];
}>;

export function HowItWorksSteps({ steps }: HowItWorksStepsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const abstractRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const container = containerRef.current;
      const line = lineRef.current;
      const stepElements = stepRefs.current.filter(
        (element): element is HTMLLIElement => element != null,
      );
      const dotElements = dotRefs.current.filter(
        (element): element is HTMLSpanElement => element != null,
      );
      const abstractElements = abstractRefs.current.filter(
        (element): element is HTMLDivElement => element != null,
      );

      if (container == null || line == null || stepElements.length === 0) {
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        gsap.set(line, { scaleY: 1 });
        gsap.set(stepElements, { autoAlpha: 1, x: 0, y: 0, scale: 1, filter: "none" });
        gsap.set(dotElements, { scale: 1, opacity: 1 });
        gsap.set(abstractElements, { autoAlpha: 0.55, x: 0, y: 0, scale: 1, rotate: 0 });
        return;
      }

      gsap.set(line, { scaleY: 0, transformOrigin: "top center" });
      gsap.set(dotElements, { scale: 0.55, opacity: 0.25 });

      gsap.to(line, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top 90%",
          end: "bottom 42%",
          scrub: 0.25,
          invalidateOnRefresh: true,
        },
      });

      stepElements.forEach((element, index) => {
        const dot = dotElements[index];
        const isRight = index % 2 === 1;
        const abstract = abstractElements[index];

        const scrollTrigger = {
          trigger: element,
          start: "top 88%",
          toggleActions: "play none none none",
          once: true,
          invalidateOnRefresh: true,
        };

        gsap.fromTo(
          element,
          {
            autoAlpha: 0,
            y: 32,
            x: isRight ? 40 : -40,
            scale: 0.98,
          },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            scale: 1,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger,
          },
        );

        if (dot != null) {
          gsap.to(dot, {
            scale: 1,
            opacity: 1,
            duration: 0.45,
            ease: "power2.out",
            scrollTrigger,
          });
        }

        if (abstract != null) {
          gsap.set(abstract, {
            autoAlpha: 0,
            y: 16,
            x: isRight ? -16 : 16,
            scale: 0.94,
          });
          gsap.to(abstract, {
            autoAlpha: 0.55,
            y: 0,
            x: 0,
            scale: 1,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger,
          });
        }
      });
    },
    { scope: containerRef, dependencies: [steps.length] },
  );

  return (
    <div
      ref={containerRef}
      className="how-it-works-timeline relative mx-auto mt-12 max-w-6xl pl-12 sm:mt-14 md:px-6 md:pl-6 lg:max-w-7xl lg:px-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 bottom-10 left-[1.125rem] w-px bg-white/[0.08] md:left-1/2 md:-translate-x-1/2"
      >
        <div ref={lineRef} className="how-it-works-timeline__line-fill h-full w-full" />
      </div>

      <ol className="m-0 flex list-none flex-col gap-16 p-0 sm:gap-20 lg:gap-24">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.id];
          const isRight = index % 2 === 1;

          return (
            <li
              key={step.id}
              ref={(element) => {
                stepRefs.current[index] = element;
              }}
              className="how-it-works-timeline__step relative w-full"
            >
              <span
                ref={(element) => {
                  dotRefs.current[index] = element;
                }}
                aria-hidden
                className="how-it-works-timeline__dot absolute top-8 -left-12 z-10 md:left-1/2 md:-translate-x-1/2"
              />

              <HowItWorksStepAbstract
                ref={(element) => {
                  abstractRefs.current[index] = element;
                }}
                stepId={step.id}
                side={isRight ? "left" : "right"}
              />

              <div
                className={`relative z-10 ${
                  isRight
                    ? "md:ml-[calc(50%+1.5rem)] md:max-w-[calc(50%-1.5rem)]"
                    : "md:mr-[calc(50%+1.5rem)] md:max-w-[calc(50%-1.5rem)]"
                }`}
              >

              <article className="how-it-works-step-card group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] p-6 shadow-[0_18px_50px_-38px_rgba(0,0,0,0.55)] sm:p-7">
                <div
                  aria-hidden
                  className="how-it-works-step-card__sheen pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="flex items-center justify-between">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-[#161616] text-[var(--brand-orange)] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.55)] transition-[transform,box-shadow,color] duration-500 group-hover:scale-105 group-hover:text-[var(--brand-orange-strong)] group-hover:shadow-[0_18px_36px_-12px_rgba(255,147,15,0.35)]">
                    <Icon
                      className="h-6 w-6 transition-transform duration-500 group-hover:scale-110"
                      aria-hidden
                    />
                  </span>
                  <span
                    aria-hidden
                    className="text-5xl font-black leading-none tracking-[-0.05em] text-white/[0.08] transition-[color,transform] duration-500 group-hover:translate-x-0.5 group-hover:text-white/[0.12]"
                  >
                    {`0${index + 1}`}
                  </span>
                </div>

                <h3 className="relative z-10 mt-6 text-xl font-bold tracking-[-0.02em] text-white transition-transform duration-500 group-hover:-translate-y-0.5">
                  {step.title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-7 text-white/55 transition-[color,transform] duration-500 group-hover:translate-y-0.5 group-hover:text-white/68">
                  {step.description}
                </p>
              </article>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
