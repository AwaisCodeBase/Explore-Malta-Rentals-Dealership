"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  SITE_SHELL_OUTER,
  SITE_SHELL_CONTAINER,
  SITE_SHELL_INNER_PAD,
  SITE_NAV_CONTROL_BORDER,
  SITE_NAV_CONTROL_RADIUS,
} from "@/components/site-shell";
import { LanguageSwitcher } from "@/components/language-switcher";

const LOGO_SRC = "/explore%20malta%20rentals%20logo.png";

function isBookingEnabled() {
  const raw = process.env.NEXT_PUBLIC_BOOKING_ENABLED?.trim().toLowerCase();
  if (!raw) return true;
  return raw !== "false" && raw !== "0" && raw !== "no";
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function navLinkIsActive(href: string, pathname: string, hash: string): boolean {
  if (href === "/contact") {
    return pathname === "/contact" || (pathname === "/" && hash === "#contact");
  }
  if (href === "/#services") {
    return pathname === "/" && hash === "#services";
  }
  if (href === "/") {
    return pathname === "/" && hash !== "#contact" && hash !== "#services";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navLinkBaseClass =
  "text-[10px] font-medium normal-case tracking-normal transition-colors lg:text-[11px]";
const navLinkInactiveClass = `${navLinkBaseClass} text-white/90 hover:text-white`;
const navLinkActiveClass = `${navLinkBaseClass} text-[var(--brand-orange)] hover:text-[var(--brand-orange-strong)]`;

export function SiteNavbar() {
  const t = useTranslations("Nav");
  const tBanner = useTranslations("SiteBanner");
  const bookingEnabled = isBookingEnabled();
  const bookingDisabledMessage =
    process.env.NEXT_PUBLIC_BOOKING_DISABLED_MESSAGE?.trim() ||
    tBanner("onlineBookingUnavailable");
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileMenuId = useId();

  const navLinks = [
    { href: "/" as const, labelKey: "home" as const },
    { href: "/booking" as const, labelKey: "booking" as const },
    { href: "/vehicles" as const, labelKey: "vehicles" as const },
    { href: "/about" as const, labelKey: "about" as const },
    { href: "/guide" as const, labelKey: "guide" as const },
    { href: "/tours" as const, labelKey: "tours" as const },
    { href: "/contact" as const, labelKey: "contact" as const },
    { href: "/#services" as const, labelKey: "services" as const },
  ] as const;

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("booking-banner-hidden", bookingEnabled);
    return () => {
      document.documentElement.classList.remove("booking-banner-hidden");
    };
  }, [bookingEnabled]);

  useEffect(() => {
    const sync = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  useEffect(() => {
    startTransition(() => {
      closeMobileNav();
    });
  }, [pathname, hash, closeMobileNav]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen, closeMobileNav]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeBtn = mobilePanelRef.current?.querySelector<HTMLElement>(
      "[data-mobile-menu-close]",
    );
    requestAnimationFrame(() => closeBtn?.focus());
  }, [mobileNavOpen]);

  const mobileMenuOverlay =
    portalReady && mobileNavOpen
      ? createPortal(
          <div
            ref={mobilePanelRef}
            id={mobileMenuId}
            role="dialog"
            aria-modal="true"
            aria-label={t("primary")}
            className="fixed inset-0 z-[120] flex flex-col bg-[#f7f5f1]/92 backdrop-blur-2xl md:hidden"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_10%_0%,rgba(251,191,36,0.22),transparent_55%),radial-gradient(ellipse_50%_35%_at_90%_15%,rgba(148,163,184,0.2),transparent_50%),radial-gradient(ellipse_45%_30%_at_70%_85%,rgba(249,115,22,0.12),transparent_55%)]"
            />

            <div className="relative z-[1] flex items-center justify-between gap-4 px-5 pb-3 pt-[max(1rem,calc(env(safe-area-inset-top)+0.75rem))]">
              <Link
                href="/"
                className="relative inline-flex shrink-0 items-center overflow-hidden rounded-sm"
                onClick={closeMobileNav}
              >
                <Image
                  src={LOGO_SRC}
                  alt={t("logoAlt")}
                  width={320}
                  height={56}
                  className="block h-10 w-auto max-w-none object-contain object-left"
                  style={{ width: "auto" }}
                  priority
                />
              </Link>

              <button
                type="button"
                data-mobile-menu-close
                aria-label={t("close")}
                onClick={closeMobileNav}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-slate-700 shadow-sm transition-colors hover:bg-slate-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav className="relative z-[1] flex min-h-0 flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
              <ul className="m-0 flex min-h-0 flex-1 list-none flex-col justify-evenly overflow-hidden p-0">
                {navLinks.map(({ href, labelKey }, index) => {
                  const active = navLinkIsActive(href, pathname, hash);
                  const indexLabel = String(index + 1).padStart(2, "0");
                  return (
                    <li key={href} className="border-b border-slate-300/70">
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={closeMobileNav}
                        className="group relative flex items-baseline gap-2.5 overflow-hidden py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2"
                      >
                        {active ? (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0.5 -inset-x-3 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.55)_0%,rgba(249,115,22,0.22)_42%,transparent_72%)] blur-[1px]"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0.5 -inset-x-3 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.4)_0%,rgba(249,115,22,0.14)_42%,transparent_72%)] opacity-0 blur-[1px] transition-opacity duration-300 group-hover:opacity-100"
                          />
                        )}
                        <span className="relative z-[1] shrink-0 text-[0.65rem] font-medium tabular-nums tracking-[0.04em] text-slate-400">
                          {indexLabel}
                        </span>
                        <span
                          className={joinClasses(
                            "relative z-[1] block text-[1.05rem] font-semibold tracking-[-0.02em] sm:text-[1.125rem]",
                            active ? "text-slate-950" : "text-slate-800",
                          )}
                        >
                          {t(labelKey)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="relative z-[2] shrink-0 border-t border-slate-300/70 pt-3 font-sans">
                <p className="mb-1.5 text-[0.65rem] font-medium tracking-[0.04em] text-slate-400">
                  {t("language")}
                </p>
                <Suspense
                  fallback={
                    <div
                      className="h-8 w-full rounded-md border border-slate-200 bg-white/70"
                      aria-hidden
                    />
                  }
                >
                  <LanguageSwitcher variant="expanded" />
                </Suspense>
              </div>
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header
        className={joinClasses(
          "pointer-events-none fixed inset-x-0 top-0 z-50",
          SITE_SHELL_OUTER,
          "pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.75rem))] sm:pt-[max(1rem,calc(env(safe-area-inset-top)+1rem))]",
        )}
      >
        <div className={SITE_SHELL_CONTAINER}>
          <div className={SITE_SHELL_INNER_PAD}>
            <div className="site-navbar-shell pointer-events-auto w-full">
              <nav aria-label={t("primary")} className="site-navbar w-full text-white">
                <div
                  className={joinClasses(
                    "grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-1.5 pl-1.5 pr-3 sm:min-h-11 sm:gap-y-2 sm:py-1.5 sm:pl-1.5 sm:pr-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-4 md:pl-1.5 md:pr-5",
                  )}
                >
                  <Link
                    href="/"
                    className="site-navbar__logo relative inline-flex shrink-0 items-center self-center justify-self-start overflow-hidden rounded-sm"
                  >
                    <Image
                      src={LOGO_SRC}
                      alt={t("logoAlt")}
                      width={320}
                      height={56}
                      className="block h-9 w-auto max-w-none object-contain object-left sm:h-10"
                      style={{ width: "auto" }}
                      priority
                    />
                  </Link>

                  <ul
                    className={joinClasses(
                      "hidden list-none items-center justify-center justify-self-center gap-4 md:flex",
                      "lg:gap-6",
                    )}
                  >
                    {navLinks.map(({ href, labelKey }) => {
                      const active = navLinkIsActive(href, pathname, hash);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            className={active ? navLinkActiveClass : navLinkInactiveClass}
                            aria-current={active ? "page" : undefined}
                          >
                            {t(labelKey)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex shrink-0 items-center justify-self-end gap-2">
                    <div className="hidden font-sans md:block">
                      <Suspense
                        fallback={
                          <div
                            className="h-8 w-[5.5rem] rounded-md border border-white/25 bg-white/15 backdrop-blur-sm"
                            aria-hidden
                          />
                        }
                      >
                        <LanguageSwitcher />
                      </Suspense>
                    </div>

                    <button
                      type="button"
                      id={`${mobileMenuId}-trigger`}
                      className={joinClasses(
                        "flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border border-white/25 bg-white/10 px-2.5 py-1.5 text-[10px] font-medium normal-case tracking-normal text-white backdrop-blur-sm hover:bg-white/20 md:hidden",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2",
                        mobileNavOpen ? "border-white/35 bg-white/20" : undefined,
                      )}
                      aria-expanded={mobileNavOpen}
                      aria-controls={mobileMenuId}
                      onClick={() => setMobileNavOpen((open) => !open)}
                    >
                      {mobileNavOpen ? t("close") : t("menu")}
                    </button>

                    <Link
                      href="/booking"
                      className={joinClasses(
                        "group relative inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap px-3.5 py-1.5 text-[10px] font-bold normal-case tracking-[-0.01em] text-white sm:text-[11px]",
                        SITE_NAV_CONTROL_RADIUS,
                        SITE_NAV_CONTROL_BORDER,
                        "bg-gradient-to-br from-[#ffa939] via-[#f9900f] to-[#c45f0a] shadow-[0_12px_28px_-14px_rgba(196,95,10,0.88),0_5px_14px_-10px_rgba(15,23,42,0.6)]",
                        "transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:from-[#ffb54d] hover:via-[#ffa01a] hover:to-[#d96b0c] hover:shadow-[0_15px_32px_-14px_rgba(196,95,10,0.95),0_9px_18px_-12px_rgba(15,23,42,0.65)]",
                        "active:translate-y-0 active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                      )}
                    >
                      <span
                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.38)_48%,transparent_66%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        aria-hidden
                      />
                      <span className="relative z-10">{t("bookNow")}</span>
                      <span
                        className="relative z-10 inline-flex translate-x-0 transition-transform duration-300 group-hover:translate-x-0.5"
                        aria-hidden
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3.5 8h8" />
                          <path d="m8.5 4 4 4-4 4" />
                        </svg>
                      </span>
                    </Link>
                  </div>
                </div>
              </nav>
            </div>
            {!bookingEnabled ? (
              <div
                role="status"
                className="pointer-events-auto mt-2 rounded-xl border border-black/10 bg-[var(--brand-orange-strong)] px-4 py-2.5 text-center text-sm font-semibold tracking-wide text-white shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35),inset_0_-1px_0_rgba(0,0,0,0.08)]"
              >
                {bookingDisabledMessage}
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {mobileMenuOverlay}
    </>
  );
}
