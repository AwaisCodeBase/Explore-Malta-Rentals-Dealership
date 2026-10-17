"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { WhatsAppIcon } from "@/features/home/components/whatsapp-action-link";
import { getWhatsAppChatUrl, toWhatsAppDigits } from "@/lib/whatsapp-number";

const DEFAULT_MESSAGE =
  "Hi! I'd like to book a ride / ask about availability in Malta.";

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function WhatsAppFloatingButton() {
  const t = useTranslations("WhatsApp");
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digits = toWhatsAppDigits(raw);
  const displayNumber = raw.trim() || (digits ? `+${digits}` : "");
  const chatUrl = digits
    ? getWhatsAppChatUrl(digits, DEFAULT_MESSAGE)
    : undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 sm:bottom-[max(1.75rem,env(safe-area-inset-bottom))] sm:right-[max(1.75rem,env(safe-area-inset-right))]"
    >
      <div className="pointer-events-auto relative flex flex-col items-end gap-2">
        {open ? (
          <div
            id={panelId}
            role="dialog"
            aria-label={t("panelAriaLabel")}
            className="w-[min(calc(100vw-2rem),18rem)] rounded-[var(--r-panel)] bg-[var(--surface-card)] p-5 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-4)]"
          >
            {digits ? (
              <>
                <p className="type-spec text-[var(--text-muted)]">{t("numberLabel")}</p>
                <p className="mt-2 break-all text-lg font-semibold tabular-nums text-[var(--ink-950)]">
                  {displayNumber}
                </p>
                <a
                  href={chatUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={joinClasses(
                    "mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white",
                    "shadow-[0_2px_6px_-2px_rgb(18_140_70_/_0.35),0_12px_26px_-10px_rgb(37_211_102_/_0.55)]",
                    "transition-[transform,box-shadow,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] motion-reduce:transition-none",
                    "hover:bg-[#1fbe5b] motion-safe:hover:-translate-y-0.5 active:translate-y-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128c46] focus-visible:ring-offset-2",
                  )}
                >
                  {t("openApp")}
                </a>
              </>
            ) : (
              <p className="text-sm leading-[1.65] text-[var(--text-secondary)]">
                Set{" "}
                <code className="rounded bg-[var(--surface-sunken)] px-1 py-0.5 text-xs">
                  whatsapp_number
                </code>{" "}
                in your <code className="text-xs">.env</code> file and restart
                the dev server.
              </p>
            )}
          </div>
        ) : null}

        <button
          type="button"
          suppressHydrationWarning
          aria-label={t("openContact")}
          title={t("faqLabel")}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((v) => !v)}
          className={joinClasses(
            "relative inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white",
            "shadow-[0_2px_6px_-2px_rgb(18_140_70_/_0.45),0_10px_24px_-8px_rgb(37_211_102_/_0.55),0_24px_56px_-18px_rgb(37_211_102_/_0.5)]",
            "transition-[transform,box-shadow,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] motion-reduce:transition-none",
            "hover:bg-[#1fbe5b] motion-safe:hover:scale-[1.06] active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128c46] focus-visible:ring-offset-2",
          )}
        >
          {/* Attention ring — suppressed for reduced-motion and once the panel is open. */}
          {open ? null : (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#25D366]/45 motion-safe:animate-ping [animation-duration:2.8s]"
            />
          )}
          <WhatsAppIcon className="h-6 w-6 shrink-0" />
        </button>
      </div>
    </div>
  );
}
