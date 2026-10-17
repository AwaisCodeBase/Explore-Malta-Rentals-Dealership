"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type TermsConsentModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onAgree: () => void | Promise<void>;
  isSubmitting?: boolean;
};

const TERMS_SUMMARY_SECTIONS = [
  {
    heading: "Driver Requirements",
    points: [
      "Minimum age is 21 years for all rentals, including 50cc, 125cc, and ATV.",
      "A valid driving licence and passport/ID must be presented at pickup.",
      "Non-EU licence holders may need an International Driving Permit (IDP).",
    ],
  },
  {
    heading: "Rental Period",
    points: [
      "Rentals are calculated by day.",
      "Late return may incur an additional fee and extra rental day charge.",
      "No-show or delays above one hour may result in cancellation.",
    ],
  },
  {
    heading: "Payments",
    points: [
      "Full rental payment is required before vehicle release.",
      "Accepted payment methods are cash and card.",
      "Displayed prices include VAT and basic insurance.",
    ],
  },
  {
    heading: "Security Deposit",
    points: [
      "A refundable security deposit of EUR 250 is collected at pickup for all vehicles.",
      "Deposit release may take up to 7-10 days after return checks.",
    ],
  },
  {
    heading: "Insurance & Liability",
    points: [
      "Third-party insurance is included; excess liability depends on vehicle category.",
    ],
  },
  {
    heading: "Optional Insurance (CDW)",
    points: [
      "Optional CDW can reduce excess liability according to selected plan.",
      "CDW does not cover negligence, alcohol/drug use, off-road misuse, lost keys, or tyre damage.",
    ],
  },
  {
    heading: "Delivery, Extras & Fees",
    points: [
      "Delivery and collection fees may apply depending on selected location/service.",
      "Additional driver and young driver fees apply where selected.",
      "Traffic fine administration fees apply for each violation.",
    ],
  },
  {
    heading: "Vehicle Condition",
    points: [
      "Vehicles are delivered in good working condition and should be inspected at pickup.",
      "Pickup photos are recommended to document vehicle condition.",
    ],
  },
  {
    heading: "Use of Vehicle (Strict Rules)",
    points: [
      "Dangerous driving, racing, sub-renting, and taking vehicles outside Malta are prohibited.",
      "Alcohol/drug use and any reckless use are material breaches of the contract.",
    ],
  },
  {
    heading: "Safety",
    points: [
      "Helmets are mandatory and must be used correctly during the rental period.",
      "Rider safety and responsible driving behaviour remain the renter's responsibility.",
    ],
  },
  {
    heading: "Damage & Costs",
    points: [
      "Customer is responsible for chargeable damage according to the damage assessment.",
      "Major damage, total loss, or theft may be charged up to the applicable liability.",
    ],
  },
  {
    heading: "Accident Procedure",
    points: [
      "In an accident, inform the company immediately and contact police when required.",
      "Do not admit liability to third parties before official reporting.",
      "Recovery costs, repair costs, and related losses may be charged to the customer.",
    ],
  },
  {
    heading: "Fines & Traffic Violations",
    points: [
      "Customer is responsible for all fines and traffic violations during rental.",
      "Administration fees apply per fine processed by the company.",
    ],
  },
  {
    heading: "Fuel Policy",
    points: [
      "Fuel policy is same-to-same (return with the same fuel level as pickup).",
      "Refuel service fee applies when returned fuel is below agreed level.",
    ],
  },
  {
    heading: "Breakdown",
    points: [
      "Mechanical faults are supported according to breakdown policy.",
      "Wrong fuel, lost keys, and misuse-related incidents are chargeable.",
    ],
  },
  {
    heading: "ATV / Quad Clause",
    points: [
      "Off-road use is not covered by insurance and is at customer's full risk.",
      "Any off-road related damage is fully chargeable to the customer.",
    ],
  },
  {
    heading: "Cancellation Policy",
    points: [
      "Free cancellation applies up to 48 hours before rental start.",
      "Cancellations inside 48 hours are non-refundable.",
    ],
  },
  {
    heading: "Loss / Theft",
    points: [
      "Customer remains fully liable in case of vehicle loss or theft.",
      "Charge may apply up to the full vehicle value.",
    ],
  },
  {
    heading: "GDPR Compliance",
    points: [
      "Customer data is processed under GDPR only for rental and legal compliance.",
      "Data is handled according to EU data protection obligations.",
    ],
  },
  {
    heading: "Termination",
    points: [
      "Company may terminate rental immediately for dangerous use or contract breach.",
      "No refund is issued after termination caused by customer breach.",
    ],
  },
  {
    heading: "Liability Waiver",
    points: [
      "Customer accepts the inherent risks related to vehicle operation.",
      "Company is not liable for personal belongings left in the vehicle.",
    ],
  },
] as const;

export function TermsConsentModal({ isOpen, onCancel, onAgree, isSubmitting = false }: TermsConsentModalProps) {
  const t = useTranslations("BookingFlow");
  const tTerms = useTranslations("BookingWizard.terms");
  const reduceMotion = useReducedMotion();
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--ink-950)]/55 p-4 backdrop-blur-md sm:p-6">
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.985 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[var(--r-panel)] bg-[var(--surface-card)] shadow-[var(--elev-5)] ring-1 ring-[var(--line)] sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="border-b border-[var(--line-subtle)] px-5 py-4 sm:px-6 sm:py-5">
          <p className="type-eyebrow text-orange-600">{t("termsConsentKicker")}</p>
          <h3 id="terms-modal-title" className="type-h3 mt-2 text-[var(--text-primary)]">
            {tTerms("modalTitle")}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
            {t("termsConsentReviewLead")}
          </p>
        </header>

        <div className="min-h-0 px-5 py-4 text-sm text-[var(--text-secondary)] sm:px-6">
          <div className="max-h-[42vh] overflow-y-auto overscroll-contain rounded-[var(--r-card)] border border-[var(--line-subtle)] bg-[var(--surface-sunken)] p-3 sm:p-4">
            <div className="space-y-3">
              {TERMS_SUMMARY_SECTIONS.map((section) => (
                <section
                  key={section.heading}
                  className="rounded-[var(--r-field)] bg-[var(--surface-card)] p-3.5 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-1)]"
                >
                  <h4 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                    {section.heading}
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm sm:leading-6">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
          <p className="mt-3">
            <Link
              href="/terms"
              target="_blank"
              className="font-semibold text-blue-600 underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-700 hover:decoration-blue-500"
            >
              {t("termsConsentOpenFull")}
            </Link>
          </p>
        </div>

        <footer className="border-t border-[var(--line-subtle)] bg-[var(--surface-soft)] px-5 py-4 sm:px-6 sm:py-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)] transition-colors duration-[var(--dur-fast)] hover:border-[var(--line-strong)] has-[:checked]:border-orange-300 has-[:checked]:bg-orange-50/60 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <input
              type="checkbox"
              checked={confirmChecked}
              disabled={isSubmitting}
              onChange={(event) => setConfirmChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded-[0.25rem] accent-[var(--orange-500)]"
            />
            <span>{t("termsConsentAgreeCheckbox")}</span>
          </label>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setConfirmChecked(false);
                onCancel();
              }}
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-5 text-sm font-semibold text-[var(--text-primary)] transition duration-[var(--dur-fast)] hover:border-[var(--ink-400)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[var(--line-subtle)] disabled:bg-transparent disabled:text-[var(--text-faint)]"
            >
              {t("termsConsentCancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmChecked(false);
                void onAgree();
              }}
              disabled={!confirmChecked || isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-orange-400 px-6 text-sm font-semibold text-white shadow-[var(--elev-orange)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-[var(--elev-orange-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[var(--ink-200)] disabled:text-[var(--text-faint)] disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("termsConsentSubmitting")}
                </>
              ) : (
                tTerms("iAgree")
              )}
            </button>
          </div>
        </footer>
      </m.div>
    </div>
  );
}
