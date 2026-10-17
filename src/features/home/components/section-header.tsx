import type { ReactNode } from "react";

type SectionHeaderProps = Readonly<{
  kicker?: string;
  title: ReactNode;
  titleId?: string;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
}>;

export function SectionHeader({
  kicker,
  title,
  titleId,
  description,
  align = "center",
  tone = "light",
}: SectionHeaderProps) {
  const isCentered = align === "center";
  const alignClasses = isCentered ? "text-center" : "text-left";

  const titleColor = tone === "dark" ? "text-white" : "text-ink-900";

  const descriptionColor = tone === "dark" ? "text-white/72" : "text-ink-600";

  const kickerColor =
    tone === "dark" ? "text-orange-300" : "text-orange-600";

  return (
    <div className={alignClasses}>
      {kicker ? (
        <p className={`type-eyebrow ${kickerColor}`}>{kicker}</p>
      ) : null}
      <h2
        id={titleId}
        className={`type-h2 ${kicker ? "mt-4" : "mt-0"} ${titleColor}`}
      >
        {title}
      </h2>
      {description ? (
        <div
          className={`mt-4 max-w-2xl text-[length:var(--text-lead)] leading-[1.62] ${descriptionColor} ${
            isCentered ? "mx-auto" : ""
          }`}
        >
          {description}
        </div>
      ) : null}
    </div>
  );
}
