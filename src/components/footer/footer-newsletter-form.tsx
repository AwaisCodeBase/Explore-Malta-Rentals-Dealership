"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FooterNewsletterForm() {
  const t = useTranslations("Footer");
  const id = useId();
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      noValidate
    >
      <label htmlFor={id} className="sr-only">
        {t("newsletterSrOnly")}
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
        <input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("newsletterPlaceholder")}
          required
          suppressHydrationWarning
          className={joinClasses(
            "min-h-12 w-full flex-1 rounded-[var(--r-field)] bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-[var(--ink-500)]",
            "shadow-[inset_0_0_0_1px_var(--line-inverse)] outline-none",
            "transition-[background-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)]",
            "hover:bg-white/[0.08]",
            "focus:bg-white/[0.09] focus:shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.28),0_0_0_3px_color-mix(in_srgb,var(--orange-400)_32%,transparent)]",
            "focus-visible:outline-none",
          )}
        />
        <button
          type="submit"
          suppressHydrationWarning
          className={joinClasses(
            "inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center rounded-[var(--r-field)] px-5 text-sm font-semibold tracking-[-0.02em]",
            "bg-[var(--orange-400)] text-[var(--ink-950)] shadow-[var(--elev-orange)]",
            "transition-[transform,box-shadow,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] motion-reduce:transition-none",
            "hover:bg-[var(--orange-500)] hover:shadow-[var(--elev-orange-lift)] motion-safe:hover:-translate-y-0.5",
            "active:translate-y-0 active:bg-[var(--orange-600)] active:shadow-[var(--elev-orange)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-950)]",
          )}
        >
          {t("newsletterSubmit")}
        </button>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {submitted ? t("newsletterSuccess") : ""}
      </p>
      {submitted ? (
        <p className="mt-3 text-xs leading-[1.6] text-[var(--orange-300)]" role="status">
          {t("newsletterSuccessLong")}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-[1.6] text-[var(--ink-500)]">
          {t("newsletterFinePrint")}
        </p>
      )}
    </form>
  );
}
