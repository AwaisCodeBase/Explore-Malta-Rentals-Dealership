import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

export type FooterNavItem = Readonly<{
  href: string;
  label: string;
}>;

type FooterColumnProps = Readonly<{
  id: string;
  title: string;
  links: readonly FooterNavItem[];
}>;

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FooterColumn({ id, title, links }: FooterColumnProps) {
  return (
    <nav className="min-w-0" aria-labelledby={id}>
      <p id={id} className="type-spec text-[var(--ink-400)]">
        {title}
      </p>
      <Stagger as="ul" className="mt-5 list-none space-y-3 p-0" step={0.05} amount={0.3}>
        {links.map(({ href, label }) => (
          <StaggerItem as="li" key={href + label} y={10}>
            <Link
              href={href}
              className={joinClasses(
                "inline-block text-sm text-[var(--ink-300)] underline decoration-transparent underline-offset-4",
                "transition-[color,text-decoration-color,text-underline-offset] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                "hover:text-white hover:decoration-[var(--orange-400)] hover:underline-offset-[6px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-950)] rounded-sm",
              )}
            >
              {label}
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </nav>
  );
}

type FooterTrustItemProps = Readonly<{
  icon: ReactNode;
  title: string;
  description: string;
}>;

export function FooterTrustItem({ icon, title, description }: FooterTrustItemProps) {
  return (
    <div
      className={joinClasses(
        "flex gap-3.5 rounded-[var(--r-card)] bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm",
        "shadow-[inset_0_0_0_1px_var(--line-inverse)]",
        "transition-[background-color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
        "hover:bg-white/[0.07] hover:shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.2)] motion-safe:hover:-translate-y-0.5",
      )}
    >
      <div className="mt-0.5 shrink-0 text-[var(--orange-400)]" aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-[1.6] text-[var(--ink-400)]">{description}</p>
      </div>
    </div>
  );
}
