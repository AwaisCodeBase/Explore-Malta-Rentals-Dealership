import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { testimonials } from "@/features/home/data/home-sections";
import { getTranslations } from "next-intl/server";

const TRUSTPILOT_GREEN = "#00b67a";
const STAR_EMPTY = "#d6dfe8";

function RatingStars({ rating, ariaLabel }: { rating: number; ariaLabel: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={ariaLabel}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const filled = idx < rating;
        return (
          <svg
            key={idx}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
          >
            <path
              d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              fill={filled ? TRUSTPILOT_GREEN : STAR_EMPTY}
            />
          </svg>
        );
      })}
    </div>
  );
}

function TrustpilotStarMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path
        fill={TRUSTPILOT_GREEN}
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

export async function TestimonialsSection() {
  const t = await getTranslations("Home");
  const tDynamic = t as unknown as (key: string) => string;
  const loop = [...testimonials, ...testimonials];

  return (
    <section
      aria-labelledby="testimonials-title"
      className="scroll-mt-28 border-t border-[var(--line-subtle)] bg-[var(--surface-band)] py-20 sm:py-24 lg:py-32"
    >
      <Container>
        <Reveal as="div" y={22} className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="type-eyebrow text-orange-600">
              {t("testimonialsKicker")}
            </p>
            <h2 id="testimonials-title" className="type-h1 mt-5 text-ink-900">
              {t("testimonialsHeadline1")}
              <br />
              {t("testimonialsHeadline2")}
            </h2>
            <p className="mt-5 max-w-lg text-[length:var(--text-lead)] leading-[1.62] text-ink-600">
              {t("testimonialsDescription")}
            </p>

            <div className="mt-8 inline-flex items-center gap-4">
              <div className="inline-flex items-center gap-2.5 rounded-full bg-[var(--surface-card)] px-4 py-2.5 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-2)]">
                <TrustpilotStarMark className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold text-ink-900">
                  {t("testimonialsTrustLine")}
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {t("testimonialsExcellent")}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Rail sits outside the container so the loop runs full-bleed; the mask
          fades both edges without depending on the section background colour. */}
      <div className="relative mt-14 overflow-hidden pb-4 [mask-image:linear-gradient(to_right,transparent_0,black_7%,black_93%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0,black_7%,black_93%,transparent_100%)]">
        <div
          className="testimonial-marquee-track flex w-max gap-6"
          role="list"
          aria-label={t("testimonialsMarqueeAria")}
        >
          {loop.map((item, i) => {
            const base = `testimonials.${item.id}`;
            const name = tDynamic(`${base}.name`);
            const date = tDynamic(`${base}.date`);
            const location = tDynamic(`${base}.location`);
            const quote = tDynamic(`${base}.quote`);
            const ariaLabel = t("ratingStarsAria", { rating: item.rating });

            return (
              <div key={`${item.id}-${i}`} className="shrink-0" role="listitem">
                <article className="flex h-full w-[340px] shrink-0 flex-col rounded-[var(--r-panel)] bg-[var(--surface-card)] p-7 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-2)] sm:w-[420px]">
                  <div className="flex items-start justify-between gap-4">
                    <RatingStars rating={item.rating} ariaLabel={ariaLabel} />
                    <span
                      aria-hidden="true"
                      className="inline-flex size-10 items-center justify-center rounded-[var(--r-field)] bg-[var(--surface-soft)] text-ink-400 shadow-[inset_0_0_0_1px_var(--line-subtle)]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="currentColor"
                      >
                        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                      </svg>
                    </span>
                  </div>

                  <p className="mt-5 flex-1 text-[1.0625rem] leading-[1.65] text-ink-700">
                    {quote}
                  </p>

                  <div className="mt-7 flex items-center justify-between gap-4 border-t border-[var(--line-subtle)] pt-5">
                    <div>
                      <p className="text-sm font-bold tracking-[-0.01em] text-ink-900">
                        {name}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-500">{location}</p>
                    </div>
                    <p className="text-sm tabular-nums text-ink-500">{date}</p>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
