"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  INSURANCE_PLAN_CODES,
  INSURANCE_PLANS,
  type InsurancePlanCode,
  type InsurancePlanSelection,
} from "@/lib/pricing/insurance-plans";
import { formatEur } from "@/lib/pricing/calculate-booking-price";

type InsurancePlanOptionsProps = {
  selectedPlan: InsurancePlanSelection;
  rentalDays: number | null;
  onSelect: (plan: InsurancePlanCode) => void;
  name?: string;
  compact?: boolean;
};

export function InsurancePlanOptions({
  selectedPlan,
  rentalDays,
  onSelect,
  name = "insurancePlan",
  compact = false,
}: InsurancePlanOptionsProps) {
  const t = useTranslations("BookingWizard.addons");
  const days = rentalDays !== null && rentalDays > 0 ? rentalDays : null;

  return (
    <div
      role="radiogroup"
      aria-label={t("insuranceTitle")}
      className={compact ? "grid gap-2" : "grid gap-3"}
    >
      {INSURANCE_PLAN_CODES.map((code) => {
        const plan = INSURANCE_PLANS[code];
        const selected = selectedPlan === code;
        const dailyRate = plan.dailyRate;
        const total = days !== null ? dailyRate * days : null;

        return (
          <label
            key={code}
            className={`relative flex cursor-pointer gap-3 rounded-[var(--r-card)] border p-3.5 transition duration-[var(--dur-base)] ease-[var(--ease-standard)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2 ${
              selected
                ? "border-blue-400 bg-blue-50/70 ring-2 ring-blue-500/25 shadow-[var(--elev-2)]"
                : "border-[var(--line)] bg-[var(--surface-card)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)]"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={code}
              checked={selected}
              onChange={() => onSelect(code)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--blue-500)] focus:outline-none"
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span
                  className={`flex items-center gap-1.5 text-sm font-semibold tracking-[-0.01em] ${
                    selected ? "text-blue-800" : "text-[var(--text-primary)]"
                  }`}
                >
                  {selected ? (
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white"
                      aria-hidden
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={4} />
                    </span>
                  ) : null}
                  {t(`insurancePlan.${code}.name`)}
                </span>
                <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {dailyRate === 0
                    ? t("insuranceFree")
                    : t("insurancePerDay", { amount: formatEur(dailyRate) })}
                </span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--text-secondary)]">
                {t(`insurancePlan.${code}.coverage`)}
              </span>
              {days !== null && total !== null ? (
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                    selected
                      ? "bg-blue-100 text-blue-800"
                      : "bg-[var(--surface-sunken)] text-[var(--text-secondary)]"
                  }`}
                >
                  {t("insuranceTotalLine", {
                    days,
                    rate: formatEur(dailyRate),
                    total: formatEur(total),
                  })}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
