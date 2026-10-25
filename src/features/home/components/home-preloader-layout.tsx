import { LandingPreloaderInstant } from "@/features/home/components/landing-preloader-instant";
import type { ReactNode } from "react";

type HomePreloaderLayoutProps = Readonly<{
  children: ReactNode;
}>;

export function HomePreloaderLayout({ children }: HomePreloaderLayoutProps) {
  return (
    <div className="home-preloader-boundary" data-preloader-pending="true">
      <LandingPreloaderInstant />
      {children}
    </div>
  );
}
