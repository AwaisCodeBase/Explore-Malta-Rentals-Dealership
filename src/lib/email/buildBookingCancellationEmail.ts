import { buildCompanyEmailTemplate } from "./buildCompanyEmailTemplate";
import type { BookingCancellationEmailContent } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainTextToHtmlBody(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = escapeHtml(paragraph).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 14px 0;color:#374151;line-height:1.65;">${lines}</p>`;
    })
    .join("\n");
}

/**
 * Wraps the admin-edited cancellation message in the branded company template.
 */
export function buildBookingCancellationEmail(input: {
  subject: string;
  body: string;
  bookingReference: string;
}): BookingCancellationEmailContent {
  const subject = input.subject.trim();
  const body = input.body.trim();
  const htmlBody = plainTextToHtmlBody(body);
  const { html, text } = buildCompanyEmailTemplate({
    subject,
    previewText: `Booking ${input.bookingReference} cancelled`,
    htmlBody,
    textBody: body,
  });

  return { subject, html, text };
}
