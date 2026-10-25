import type { servicesHeadlineIcons } from "@/features/home/data/home-sections";

export const SERVICE_ICON_SRC: Record<(typeof servicesHeadlineIcons)[number], string> = {
  "easy-pickup": "/benefits/clock.png",
  helmets: "/benefits/racing-helmet.png",
  flexible: "/benefits/google-calendar.png",
  "online-booking": "/benefits/booking.png",
  support: "/benefits/tourist.png",
  "hotel-delivery": "/benefits/hotel.png",
  "route-tips": "/benefits/app.png",
};

type ServiceHeadlineIconProps = Readonly<{
  id: (typeof servicesHeadlineIcons)[number];
  label: string;
  className?: string;
}>;

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ServiceHeadlineIcon({ id, label, className }: ServiceHeadlineIconProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- local PNG benefit icons */
    <img
      title={label}
      src={SERVICE_ICON_SRC[id]}
      alt=""
      aria-hidden
      width={80}
      height={80}
      className={joinClasses(
        "h-[3.25rem] w-[3.25rem] shrink-0 object-contain sm:h-[4.75rem] sm:w-[4.75rem] lg:h-20 lg:w-20",
        className,
      )}
    />
  );
}
