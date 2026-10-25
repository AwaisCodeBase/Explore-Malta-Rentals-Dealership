"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const ccIcons = {
  "50": "/landing page/50cc.png",
  "125": "/landing page/125cc.png",
} as const;

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 text-white/90" fill="currentColor">
      <path d="M12 2l2.39 7.26H22l-6.19 4.5 2.36 7.24L12 16.77l-6.17 4.23 2.36-7.24L2 9.26h7.61L12 2Z" />
    </svg>
  );
}

/**
 * Dark glass category selector from the hero mock — 50cc / 125cc / Services.
 */
export function HeroCategoryBar() {
  const t = useTranslations("BookingSearch");

  return (
    <nav
      aria-label={t("chipServices")}
      className="hero-category-bar inline-flex max-w-full flex-wrap items-stretch gap-1 rounded-xl border border-white/10 bg-black/45 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
    >
      <Link
        href="/vehicles?cc=50&type=scooter"
        className="hero-category-bar__chip hero-category-bar__chip--active group inline-flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-white transition-colors"
      >
        <Image
          src={ccIcons["50"]}
          alt=""
          width={40}
          height={32}
          unoptimized
          className="h-8 w-10 shrink-0 object-contain"
          aria-hidden
        />
        <span className="tabular-nums">{t("chip50")}</span>
      </Link>

      <Link
        href="/vehicles?cc=125&type=scooter"
        className="hero-category-bar__chip group inline-flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-white/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Image
          src={ccIcons["125"]}
          alt=""
          width={32}
          height={32}
          unoptimized
          className="h-7 w-7 shrink-0 object-contain"
          aria-hidden
        />
        <span className="tabular-nums">{t("chip125")}</span>
      </Link>

      <Link
        href="/#services"
        className="hero-category-bar__chip group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-white/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        <StarIcon />
        <span>{t("chipServices")}</span>
      </Link>
    </nav>
  );
}
