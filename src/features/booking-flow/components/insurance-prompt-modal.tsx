"use client";

import { useEffect, useId, useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { InsurancePlanOptions } from "@/features/booking-flow/components/insurance-plan-options";
import type { InsurancePlanCode, InsurancePlanSelection } from "@/lib/pricing/insurance-plans";

type InsurancePromptModalProps = {
  isOpen: boolean;
  rentalDays: number | null;
  initialPlan?: InsurancePlanSelection;
  onCancel: () => void;
  onConfirm: (plan: InsurancePlanCode) => void;
};

export function InsurancePromptModal({
  isOpen,
  rentalDays,
  initialPlan = null,
  onCancel,
  onConfirm,
}: InsurancePromptModalProps) {
  const t = useTranslations("BookingWizard.insurancePrompt");
  const tAddons = useTranslations("BookingWizard.addons");
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [draftPlan, setDraftPlan] = useState<InsurancePlanSelection>(initialPlan);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === overlayRef.current) {
      onCancel();
    }
  }

  function handleConfirm() {
    if (!draftPlan) {
      setShowError(true);
      return;
    }
    onConfirm(draftPlan);
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--ink-950)]/55 p-4 backdrop-blur-md sm:p-6"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      <m.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.985 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--r-panel)] bg-[var(--surface-card)] shadow-[var(--elev-5)] ring-1 ring-[var(--line)]"
      >
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,var(--blue-500),var(--blue-300),var(--blue-500))]" />

        <button
          type="button"
          onClick={onCancel}
          aria-label={t("dismiss")}
          className="absolute top-3.5 right-3.5 flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-faint)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pt-5 pb-5 sm:px-6 sm:pb-6">
          <h2 id={titleId} className="type-h3 pr-10 text-[var(--text-primary)]">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{t("description")}</p>

          <div className="mt-4">
            <InsurancePlanOptions
              selectedPlan={draftPlan}
              rentalDays={rentalDays}
              onSelect={(plan) => {
                setDraftPlan(plan);
                setShowError(false);
              }}
              name="insurancePromptPlan"
              compact
            />
          </div>

          {showError ? (
            <p
              className="mt-3 rounded-[var(--r-field)] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
              role="alert"
            >
              {t("selectionRequired")}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-5 text-sm font-semibold text-[var(--text-primary)] transition duration-[var(--dur-fast)] hover:border-[var(--ink-400)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-500 px-6 text-sm font-semibold text-white shadow-[var(--elev-3)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-[var(--elev-4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t("confirmContinue")}
            </button>
          </div>

          <p className="mt-4 text-[0.6875rem] leading-relaxed text-[var(--text-muted)]">
            {tAddons("insuranceExclusionsNote")}
          </p>
        </div>
      </m.div>
    </div>
  );
}
