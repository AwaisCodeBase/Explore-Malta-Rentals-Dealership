import { Link } from "@/i18n/navigation";

type ButtonLinkProps = Readonly<{
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  /** Defaults to `lg` so existing call sites keep their current footprint. */
  size?: "sm" | "md" | "lg";
  className?: string;
}>;

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const baseClass = joinClasses(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em]",
  "transition-[transform,box-shadow,background-color,border-color,color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-950)]",
  "motion-reduce:transition-none",
);

const sizeClasses: Record<NonNullable<ButtonLinkProps["size"]>, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm sm:px-6",
  lg: "min-h-12 px-6 py-3 text-sm sm:min-h-13 sm:px-7 sm:text-base",
};

const variantClasses: Record<NonNullable<ButtonLinkProps["variant"]>, string> = {
  primary: joinClasses(
    "bg-[var(--orange-400)] text-[var(--ink-950)] shadow-[var(--elev-orange)]",
    "hover:bg-[var(--orange-500)] hover:shadow-[var(--elev-orange-lift)] motion-safe:hover:-translate-y-0.5",
    "active:translate-y-0 active:bg-[var(--orange-600)] active:shadow-[var(--elev-orange)]",
  ),
  // Glass treatment: designed to sit on dark photography or the ink footer.
  secondary: joinClasses(
    "border border-[var(--line-inverse)] bg-white/[0.06] text-white backdrop-blur-md",
    "hover:border-white/25 hover:bg-white/[0.13] motion-safe:hover:-translate-y-0.5",
    "active:translate-y-0 active:bg-white/[0.09]",
  ),
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "lg",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={joinClasses(
        baseClass,
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
