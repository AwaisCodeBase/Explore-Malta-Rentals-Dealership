"use client";

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Loads only the `domAnimation` feature bundle (~17 kB) rather than the full
 * `motion` component tree. Every animated primitive in `components/motion`
 * uses the lightweight `m` component, which requires this provider above it.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
