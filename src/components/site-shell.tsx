import type { ReactNode } from "react";

/** Primary white surfaces (navbar, booking panel) — keep in sync. */
export const SITE_SURFACE_RADIUS = "rounded-[var(--r-card)] sm:rounded-[var(--r-panel)]";

/** Compact navbar controls — slightly tighter than the bar itself (`rounded-md`). */
export const SITE_NAV_CONTROL_RADIUS = "rounded-sm";
export const SITE_NAV_CONTROL_BORDER =
  "border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]";

/** Horizontal layout shared by `SiteNavbar` and hero so edges line up. */
export const SITE_SHELL_OUTER = "px-3 sm:px-5";
export const SITE_SHELL_CONTAINER = "mx-auto w-full max-w-[90rem]";
export const SITE_SHELL_INNER_PAD = "px-4 sm:px-6 lg:px-10";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className={SITE_SHELL_OUTER}>
      <div className={SITE_SHELL_CONTAINER}>
        <div className={SITE_SHELL_INNER_PAD}>{children}</div>
      </div>
    </div>
  );
}
