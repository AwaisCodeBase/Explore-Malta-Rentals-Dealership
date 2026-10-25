"use client";

import { Euro } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRICING_TIERS } from "@/lib/pricing/pricing-tiers";
import { formatDurationRuleLabel } from "@/lib/pricing/duration-pricing";

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type IndicativeDailyRatesCardProps = Readonly<{
  className?: string;
}>;

/**
 * Duration-discount glance card.
 * Visual chrome follows the landing-page-renewal redesign; tier data comes from
 * `PRICING_TIERS` (main) so discounts stay in sync with booking pricing.
 */
export function IndicativeDailyRatesCard({
  className,
}: IndicativeDailyRatesCardProps) {
  const t = useTranslations("IndicativeRates");
  return (
    <div
      className={joinClasses(
        "w-full overflow-hidden rounded-xl border border-slate-200/90 bg-[var(--surface-card)] shadow-sm ring-1 ring-slate-950/[0.04]",
        className,
      )}
    >
      <div className="flex flex-col gap-1 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-[#f0f7fc] px-6 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span
              aria-hidden
              className="inline-flex size-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--orange-500)_14%,white)] text-[var(--orange-600)] ring-1 ring-[color-mix(in_srgb,var(--orange-500)_22%,transparent)]"
            >
              <Euro className="size-3.5 shrink-0" />
            </span>
            {t("cardTitle")}
          </h3>
          <p className="mt-0.5 text-base font-semibold tracking-tight text-slate-800">
            {t("cardSubtitle")}
          </p>
        </div>
        <p className="text-xs text-slate-500 sm:text-right">{t("beforeExtras")}</p>
      </div>

      <dl className="grid gap-px bg-slate-200/80 sm:grid-cols-2">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.key}
            className="flex items-baseline justify-between gap-4 bg-[var(--surface-card)] px-6 py-3.5 sm:px-7 sm:py-4"
          >
            <dt className="text-sm font-medium text-slate-800">
              {formatDurationRuleLabel(tier.minDays, tier.maxDays)}
            </dt>
            <dd
              className={joinClasses(
                "shrink-0 text-right text-sm font-semibold tabular-nums",
                tier.discountPercent <= 0
                  ? "text-slate-500"
                  : "text-[var(--orange-600)]",
              )}
            >
              {tier.discountPercent <= 0
                ? t("noDiscount")
                : t("percentOff", { percent: tier.discountPercent })}
            </dd>
          </div>
        ))}
      </dl>

      <p className="border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 text-xs leading-relaxed text-slate-500 sm:px-7">
        {t("footnote")}
      </p>
    </div>
  );
}
