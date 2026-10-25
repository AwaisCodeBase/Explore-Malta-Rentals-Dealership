"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { AppLocale } from "@/i18n/routing";
import {
  getVisibleLocaleButtons,
  localeList,
  localeMetadata,
} from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  SITE_NAV_CONTROL_BORDER,
  SITE_NAV_CONTROL_RADIUS,
} from "@/components/site-shell";

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function LocalePill({
  loc,
  active,
  onSelect,
}: Readonly<{
  loc: AppLocale;
  active: boolean;
  onSelect: (loc: AppLocale) => void;
}>) {
  const { shortLabel } = localeMetadata[loc];
  return (
    <button
      type="button"
      onClick={() => onSelect(loc)}
      className={joinClasses(
        `relative min-h-7 min-w-8 overflow-hidden ${SITE_NAV_CONTROL_RADIUS} px-2 py-1 transition-all duration-300 sm:min-w-9`,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
        active
          ? "bg-gradient-to-br from-[#ffa939] via-[#f9900f] to-[#c45f0a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_18px_-10px_rgba(196,95,10,0.85)]"
          : "text-slate-600 hover:-translate-y-0.5 hover:bg-white/80 hover:text-slate-900 hover:shadow-[0_6px_14px_-12px_rgba(15,23,42,0.45)]",
      )}
      aria-current={active ? "true" : undefined}
      lang={loc}
    >
      {active ? (
        <span
          className="pointer-events-none absolute inset-x-1 top-0 h-px bg-white/60"
          aria-hidden
        />
      ) : null}
      {shortLabel}
    </button>
  );
}

type LanguageSwitcherProps = Readonly<{
  /** `expanded` shows more quick pills (mobile menu). `compact` keeps the slim navbar row. */
  variant?: "compact" | "expanded";
}>;

export function LanguageSwitcher({
  variant = "compact",
}: LanguageSwitcherProps = {}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const expanded = variant === "expanded";
  const visibleLocales = getVisibleLocaleButtons(locale, expanded ? 10 : 2);
  const visibleSet = new Set(visibleLocales);
  const overflowLocales = localeList.filter(({ code }) => !visibleSet.has(code));

  const query = searchParams.toString();
  const hrefSuffix = query ? `?${query}` : "";

  const switchLocale = useCallback(
    (loc: AppLocale) => {
      router.replace(`${pathname}${hrefSuffix}`, { locale: loc });
      setOpen(false);
    },
    [hrefSuffix, pathname, router],
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={t("language")}
      data-testid="language-switcher"
      className={joinClasses(
        "relative bg-white/80 p-0.5 text-[0.65rem] font-bold tracking-wide text-slate-700 backdrop-blur-xl backdrop-saturate-150 sm:text-xs",
        expanded
          ? "flex w-full flex-wrap items-center gap-1"
          : "flex items-center gap-0.5",
        SITE_NAV_CONTROL_RADIUS,
        SITE_NAV_CONTROL_BORDER,
      )}
    >
      {visibleLocales.map((loc) => (
        <LocalePill
          key={loc}
          loc={loc}
          active={locale === loc}
          onSelect={switchLocale}
        />
      ))}

      {overflowLocales.length > 0 ? (
        <div className="relative">
          <button
            type="button"
            id={`${menuId}-trigger`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${menuId}-listbox`}
            aria-label={t("selectLanguage")}
            onClick={() => setOpen((v) => !v)}
            className={joinClasses(
              `flex min-h-7 min-w-8 items-center justify-center ${SITE_NAV_CONTROL_RADIUS} px-1.5 py-1 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:text-slate-900 sm:min-w-9`,
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
              open ? "bg-white text-slate-900 shadow-[0_6px_14px_-12px_rgba(15,23,42,0.5)]" : undefined,
            )}
          >
            <GlobeIcon />
          </button>

          {open ? (
            <ul
              id={`${menuId}-listbox`}
              role="listbox"
              aria-labelledby={`${menuId}-trigger`}
              className={joinClasses(
                "language-switcher-dropdown absolute z-50 max-h-[min(18rem,70vh)] min-w-[11.5rem] overflow-y-auto overscroll-contain rounded-xl border border-white/70 bg-white/95 py-1.5 text-[0.7rem] font-semibold text-slate-800 shadow-[0_18px_42px_-18px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:text-xs",
                expanded
                  ? "bottom-[calc(100%+0.45rem)] start-0"
                  : "end-0 top-[calc(100%+0.45rem)]",
              )}
            >
              {(expanded ? overflowLocales : localeList).map(
                ({ code, label, nativeLabel }) => {
                  const active = code === locale;
                  return (
                    <li key={code} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        lang={code}
                        onClick={() => switchLocale(code)}
                        className={joinClasses(
                          "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-start transition-colors duration-150",
                          active
                            ? "bg-[var(--brand-orange)]/12 text-[var(--brand-orange-strong)]"
                            : "text-slate-800 hover:bg-slate-100 hover:text-slate-950",
                        )}
                      >
                        <span>{label}</span>
                        <span className="text-[0.65rem] tracking-wide text-slate-500">
                          {nativeLabel}
                        </span>
                      </button>
                    </li>
                  );
                },
              )}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
