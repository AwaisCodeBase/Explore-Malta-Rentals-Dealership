"use client";

import type { ReactNode } from "react";

type HeroWatchVideoLinkProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function HeroWatchVideoLink({ children, className }: HeroWatchVideoLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const section = document.getElementById("hero-booking");
    const video = section?.querySelector("video");
    if (video) {
      section?.scrollIntoView({ behavior: "smooth", block: "center" });
      void video.play();
      return;
    }
    window.location.hash = "hero-booking";
  };

  return (
    <a href="#hero-booking" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
