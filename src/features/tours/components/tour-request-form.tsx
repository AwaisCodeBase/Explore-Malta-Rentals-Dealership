"use client";

import { useState } from "react";

import { WhatsAppActionLink } from "@/features/home/components/whatsapp-action-link";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "fallback"; message: string };

const labelClass =
  "block text-[0.6875rem] font-semibold uppercase leading-[1.2] tracking-[0.08em] text-[var(--text-secondary)]";

const inputClass = [
  "mt-2 w-full rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface-card)]",
  "px-3.5 py-2.5 text-sm text-[var(--text-primary)] shadow-[var(--elev-1)] outline-none",
  "transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
  "placeholder:text-[var(--text-faint)]",
  "hover:border-[var(--line-strong)]",
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 focus:shadow-[var(--elev-2)]",
  "aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
  "disabled:cursor-not-allowed disabled:border-[var(--line-subtle)] disabled:bg-[var(--surface-sunken)] disabled:text-[var(--text-faint)] disabled:shadow-none",
].join(" ");

const noticeClass =
  "rounded-[var(--r-field)] border-l-[3px] px-4 py-3 text-sm leading-[1.6]";

export function TourRequestForm() {
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setState({ status: "error", message: "Please fill in your name, email, and message." });
      return;
    }

    setState({ status: "submitting" });

    try {
      const res = await fetch("/api/tour-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, message }),
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string };

      if (res.ok && data.ok) {
        setState({ status: "success" });
        form.reset();
        return;
      }

      if (res.status === 503 && data.code === "EMAIL_NOT_CONFIGURED") {
        setState({
          status: "fallback",
          message:
            "Online tour requests are not enabled on this server yet. Please reach us on WhatsApp or by email and we will get back to you.",
        });
        return;
      }

      setState({
        status: "error",
        message: "Something went wrong sending your message. Please try again or use WhatsApp.",
      });
    } catch {
      setState({
        status: "error",
        message: "Network error. Check your connection or use WhatsApp below.",
      });
    }
  }

  return (
    <div className="surface-panel p-7 sm:p-9">
      <h3 className="type-h3 text-[var(--text-primary)]">Request a tour</h3>
      <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-[1.7] text-[var(--text-secondary)]">
        Share your dates, group size, and what you would like to see. We will reply with options and
        pricing.
      </p>

      <hr className="rule-fade my-7" aria-hidden />

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="tour-name" className={labelClass}>
            Name <span className="text-orange-600">*</span>
          </label>
          <input
            id="tour-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={200}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="tour-email" className={labelClass}>
            Email <span className="text-orange-600">*</span>
          </label>
          <input
            id="tour-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            suppressHydrationWarning
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="tour-phone" className={labelClass}>
            Phone <span className="font-normal text-[var(--text-faint)]">(optional)</span>
          </label>
          <input
            id="tour-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="tour-message" className={labelClass}>
            Your request <span className="text-orange-600">*</span>
          </label>
          <textarea
            id="tour-message"
            name="message"
            required
            rows={5}
            maxLength={8000}
            placeholder="Dates, preferred tour type, group size, special requests…"
            className={`${inputClass} min-h-[7.5rem] resize-y`}
          />
        </div>

        {state.status === "success" ? (
          <p
            className={`${noticeClass} border-l-emerald-500 bg-emerald-50/80 text-emerald-900`}
            role="status"
          >
            Thank you — your message was sent. We will get back to you shortly.
          </p>
        ) : null}

        {state.status === "error" ? (
          <p className={`${noticeClass} border-l-red-500 bg-red-50/80 font-medium text-red-900`}>
            {state.message}
          </p>
        ) : null}

        {state.status === "fallback" ? (
          <div className={`${noticeClass} space-y-3 border-l-orange-400 bg-orange-50/80 text-orange-950`}>
            <p>{state.message}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={state.status === "submitting"}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-orange-400 px-6 py-2.5 text-sm font-semibold text-[var(--ink-950)] shadow-[var(--elev-orange)] transition-[background-color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-[var(--elev-orange-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--ink-200)] disabled:text-[var(--text-muted)] disabled:shadow-none disabled:hover:translate-y-0 motion-reduce:hover:translate-y-0"
          >
            {state.status === "submitting" ? "Sending…" : "Send request"}
          </button>
          <span className="text-xs text-[var(--text-faint)]">or</span>
          <WhatsAppActionLink
            message="Hi! I'm interested in a custom Malta tour. Can you share options and availability?"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--surface-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--elev-1)] ring-1 ring-inset ring-[var(--line)] transition-[background-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:bg-[var(--surface-sunken)] hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Message on WhatsApp
          </WhatsAppActionLink>
        </div>
      </form>
    </div>
  );
}
