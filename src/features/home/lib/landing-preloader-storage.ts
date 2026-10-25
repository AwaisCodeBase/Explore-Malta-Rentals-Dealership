/** Resets on every full page reload; persists during client-side navigation. */
let preloaderConsumedThisPageLoad = false;

function getPreloaderBoundary(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector(".home-preloader-boundary");
}

function setBoundaryFlag(name: string, active: boolean): void {
  const boundary = getPreloaderBoundary();
  if (boundary == null) return;

  if (active) {
    boundary.dataset[name] = "true";
    return;
  }

  delete boundary.dataset[name];
}

export function isLandingPreloaderEligible(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  return !preloaderConsumedThisPageLoad;
}

export function markLandingPreloaderConsumed(): void {
  preloaderConsumedThisPageLoad = true;
}

export function setPreloaderActive(active: boolean): void {
  setBoundaryFlag("preloaderActive", active);
}

export function setPreloaderPending(active: boolean): void {
  setBoundaryFlag("preloaderPending", active);
}

export function setPreloaderClientReady(ready: boolean): void {
  setBoundaryFlag("preloaderClientReady", ready);
}

export function clearPreloaderShell(): void {
  setPreloaderPending(false);
  setPreloaderActive(false);
  setPreloaderClientReady(false);
}

export function triggerHeroReveal(): void {
  setBoundaryFlag("preloaderComplete", true);
}

export function clearHeroRevealFlag(): void {
  setBoundaryFlag("preloaderComplete", false);
}
