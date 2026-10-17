"use client";

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "@/i18n/navigation";

const SCROLL_TO_RESULTS_KEY = "emr-scroll-to-vehicle-results";

/** Mark that the next vehicles listing paint should scroll to the results block. */
export function markScrollToVehicleResults(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_TO_RESULTS_KEY, "1");
  } catch {
    // Ignore quota / private-mode failures; search still works without scroll restore.
  }
}

/** Scroll to `#vehicle-listing-results` once after a search navigation, if flagged. */
export function consumeScrollToVehicleResults(): void {
  if (typeof window === "undefined") return;
  let shouldScroll = false;
  try {
    shouldScroll = sessionStorage.getItem(SCROLL_TO_RESULTS_KEY) === "1";
    if (shouldScroll) {
      sessionStorage.removeItem(SCROLL_TO_RESULTS_KEY);
    }
  } catch {
    return;
  }
  if (!shouldScroll) return;

  const scroll = () => {
    document
      .getElementById("vehicle-listing-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(scroll);
  });
}

type VehiclesSearchNavContextValue = Readonly<{
  isSearchPending: boolean;
  runSearchNavigation: (href: string) => void;
}>;

const VehiclesSearchNavContext =
  createContext<VehiclesSearchNavContextValue | null>(null);

export function VehiclesSearchNavProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const [isSearchPending, startTransition] = useTransition();

  const runSearchNavigation = useCallback(
    (href: string) => {
      markScrollToVehicleResults();
      startTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [router],
  );

  return (
    <VehiclesSearchNavContext.Provider
      value={{ isSearchPending, runSearchNavigation }}
    >
      {children}
    </VehiclesSearchNavContext.Provider>
  );
}

export function useVehiclesSearchNav(): VehiclesSearchNavContextValue | null {
  return useContext(VehiclesSearchNavContext);
}
