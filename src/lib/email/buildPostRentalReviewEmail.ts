import { buildCompanyEmailTemplate } from "./buildCompanyEmailTemplate";
import type { BookingConfirmationEmailContent } from "./types";

export type PostRentalReviewEmailInput = {
  customerFullName: string;
  bookingReference: string;
  vehicleName: string;
  reviewUrl: string;
  /**
   * Trusted server-built HTML/text appended before the sign-off.
   * Point 10 can add a later post-rental note here. Point 9 does not.
   */
  additionalHtml?: string;
  additionalText?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function postRentalReviewSubject(bookingReference: string): string {
  return `Thank you for riding with Explore Malta Rentals – ${bookingReference}`;
}

/**
 * Customer emails in this project are English. Bookings do not store a locale,
 * and booking confirmation uses the same English company template.
 */
export function buildPostRentalReviewEmail(input: PostRentalReviewEmailInput): BookingConfirmationEmailContent {
  const subject = postRentalReviewSubject(input.bookingReference);
  const customerName = input.customerFullName.trim() || "there";
  const vehicleName = input.vehicleName.trim() || "your rental";
  const safeName = escapeHtml(customerName);
  const safeVehicle = escapeHtml(vehicleName);
  const safeReference = escapeHtml(input.bookingReference);
  const safeUrl = escapeHtml(input.reviewUrl);
  const extraHtml = input.additionalHtml?.trim() ? input.additionalHtml.trim() : "";
  const extraText = input.additionalText?.trim() ? input.additionalText.trim() : "";

  const textSections = [
    `Hello ${customerName},`,
    "",
    "Thank you for choosing Explore Malta Rentals. We hope you enjoyed your rental.",
    `Booking ${input.bookingReference} · ${vehicleName}`,
  ];
  if (extraText) {
    textSections.push("", extraText);
  }
  textSections.push(
    "",
    "We would really appreciate it if you shared your experience with us on Google.",
    "",
    `Leave a Google Review: ${input.reviewUrl}`,
    "",
    "If you need anything after your rental, reply to this email and our team will be happy to help.",
  );

  const htmlBody = `<p style="margin:0 0 14px 0;">Hello ${safeName},</p>
  <p style="margin:0 0 16px 0;color:#374151;line-height:1.6;">
    Thank you for choosing <strong>Explore Malta Rentals</strong>. We hope you enjoyed your rental.
  </p>
  <p style="margin:0 0 18px 0;color:#4b5563;line-height:1.6;">
    Booking <strong>${safeReference}</strong> · ${safeVehicle}
  </p>
  ${extraHtml ? `<div style="margin:0 0 22px 0;padding:14px 16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;color:#134e4a;line-height:1.6;">${extraHtml}</div>` : ""}
  <p style="margin:0 0 20px 0;color:#374151;line-height:1.6;">
    We would really appreciate it if you shared your experience with us on Google.
  </p>
  <p style="margin:0 0 8px 0;">
    <a href="${safeUrl}" style="display:inline-block;max-width:100%;box-sizing:border-box;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1.2;padding:14px 22px;border-radius:10px;">Leave a Google Review</a>
  </p>
  <p style="margin:0 0 18px 0;font-size:12px;line-height:1.5;color:#6b7280;word-break:break-all;">
    <a href="${safeUrl}" style="color:#0f766e;text-decoration:underline;">${safeUrl}</a>
  </p>
  <p style="margin:0;color:#4b5563;line-height:1.6;">
    If you need anything after your rental, reply to this email and our team will be happy to help.
  </p>`;

  const wrapped = buildCompanyEmailTemplate({
    subject,
    previewText: "Thank you for renting with Explore Malta Rentals",
    htmlBody,
    textBody: textSections.join("\n"),
  });

  return {
    subject,
    html: wrapped.html,
    text: wrapped.text,
  };
}
