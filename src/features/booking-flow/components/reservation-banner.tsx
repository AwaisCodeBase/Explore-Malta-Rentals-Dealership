"use client";

import { Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";

type ReservationBannerProps = {
  remainingLabel: string | null;
};

export function ReservationBanner({ remainingLabel }: ReservationBannerProps) {
  const t = useTranslations("BookingFlow");

  return (
    <div className="flex items-start gap-3 rounded-[var(--r-card)] border border-emerald-200 bg-emerald-50/80 px-4 py-3.5 text-sm text-emerald-900 shadow-[var(--elev-1)]">
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
        aria-hidden
      >
        <Clock3 className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold tracking-[-0.01em]">{t("reservationBannerTitle")}</p>
        {remainingLabel ? (
          <p className="mt-0.5 text-emerald-800 tabular-nums">
            {t("reservationBannerExpires", { remaining: remainingLabel })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
