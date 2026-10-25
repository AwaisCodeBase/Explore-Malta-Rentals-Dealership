"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = Readonly<{
  children: ReactNode;
  /** Element to render. Defaults to a div. */
  as?: ElementType;
  className?: string;
  /** Stagger delay in milliseconds (applied via CSS custom property). */
  delay?: number;
  /** IntersectionObserver threshold. */
  threshold?: number;
  /** Reveal only once (default) or every time it enters the viewport. */
  once?: boolean;
  style?: CSSProperties;
}>;

/**
 * Lightweight scroll-reveal wrapper.
 *
 * Toggles `data-revealed="true"` when the element scrolls into view, which the
 * `.reveal` rules in `globals.css` animate. Adds no runtime animation library,
 * and is fully disabled under `prefers-reduced-motion` (CSS handles the no-op).
 */
export function Reveal({
  children,
  as,
  className,
  delay = 0,
  threshold = 0.18,
  once = true,
  style,
}: RevealProps) {
  const Component = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (node == null) return;

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setRevealed(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setRevealed(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <Component
      ref={ref}
      className={["reveal", className].filter(Boolean).join(" ")}
      data-revealed={revealed ? "true" : "false"}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Component>
  );
}
