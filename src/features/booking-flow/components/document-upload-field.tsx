"use client";

import { AlertCircle, CheckCircle2, Loader2, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useCallback, useEffect, useId, useRef, useState } from "react";
import {
  clearPendingBookingUpload,
  setPendingBookingUpload,
} from "@/features/booking-flow/lib/pending-booking-uploads";
import type { UploadCategory } from "@/lib/uploads/types";
import { validateUploadFile } from "@/lib/uploads/validators";

type DocumentUploadFieldProps = {
  label: string;
  description?: string;
  category: UploadCategory;
  bookingSessionId: string;
  value: string;
  onPathChange: (relativePath: string) => void;
  disabled?: boolean;
  name: string;
  "data-field"?: string;
};

export function DocumentUploadField({
  label,
  description,
  category,
  bookingSessionId,
  value,
  onPathChange,
  disabled = false,
  name,
  "data-field": dataField,
}: DocumentUploadFieldProps) {
  const t = useTranslations("BookingFlow");
  const reactId = useId();
  const inputId = `${reactId}-file`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasPath = value.trim().length > 0;

  const resetLocalStatus = useCallback(() => {
    setPhase("idle");
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (!value.trim()) {
      startTransition(() => {
        resetLocalStatus();
      });
    }
  }, [value, resetLocalStatus]);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) {
        return;
      }

      setPhase("uploading");
      setErrorMessage(null);
      const validation = validateUploadFile(file);
      if (!validation.ok) {
        setPhase("error");
        setErrorMessage(validation.message);
        return;
      }

      setPendingBookingUpload(bookingSessionId, category, file);
      onPathChange(validation.file.originalName);
      setPhase("success");
    },
    [bookingSessionId, category, disabled, onPathChange],
  );

  useEffect(() => {
    if (!value.trim()) {
      clearPendingBookingUpload(bookingSessionId, category);
    }
  }, [bookingSessionId, category, value]);

  return (
    <div className="space-y-2" data-field={dataField}>
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]"
      >
        {label}
      </label>
      {description ? (
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{description}</p>
      ) : null}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple={false}
        name={name}
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        disabled={disabled || phase === "uploading"}
        aria-invalid={phase === "error" ? true : undefined}
        className={`mt-1 block w-full cursor-pointer rounded-[var(--r-field)] border bg-[var(--surface-card)] py-2 pr-3 pl-2 text-sm text-[var(--text-secondary)] shadow-[var(--elev-1)] transition duration-[var(--dur-fast)] file:mr-3 file:cursor-pointer file:rounded-[0.4375rem] file:border-0 file:bg-[var(--surface-sunken)] file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-[var(--text-primary)] file:transition-colors hover:file:bg-[var(--ink-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:text-[var(--text-faint)] disabled:shadow-none ${
          phase === "error"
            ? "border-red-400 ring-2 ring-red-500/20"
            : "border-[var(--line)] hover:border-[var(--line-strong)]"
        }`}
        onChange={(event) => {
          const files = event.target.files;
          if (!files || files.length !== 1) {
            setPhase("error");
            setErrorMessage(t("documentUploadOneFile"));
            event.target.value = "";
            return;
          }
          const file = files[0];
          void handleFile(file);
          event.target.value = "";
        }}
      />
      <p className="text-xs text-[var(--text-muted)]">{t("documentUploadHint")}</p>

      {phase === "uploading" ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          {t("documentUploadAttaching")}
        </p>
      ) : null}
      {phase === "success" || (phase === "idle" && hasPath) ? (
        <p
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
          role="status"
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {t("documentUploadSuccess")}
        </p>
      ) : null}
      {phase === "error" && errorMessage ? (
        <p
          className="flex items-start gap-1.5 rounded-[var(--r-field)] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("documentUploadFailed", { message: errorMessage })}
        </p>
      ) : null}

      {hasPath ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--r-field)] border border-[var(--line-subtle)] bg-[var(--surface-soft)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--text-faint)]" aria-hidden />
          <span className="min-w-0 flex-1 break-all font-medium text-[var(--text-primary)]">
            {t("documentUploadAttached", { name: value })}
          </span>
          <button
            type="button"
            disabled={disabled || phase === "uploading"}
            onClick={() => {
              onPathChange("");
              resetLocalStatus();
            }}
            className="rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition duration-[var(--dur-fast)] hover:border-[var(--ink-400)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-[var(--line-subtle)] disabled:text-[var(--text-faint)]"
          >
            Remove
          </button>
          <button
            type="button"
            disabled={disabled || phase === "uploading"}
            onClick={() => {
              resetLocalStatus();
              inputRef.current?.click();
            }}
            className="rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition duration-[var(--dur-fast)] hover:border-[var(--ink-400)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-[var(--line-subtle)] disabled:text-[var(--text-faint)]"
          >
            Replace
          </button>
        </div>
      ) : null}
    </div>
  );
}
