import type { ReactNode } from "react";

/** Accent underline on neutral title text (orange stroke — no blue fill on words). */
export function BrandBlueUnderlinedText({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="relative inline-block">
      <span className="text-[var(--text-primary)]">{children}</span>
      <svg
        viewBox="0 0 132 16"
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-[-2%] h-[0.45em] w-[104%] max-w-none overflow-visible text-orange-400 sm:-bottom-1.5 sm:h-[0.5em]"
        preserveAspectRatio="none"
      >
        <path
          d="M4 11 C 32 15.5, 56 3.5, 88 9.5 C 100 11.5, 112 10.5, 128 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
