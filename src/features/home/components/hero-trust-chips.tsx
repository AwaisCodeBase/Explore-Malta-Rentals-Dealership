type HeroTrustChipsProps = Readonly<{
  items: readonly string[];
  className?: string;
}>;

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5 text-[var(--brand-orange)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 8.5 3.2 3.2L13 4.8" />
    </svg>
  );
}

/**
 * Minimal trust cues for the hero. Server-rendered, no client cost.
 * Renders a wrapping row of subtle glass chips with a brand check mark.
 */
export function HeroTrustChips({ items, className }: HeroTrustChipsProps) {
  return (
    <ul
      className={["flex flex-wrap items-center gap-2.5", className]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold tracking-[-0.01em] text-white/90 backdrop-blur-sm [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]"
        >
          <CheckIcon />
          {item}
        </li>
      ))}
    </ul>
  );
}
