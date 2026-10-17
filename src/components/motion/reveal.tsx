"use client";

import { m, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";

/** Shared easing for every entrance in the app (matches `--ease-out-expo`). */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

type RevealProps = Readonly<{
  children: ReactNode;
  /** Rendered element. Use a semantic tag so reveals never cost you markup. */
  as?: ElementType;
  className?: string;
  /** Passed through so a revealed heading can still be an `aria-labelledby` target. */
  id?: string;
  /** Seconds before the entrance starts. */
  delay?: number;
  /** Travel distance in px. Negative pulls down from above. */
  y?: number;
  /** Horizontal travel in px, for side-entering columns. */
  x?: number;
  /** Start scale, for cards and media that should settle into place. */
  scale?: number;
  duration?: number;
  /** How far into the viewport the element must be before it fires. */
  amount?: number;
}>;

/**
 * Scroll-triggered entrance. Fires once, respects `prefers-reduced-motion`
 * (in which case children render at their final state with no transition).
 */
export function Reveal({
  children,
  as = "div",
  className,
  id,
  delay = 0,
  y = 20,
  x = 0,
  scale,
  duration = 0.7,
  amount = 0.25,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = m[as as keyof typeof m] as typeof m.div;

  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag className={className} id={id}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      id={id}
      initial={{ opacity: 0, y, x, ...(scale === undefined ? {} : { scale }) }}
      whileInView={{ opacity: 1, y: 0, x: 0, ...(scale === undefined ? {} : { scale: 1 }) }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </MotionTag>
  );
}
