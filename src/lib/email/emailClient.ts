import { Resend } from "resend";

import { SITE_CONTACT } from "@/lib/site-brand-copy";

import type { EmailPayload, SendEmailResult } from "./types";

const MOCK_CONFIG_WARNING = "RESEND_API_KEY missing — using mock email sender (console only)";

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/**
 * Resolves the "from" address.
 * Before domain verification: use the Resend shared domain (onboarding@resend.dev).
 * After domain verification: set RESEND_FROM_EMAIL=Explore Malta Rentals <noreply@exploremaltarentals.com>
 */
function resolveFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Explore Malta Rentals <onboarding@resend.dev>"
  );
}

function logMockEmail(payload: EmailPayload): void {
  console.warn(MOCK_CONFIG_WARNING);
  console.log("[EMAIL MOCK] to:", payload.to);
  console.log("[EMAIL MOCK] subject:", payload.subject);
  console.log("[EMAIL MOCK] text:\n", payload.text);
}

/**
 * Sends an email via Resend.
 * Falls back to a console mock when RESEND_API_KEY is not set (safe for local dev).
 */
export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  if (!isResendConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] RESEND_API_KEY is not configured — refusing to mock in production");
      return { ok: false, reason: "transport_create_failed" };
    }
    logMockEmail(payload);
    return { ok: true, deliveryMode: "development_console" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!.trim());
    const to = payload.to.trim();

    const { data, error } = await resend.emails.send({
      from: resolveFromAddress(),
      to: [to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo ?? SITE_CONTACT.email,
    });

    if (error) {
      console.error("[email] Resend send failed", error);
      return { ok: false, reason: "send_failed", cause: error };
    }

    console.log("[email] Resend accepted message", { to, id: data?.id ?? null });
    return { ok: true, deliveryMode: "resend" };
  } catch (error) {
    console.error("[email] Resend unexpected error", error);
    return { ok: false, reason: "send_failed", cause: error };
  }
}
