import Image from "next/image";
import { SiteShell } from "@/components/site-shell";
import { HeroBookingConsole } from "@/features/home/components/hero-booking-console";
import { getFormBackgroundSrc } from "@/lib/form-background.server";

export function HeroBookingSection() {
  const backgroundSrc = getFormBackgroundSrc();
  return (
    <section
      id="hero-booking"
      className="relative isolate w-full overflow-hidden scroll-mt-[var(--site-header-offset)]"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={backgroundSrc}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-[22%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(0,0,0,0.25),transparent_70%)]" />
      </div>

      <SiteShell>
        <div className="relative z-10 py-10 sm:py-12 lg:py-14">
          <HeroBookingConsole />
        </div>
      </SiteShell>
    </section>
  );
}
