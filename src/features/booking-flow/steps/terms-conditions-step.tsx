"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StepShell } from "@/features/booking-flow/components/step-shell";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";

const inlineLinkClass =
  "font-semibold text-blue-700 underline decoration-blue-500/40 underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-blue-800 hover:decoration-blue-500";

export function TermsConditionsStep() {
  const t = useTranslations("BookingWizard.terms");
  const { state, updateSection } = useBookingFlow();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <StepShell title={t("shellTitle")} description={t("shellDescription")}>
      <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-sunken)] p-4 sm:p-5">
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)] marker:text-[var(--orange-400)]">
          <li>{t("bullet1")}</li>
          <li>{t("bullet2")}</li>
          <li>{t("bullet3")}</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {t("readFull")}{" "}
          <Link href="/terms" className={inlineLinkClass}>
            {t("termsPage")}
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="type-spec mt-4 inline-flex min-h-10 items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-[var(--text-primary)] shadow-[var(--elev-1)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {t("openModal")}
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-card)] px-4 py-3.5 text-sm leading-relaxed text-[var(--text-secondary)] shadow-[var(--elev-1)] transition duration-[var(--dur-fast)] hover:border-[var(--line-strong)] has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50/60 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/20 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2">
        <input
          type="checkbox"
          checked={state.consent.termsAccepted}
          onChange={(event) => updateSection("consent", { termsAccepted: event.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm accent-[var(--blue-500)] focus:outline-none"
        />
        <span>{t("agreeCheckbox")}</span>
      </label>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--surface-inverse)]/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[var(--r-panel)] bg-[var(--surface-card)] p-5 shadow-[var(--elev-5)] sm:p-6">
            <h3 className="type-h3 text-[var(--text-primary)]">{t("modalTitle")}</h3>
            <hr className="rule-fade mt-4" />
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)] marker:text-[var(--orange-400)]">
              <li>{t("modalBullet1")}</li>
              <li>{t("modalBullet2")}</li>
              <li>{t("modalBullet3")}</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {t("fullAgreement")}{" "}
              <Link href="/terms" className={inlineLinkClass}>
                {t("viewComplete")}
              </Link>
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-5 text-sm font-semibold text-[var(--text-primary)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {t("close")}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSection("consent", {
                    termsAccepted: true,
                    termsAcceptedAt: new Date().toISOString(),
                  });
                  setIsModalOpen(false);
                }}
                className="inline-flex min-h-11 items-center rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[var(--elev-orange)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[var(--elev-orange-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                {t("iAgree")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </StepShell>
  );
}
