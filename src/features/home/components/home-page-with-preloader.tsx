"use client";

import {
  useCallback,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LandingPreloader } from "@/features/home/components/landing-preloader";
import {
  clearPreloaderShell,
  isLandingPreloaderEligible,
  markLandingPreloaderConsumed,
  setPreloaderActive,
  setPreloaderClientReady,
  setPreloaderPending,
  triggerHeroReveal,
} from "@/features/home/lib/landing-preloader-storage";

type HomePageWithPreloaderProps = Readonly<{
  children: ReactNode;
}>;

function subscribeToPreloaderEligibility() {
  return () => {};
}

export function HomePageWithPreloader({ children }: HomePageWithPreloaderProps) {
  const eligible = useSyncExternalStore(
    subscribeToPreloaderEligibility,
    isLandingPreloaderEligible,
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const showPreloader = eligible && !dismissed;

  useLayoutEffect(() => {
    if (!isLandingPreloaderEligible()) {
      clearPreloaderShell();
      return;
    }

    setPreloaderPending(true);
    setPreloaderActive(true);
  }, []);

  useLayoutEffect(() => {
    if (!showPreloader) return;
    setPreloaderClientReady(true);
  }, [showPreloader]);

  const handlePreloaderReveal = useCallback(() => {
    markLandingPreloaderConsumed();
    triggerHeroReveal();
    clearPreloaderShell();
  }, []);

  const handlePreloaderDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return (
    <>
      <div className="home-preloader-boundary__content">{children}</div>
      {showPreloader ? (
        <LandingPreloader onReveal={handlePreloaderReveal} onDismiss={handlePreloaderDismiss} />
      ) : null}
    </>
  );
}
