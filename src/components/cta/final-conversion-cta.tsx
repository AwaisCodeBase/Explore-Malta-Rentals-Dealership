import { Link } from "@/i18n/navigation";
import Image from "next/image";

export type FinalConversionCtaProps = Readonly<{
  /** Section `aria-labelledby` target */
  titleId: string;
  titleLines: readonly string[];
  bodyLead?: string;
  bodyMuted: string;
  bodyClose?: string;
  aside: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
}>;

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7M17 7H8M17 7v9" />
    </svg>
  );
}

/**
 * Editorial closing CTA — dark minimalist layout with left-aligned headline,
 * two-column copy, and pill action button.
 */
export function FinalConversionCta({
  titleId,
  titleLines,
  bodyLead,
  bodyMuted,
  bodyClose,
  aside,
  primaryCta,
  secondaryCta,
}: FinalConversionCtaProps) {
  return (
    <section
      aria-labelledby={titleId}
      className="final-cta-editorial relative isolate w-full min-h-[28rem] overflow-hidden scroll-mt-28 py-20 sm:min-h-[32rem] sm:py-24 md:min-h-[36rem] md:py-32 lg:min-h-[40rem] lg:py-40"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/warehouse.png"
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="final-cta-editorial__background-image object-cover"
        />
        <div className="final-cta-editorial__background-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[88rem] px-5 sm:px-8 lg:px-12 xl:px-16">
        <h2 id={titleId} className="final-cta-fade-up final-cta-delay-1 final-cta-editorial__headline">
          {titleLines.map((line, index) => (
            <span key={`${index}-${line}`} className="final-cta-editorial__headline-line">
              {line}
            </span>
          ))}
        </h2>

        <div className="final-cta-editorial__grid mt-14 sm:mt-16 md:mt-20 lg:mt-24">
          <div className="final-cta-editorial__main">
            <p className="final-cta-fade-up final-cta-delay-2 final-cta-editorial__body">
              {bodyLead ? (
                <>
                  <span className="text-white">{bodyLead} </span>
                </>
              ) : null}
              <span className="text-neutral-400">{bodyMuted}</span>
              {bodyClose ? (
                <>
                  {" "}
                  <span className="text-white">{bodyClose}</span>
                </>
              ) : null}
            </p>

            <div className="final-cta-fade-up final-cta-delay-3 mt-10 md:mt-12">
              <Link
                href={primaryCta.href}
                className={joinClasses(
                  "inline-flex min-h-11 items-center gap-2.5 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium tracking-[-0.01em] text-white",
                  "ring-1 ring-inset ring-white/10 transition-colors duration-300",
                  "hover:bg-neutral-800 hover:ring-white/16",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                )}
              >
                <ArrowUpRightIcon />
                {primaryCta.label}
              </Link>
            </div>
          </div>

          <aside className="final-cta-editorial__aside">
            <p className="final-cta-fade-up final-cta-delay-4 final-cta-editorial__aside-text">{aside}</p>
            {secondaryCta ? (
              <p className="final-cta-fade-up final-cta-delay-5 mt-6">
                <Link
                  href={secondaryCta.href}
                  className={joinClasses(
                    "text-sm font-medium text-neutral-500 underline decoration-neutral-700 underline-offset-[0.3em] transition-colors duration-300",
                    "hover:text-neutral-300 hover:decoration-neutral-500",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm",
                  )}
                >
                  {secondaryCta.label}
                </Link>
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
