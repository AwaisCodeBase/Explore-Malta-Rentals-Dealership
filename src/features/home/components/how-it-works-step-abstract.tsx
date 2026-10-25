import { forwardRef } from "react";

import type { howItWorksSteps } from "@/features/home/data/home-sections";

type ScatterParticle = Readonly<{
  top: string;
  left: string;
  size: number;
  opacity: number;
  tone: "white" | "orange";
  blur?: boolean;
}>;

type ScatterDash = Readonly<{
  top: string;
  left: string;
  width: string;
  rotate: number;
  opacity: number;
}>;

const SCATTER_PARTICLES: Record<(typeof howItWorksSteps)[number], ScatterParticle[]> = {
  choose: [
    { top: "14%", left: "22%", size: 2, opacity: 0.42, tone: "white" },
    { top: "28%", left: "58%", size: 3, opacity: 0.28, tone: "orange" },
    { top: "36%", left: "34%", size: 1.5, opacity: 0.22, tone: "white" },
    { top: "52%", left: "72%", size: 2.5, opacity: 0.34, tone: "orange", blur: true },
    { top: "61%", left: "18%", size: 2, opacity: 0.2, tone: "white" },
    { top: "74%", left: "48%", size: 3.5, opacity: 0.18, tone: "orange", blur: true },
    { top: "82%", left: "66%", size: 1.5, opacity: 0.26, tone: "white" },
    { top: "46%", left: "86%", size: 2, opacity: 0.16, tone: "white" },
  ],
  schedule: [
    { top: "18%", left: "68%", size: 2, opacity: 0.24, tone: "white" },
    { top: "24%", left: "28%", size: 3, opacity: 0.3, tone: "orange" },
    { top: "40%", left: "52%", size: 1.5, opacity: 0.2, tone: "white" },
    { top: "55%", left: "16%", size: 2.5, opacity: 0.26, tone: "orange" },
    { top: "63%", left: "74%", size: 2, opacity: 0.18, tone: "white", blur: true },
    { top: "78%", left: "38%", size: 2, opacity: 0.22, tone: "orange" },
    { top: "86%", left: "58%", size: 1.5, opacity: 0.16, tone: "white" },
    { top: "32%", left: "82%", size: 2, opacity: 0.14, tone: "white" },
  ],
  ride: [
    { top: "16%", left: "44%", size: 2.5, opacity: 0.28, tone: "orange" },
    { top: "30%", left: "24%", size: 2, opacity: 0.2, tone: "white" },
    { top: "38%", left: "64%", size: 1.5, opacity: 0.24, tone: "white" },
    { top: "50%", left: "36%", size: 3, opacity: 0.16, tone: "orange", blur: true },
    { top: "58%", left: "78%", size: 2, opacity: 0.22, tone: "white" },
    { top: "70%", left: "20%", size: 2, opacity: 0.18, tone: "orange" },
    { top: "80%", left: "54%", size: 1.5, opacity: 0.26, tone: "white" },
    { top: "88%", left: "72%", size: 2, opacity: 0.14, tone: "orange" },
  ],
};

const SCATTER_DASHES: Record<(typeof howItWorksSteps)[number], ScatterDash[]> = {
  choose: [
    { top: "22%", left: "42%", width: "1.75rem", rotate: -24, opacity: 0.12 },
    { top: "68%", left: "28%", width: "2.25rem", rotate: 18, opacity: 0.1 },
  ],
  schedule: [
    { top: "48%", left: "58%", width: "1.5rem", rotate: -12, opacity: 0.11 },
    { top: "72%", left: "14%", width: "2rem", rotate: 32, opacity: 0.09 },
  ],
  ride: [
    { top: "26%", left: "12%", width: "1.85rem", rotate: 14, opacity: 0.1 },
    { top: "64%", left: "46%", width: "2.1rem", rotate: -20, opacity: 0.11 },
  ],
};

type HowItWorksStepAbstractProps = Readonly<{
  stepId: (typeof howItWorksSteps)[number];
  side: "left" | "right";
}>;

export const HowItWorksStepAbstract = forwardRef<HTMLDivElement, HowItWorksStepAbstractProps>(
  function HowItWorksStepAbstract({ stepId, side }, ref) {
    const particles = SCATTER_PARTICLES[stepId];
    const dashes = SCATTER_DASHES[stepId];

    return (
      <div
        ref={ref}
        aria-hidden
        className={`how-it-works-step-abstract how-it-works-step-abstract--${stepId} pointer-events-none absolute top-8 hidden h-44 w-[min(44%,12rem)] opacity-0 sm:h-48 sm:w-[min(42%,13rem)] md:block lg:w-[min(40%,14rem)] ${
          side === "left"
            ? "left-0 md:left-[max(0px,calc(50%-22rem))]"
            : "right-0 md:right-[max(0px,calc(50%-22rem))]"
        }`}
      >
        {particles.map((particle, index) => (
          <span
            key={`${stepId}-p-${index}`}
            className={`how-it-works-step-abstract__speck how-it-works-step-abstract__speck--${particle.tone}${
              particle.blur ? " how-it-works-step-abstract__speck--soft" : ""
            }`}
            style={{
              top: particle.top,
              left: particle.left,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
            }}
          />
        ))}

        {dashes.map((dash, index) => (
          <span
            key={`${stepId}-d-${index}`}
            className="how-it-works-step-abstract__dash"
            style={{
              top: dash.top,
              left: dash.left,
              width: dash.width,
              transform: `rotate(${dash.rotate}deg)`,
              opacity: dash.opacity,
            }}
          />
        ))}
      </div>
    );
  },
);
