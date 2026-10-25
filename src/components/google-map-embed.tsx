"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SITE_GOOGLE_MAPS_URL } from "@/lib/site-brand-copy";

type GoogleMapEmbedProps = Readonly<{
  className?: string;
  /** Override query (default: business name + coordinates) */
  query?: string;
  /** Show the compact “View on Google Maps” footer link (default: true) */
  showFooterLink?: boolean;
  /** Apply grab cursor for draggable map affordance (default: false) */
  draggableCursor?: boolean;
  /** Desaturate and dim the map for dark sections (e.g. site footer) */
  muted?: boolean;
}>;

const DEFAULT_SHOP_EMBED =
  "https://maps.google.com/maps?q=Explore+Malta+Rentals,+Pieta,+Malta&ll=35.8930132,14.4967482&z=16&hl=en&output=embed";

function biasQueryToMalta(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;
  return /malta/i.test(trimmed) ? trimmed : `${trimmed}, Malta`;
}

/**
 * Embedded map — set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` to a full embed URL from
 * Google Maps → Share → Embed for a precise pin; otherwise uses a coordinates-based
 * embed that pins the exact shop location.
 *
 * When `query` is provided, the embed searches that address instead of the shop pin.
 */
export function GoogleMapEmbed({
  className,
  query,
  showFooterLink = true,
  draggableCursor = false,
  muted = false,
}: GoogleMapEmbedProps) {
  const t = useTranslations("Common");
  const embedUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL?.trim();
  const [debouncedQuery, setDebouncedQuery] = useState(query?.trim() ?? "");

  useEffect(() => {
    const next = query?.trim() ?? "";
    const timer = window.setTimeout(() => {
      setDebouncedQuery(next);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [query]);

  const searchQuery = debouncedQuery ? biasQueryToMalta(debouncedQuery) : "";
  const src = searchQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&z=16&hl=en&output=embed`
    : embedUrl || DEFAULT_SHOP_EMBED;
  const mapsHref = searchQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`
    : SITE_GOOGLE_MAPS_URL;

  return (
    <div className={`relative flex flex-col overflow-hidden ${className ?? ""}`}>
      <div className={muted ? "relative min-h-0 flex-1 grayscale" : "relative min-h-0 flex-1"}>
        <iframe
          title={t("mapEmbedTitle")}
          src={src}
          className={`h-full w-full border-0${draggableCursor ? " cursor-grab active:cursor-grabbing" : ""}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      {showFooterLink ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={
            muted
              ? "flex items-center justify-end gap-1.5 bg-white/10 px-3 py-1.5 text-[0.7rem] font-semibold text-white/75 transition-colors hover:text-white hover:underline"
              : "flex items-center justify-end gap-1.5 bg-white/90 px-3 py-1.5 text-[0.7rem] font-semibold text-[#1a73e8] hover:underline"
          }
          aria-label={t("mapOpenAria")}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 fill-current" aria-hidden>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          {t("mapViewOnMaps")}
        </a>
      ) : null}
    </div>
  );
}
