"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatVehicleTypeLabel, type Vehicle } from "@/features/vehicles/data/vehicles";

type VehicleRelatedSliderProps = Readonly<{
  vehicles: readonly Vehicle[];
  currentSlug: string;
}>;

/* Circular hairline control that fills on hover — same idiom as the gallery arrows. */
const controlClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-700)] shadow-[var(--elev-1)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink-950)] hover:shadow-[var(--elev-2)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2";

/* Photo plate matches VehicleCard so related slides read as the same object. */
const slidePhotoClass =
  "relative aspect-[4/3] overflow-hidden bg-[linear-gradient(155deg,var(--ink-50)_0%,var(--surface-sunken)_58%,var(--ink-100)_100%)]";

export function VehicleRelatedSlider({
  vehicles,
  currentSlug,
}: VehicleRelatedSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardW = el.querySelector("a")?.offsetWidth ?? 260;
    el.scrollBy({ left: dir === "right" ? cardW + 16 : -(cardW + 16), behavior: "smooth" });
  };

  const related = vehicles.filter((v) => v.slug !== currentSlug).slice(0, 10);
  if (related.length === 0) return null;

  return (
    <section aria-label="Similar vehicles" className="mt-16">
      <hr className="rule-fade" />
      <div className="mb-6 mt-12 flex items-end justify-between gap-4">
        <div>
          <h2 className="type-h3 text-[var(--ink-950)]">Similar vehicles</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
            Other rides you might like
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className={controlClass}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className={controlClass}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {related.map((vehicle) => {
          const img = vehicle.mainImageUrl ?? vehicle.images[0] ?? null;
          const typeLabel = formatVehicleTypeLabel(vehicle.apiVehicleType);
          return (
            <Link
              key={vehicle.slug}
              href={`/vehicles/${vehicle.slug}`}
              className="surface-card lift group w-[min(72vw,16rem)] shrink-0 snap-start overflow-hidden"
            >
              <div className={slidePhotoClass}>
                {img ? (
                  <Image
                    src={img}
                    alt={vehicle.name}
                    fill
                    sizes="17rem"
                    className="object-cover transition-transform duration-[var(--dur-slower)] ease-[var(--ease-out-expo)] will-change-transform motion-safe:group-hover:scale-[1.06]"
                    loading="lazy"
                  />
                ) : (
                  <div className="type-spec flex h-full items-center justify-center text-[var(--text-faint)]">
                    Image soon
                  </div>
                )}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgb(10_20_32/0.28),transparent)]"
                />
                <span className="type-spec absolute left-3 top-3 inline-flex items-center rounded-full border border-white/60 bg-white/85 px-2.5 py-1.5 text-[var(--ink-800)] shadow-sm backdrop-blur-md">
                  {typeLabel}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold leading-snug tracking-[-0.02em] text-[var(--ink-950)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)] group-hover:text-[var(--blue-600)]">
                  {vehicle.name}
                </h3>
                <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {vehicle.shortDescription ?? vehicle.tagline}
                </p>
                <p
                  data-numeric
                  className="mt-3 text-[0.9375rem] font-bold leading-none tracking-[-0.03em] text-[var(--ink-950)]"
                >
                  {vehicle.pricePerDay > 0 ? (
                    <>
                      From €{vehicle.pricePerDay}
                      <span className="ml-0.5 text-xs font-medium tracking-normal text-[var(--text-muted)]">
                        /day
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold tracking-normal text-[var(--text-muted)]">
                      Price on request
                    </span>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
