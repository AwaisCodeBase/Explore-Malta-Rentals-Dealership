"use client";

import { m, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

type StaggerProps = Readonly<{
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Seconds between each child's entrance. */
  step?: number;
  /** Seconds before the first child starts. */
  delay?: number;
  amount?: number;
}>;

type StaggerItemProps = Readonly<{
  children: ReactNode;
  as?: ElementType;
  className?: string;
  y?: number;
  scale?: number;
}>;

/**
 * Parent for a run of `StaggerItem`s — grids of cards, feature lists, nav rows.
 * Timing lives here so items stay declarative and reorderable.
 */
export function Stagger({
  children,
  as = "div",
  className,
  step = 0.07,
  delay = 0,
  amount = 0.15,
}: StaggerProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = m[as as keyof typeof m] as typeof m.div;

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: step, delayChildren: delay } },
      }}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  as = "div",
  className,
  y = 22,
  scale,
}: StaggerItemProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = m[as as keyof typeof m] as typeof m.div;

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y, ...(scale === undefined ? {} : { scale }) },
        visible: {
          opacity: 1,
          y: 0,
          ...(scale === undefined ? {} : { scale: 1 }),
          transition: { duration: 0.68, ease: EASE_OUT_EXPO },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}
