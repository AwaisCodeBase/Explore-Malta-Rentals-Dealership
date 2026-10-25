import { getTranslations } from "next-intl/server";
import { BookingSearchForm } from "@/features/booking/components/booking-search-form";

/**
 * Frames the existing {@link BookingSearchForm} as a premium hero "console".
 *
 * This is a presentation-only wrapper: it adds a console header (label +
 * availability chip) and a trust note, then renders the real search form
 * untouched. All booking validation, routing, search-param and date logic
 * lives inside `BookingSearchForm` and is deliberately left unchanged.
 */
export async function HeroBookingConsole() {
  const tHome = await getTranslations("Home");

  return (
    <section
      aria-label={tHome("heroConsoleTitle")}
      className="w-full shrink-0"
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-px w-7 bg-white/30" aria-hidden />
          <span className="text-[11px] font-semibold tracking-[0.02em] text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
            {tHome("heroConsoleTitle")}
          </span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold tracking-[-0.01em] text-white/85 backdrop-blur-sm [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
          {tHome("heroMetaRental")}
        </span>
      </div>

      <BookingSearchForm quickFilterTone="hero" />

      <p className="mt-3 text-center text-xs font-medium text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.85)]">
        {tHome("heroConsoleNote")}
      </p>
    </section>
  );
}
