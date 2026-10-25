"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

type HeroBikeVisualProps = Readonly<{
  src: string;
  alt: string;
  /** Oversized word rendered behind the product. */
  backdropWord: string;
  /**
   * Feature labels pinned around the product (desktop only).
   * Rendered in order: top-left, top-right, bottom-left, bottom-right.
   */
  featureLabels: readonly string[];
  className?: string;
}>;

const LABEL_POSITIONS = [
  "left-0 top-[14%]",
  "right-0 top-[28%]",
  "left-[2%] bottom-[26%]",
  "right-0 bottom-[14%]",
] as const;

const labelClass =
  "pointer-events-none absolute inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md [text-shadow:0_1px_10px_rgba(0,0,0,0.55)] sm:text-[11px]";

/**
 * Premium pseudo-3D hero product.
 *
 * Layers (back → front):
 *   1. Ambient radial glow (slow breathe)
 *   2. Oversized backdrop wordmark
 *   3. Soft elliptical ground shadow (pulses with the float)
 *   4. Cutout product image — slow vertical float + pointer tilt (desktop)
 *   5. Feature labels pinned around the product
 *
 * Pointer tilt and float are disabled for touch devices and reduced-motion.
 * The whole island is client-only so it never blocks LCP of the headline.
 */
export function HeroBikeVisual({
  src,
  alt,
  backdropWord,
  featureLabels,
  className,
}: HeroBikeVisualProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    queueMicrotask(() => setTiltEnabled(finePointer && !reducedMotion));
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!tiltEnabled) return;
    const node = frameRef.current;
    if (node == null) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ rx: -py * 10, ry: px * 14 });
    });
  };

  const handlePointerLeave = () => {
    if (!tiltEnabled) return;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      ref={frameRef}
      className={["relative isolate select-none", className]
        .filter(Boolean)
        .join(" ")}
      style={{ perspective: "1200px" }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* 1. Ambient glow */}
      <div
        aria-hidden
        className="hero-glow-breathe pointer-events-none absolute left-1/2 top-[46%] -z-10 h-[78%] w-[78%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--brand-orange) 55%, transparent) 0%, color-mix(in srgb, var(--brand-orange) 22%, transparent) 38%, transparent 70%)",
        }}
      />

      {/* 2. Oversized backdrop wordmark */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 -translate-y-1/2 select-none text-center text-[clamp(3rem,13vw,7.5rem)] font-black uppercase leading-none tracking-[-0.05em] text-white/[0.08] [text-shadow:0_2px_40px_rgba(0,0,0,0.35)]"
      >
        {backdropWord}
      </span>

      {/* 3. Soft ground shadow */}
      <div
        aria-hidden
        className="bike-shadow-pulse pointer-events-none absolute bottom-[5%] left-1/2 h-[9%] w-[66%] rounded-[50%] bg-black/55 blur-2xl"
      />

      {/* 4. Floating product */}
      <div className="bike-float relative aspect-[5/4] h-auto w-full">
        <div
          className="relative h-full w-full transition-transform duration-300 ease-out"
          style={
            {
              transform: tiltEnabled
                ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
                : undefined,
              transformStyle: "preserve-3d",
            } as CSSProperties
          }
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="(max-width: 768px) 80vw, 42vw"
            className="object-contain drop-shadow-[0_45px_60px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>

      {/* 5. Feature labels (desktop only) */}
      <div className="absolute inset-0 z-20 hidden sm:block" aria-hidden>
        {featureLabels.slice(0, LABEL_POSITIONS.length).map((label, index) => (
          <span key={label} className={`${labelClass} ${LABEL_POSITIONS[index]}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-orange)]" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
