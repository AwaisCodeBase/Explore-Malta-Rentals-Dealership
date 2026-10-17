"use client";

import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { DocumentUploadField } from "@/features/booking-flow/components/document-upload-field";

type AlreadyPaidProofModalProps = {
  isOpen: boolean;
  bookingSessionId: string;
  proofPath: string;
  onProofPathChange: (path: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AlreadyPaidProofModal({
  isOpen,
  bookingSessionId,
  proofPath,
  onProofPathChange,
  onCancel,
  onConfirm,
}: AlreadyPaidProofModalProps) {
  const t = useTranslations("BookingWizard.bookingSummary");
  const reduceMotion = useReducedMotion();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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

  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--ink-950)]/55 p-4 backdrop-blur-md sm:p-6">
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="already-paid-proof-title"
        initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.985 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[var(--r-panel)] bg-[var(--surface-card)] shadow-[var(--elev-5)] ring-1 ring-[var(--line)] sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="border-b border-[var(--line-subtle)] px-5 py-4 sm:px-6 sm:py-5">
          <h3 id="already-paid-proof-title" className="type-h3 text-[var(--text-primary)]">
            {t("alreadyPaidModalTitle")}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
            {t("alreadyPaidModalDescription")}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <DocumentUploadField
            label={t("alreadyPaidUploadLabel")}
            description={t("alreadyPaidUploadHint")}
            category="payment_proof"
            bookingSessionId={bookingSessionId}
            value={proofPath}
            onPathChange={(path) => {
              setLocalError(null);
              onProofPathChange(path);
            }}
            name="paymentProof"
            data-field="payment.proofPath"
          />
          {localError ? (
            <p
              role="alert"
              className="mt-2 rounded-[var(--r-field)] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {localError}
            </p>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--line-subtle)] bg-[var(--surface-soft)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-5 text-sm font-semibold text-[var(--text-primary)] transition duration-[var(--dur-fast)] hover:border-[var(--ink-400)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {t("alreadyPaidModalCancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!proofPath.trim()) {
                setLocalError(t("alreadyPaidProofRequired"));
                return;
              }
              onConfirm();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-500 px-6 text-sm font-semibold text-white shadow-[var(--elev-3)] transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-[var(--elev-4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {t("alreadyPaidModalConfirm")}
          </button>
        </footer>
      </m.div>
    </div>
  );
}
