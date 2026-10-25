import { Bike, CalendarDays, Mountain, Scooter, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fleetMarqueeItems } from "@/features/home/data/home-sections";

const FLEET_ICONS: Record<(typeof fleetMarqueeItems)[number]["id"], LucideIcon> = {
  premiumBikes: Sparkles,
  scooters: Scooter,
  cityRides: Bike,
  adventureRides: Mountain,
  longRental: CalendarDays,
};

function FleetStripItem({
  label,
  icon: Icon,
}: Readonly<{ label: string; icon: LucideIcon }>) {
  return (
    <Link
      href="/vehicles"
      className="group flex w-[8.25rem] shrink-0 flex-col items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-[9.5rem]"
    >
      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-inset ring-white/[0.04] transition-[border-color,background-color,box-shadow] duration-300 group-hover:border-[var(--brand-orange)]/40 group-hover:bg-white/[0.05] group-hover:shadow-[0_0_28px_-8px_rgba(255,147,15,0.35)] sm:h-14 sm:w-14">
        <Icon
          className="size-[1.35rem] text-white/42 transition-[color,transform] duration-300 group-hover:scale-105 group-hover:text-[var(--brand-orange)] sm:size-6"
          strokeWidth={1.25}
          aria-hidden
        />
      </span>
      <span className="fleet-category-strip__label text-center text-[13px] text-white/48 transition-colors duration-300 group-hover:text-white/88 sm:text-sm">
        {label}
      </span>
    </Link>
  );
}

export async function FleetCategoryStrip() {
  const t = await getTranslations("Home.fleetMarquee");
  const tDynamic = t as unknown as (key: string) => string;

  const items = fleetMarqueeItems.map((item) => ({
    id: item.id,
    label: tDynamic(item.id),
    icon: FLEET_ICONS[item.id],
  }));

  const track = [...items, ...items];

  return (
    <div
      aria-label={tDynamic("aria")}
      className="group/marquee relative -mx-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] sm:-mx-6 lg:-mx-8"
    >
      <ul className="fleet-marquee-track m-0 flex w-max list-none items-stretch gap-10 p-0 px-4 sm:gap-12 sm:px-6 lg:gap-14 lg:px-8">
        {track.map((item, index) => (
          <li key={`${item.id}-${index}`} aria-hidden={index >= items.length}>
            <FleetStripItem label={item.label} icon={item.icon} />
          </li>
        ))}
      </ul>
    </div>
  );
}
