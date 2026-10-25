import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type ServiceBenefitCardProps = Readonly<{
  title: string;
  description: string;
  infoLabel: string;
  href?: string;
}>;

export function ServiceBenefitCard({
  title,
  description,
  infoLabel,
  href = "/vehicles",
}: ServiceBenefitCardProps) {
  return (
    <article className="group relative flex min-h-[17.5rem] flex-col rounded-[1.75rem] bg-white p-7 sm:min-h-[18.5rem] sm:p-8 lg:min-h-[19rem] lg:p-9">
      <h3 className="max-w-[85%] text-[clamp(1.35rem,2.2vw,1.75rem)] font-bold leading-[1.12] tracking-[-0.035em] text-slate-950">
        {title}
      </h3>

      <div className="mt-6 h-px w-full bg-slate-200/90" aria-hidden />

      <p className="mt-5 text-[11px] font-medium tracking-[0.02em] text-slate-400 sm:text-xs">
        {infoLabel}
      </p>

      <p className="mt-2 max-w-[92%] flex-1 text-sm leading-[1.65] text-slate-600 sm:text-[0.9375rem]">
        {description}
      </p>

      <Link
        href={href}
        className="absolute bottom-6 right-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E5E5E5] text-slate-900 transition-[background-color,transform] duration-300 hover:bg-slate-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 motion-reduce:hover:scale-100 sm:bottom-7 sm:right-7"
        aria-label={title}
      >
        <ArrowUpRight className="size-[1.125rem]" strokeWidth={2} aria-hidden />
      </Link>
    </article>
  );
}
