"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

type HoldExpiredNoticeProps = {
  message: string;
};

export function HoldExpiredNotice({ message }: HoldExpiredNoticeProps) {
  const t = useTranslations("BookingFlow");

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[var(--r-card)] border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-900 shadow-[var(--elev-1)]"
    >
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700"
        aria-hidden
      >
        <AlertTriangle className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold tracking-[-0.01em]">{t("holdExpiredTitle")}</p>
        <p className="mt-0.5 text-rose-800">{message}</p>
      </div>
    </div>
  );
}
