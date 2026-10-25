"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type NoVehicleModalProps = {
  show: boolean;
  onDismiss: () => void;
};

export function NoVehicleModal({ show, onDismiss }: NoVehicleModalProps) {
  const t = useTranslations("BookingSteps.selectVehicle");
  const tFlow = useTranslations("BookingFlow");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      // small delay so the CSS transition fires after mount
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const id = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(id);
    }
  }, [show]);

  // Close on backdrop click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onDismiss();
  }

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, onDismiss]);

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 sm:p-6 ${
        visible ? "bg-slate-900/60 backdrop-blur-sm" : "bg-slate-900/0 backdrop-blur-none"
      }`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="no-vehicle-modal-title"
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/60 transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={tFlow("noVehicleDismiss")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 pb-8 pt-6 text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-orange)]/15 to-amber-100">
            <Bike className="h-8 w-8 text-[var(--brand-orange-strong)]" strokeWidth={1.75} />
          </div>

          <h2
            id="no-vehicle-modal-title"
            className="text-xl font-bold tracking-[-0.03em] text-slate-900"
          >
            {t("noneSelectedTitle")}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">{t("noneSelectedBodyLong")}</p>

          {/* CTA */}
          <div className="mt-6 flex flex-row items-center justify-center gap-3">
            <Link
              href="/vehicles"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-orange)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-orange-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2"
            >
              <Bike className="h-4 w-4" />
              {t("browseFleet")}
            </Link>

            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl px-4 py-2.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
            >
              {tFlow("noVehicleChooseLater")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
