import { format } from "date-fns";

import type { Booking } from "@/generated/prisma/client";

import { buildCompanyEmailTemplate } from "./buildCompanyEmailTemplate";
import type { AdminBookingNotificationEmailContent } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOptional(value: string | null | undefined): string {
  return value?.trim() || "—";
}

function formatMoneyEur(value: { toString(): string } | number): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  if (Number.isNaN(n)) return "€0.00";
  return new Intl.NumberFormat("en-MT", { style: "currency", currency: "EUR" }).format(n);
}

function formatDateTime(d: Date): string {
  return format(d, "dd MMM yyyy, HH:mm");
}

function vehicleLabel(vehicleType: Booking["vehicleType"]): string {
  if (vehicleType === "ATV") return "ATV / Quad";
  return vehicleType;
}

function cdwLabel(option: Booking["cdwOption"]): string {
  switch (option) {
    case "NO_CDW":
      return "No Insurance";
    case "REDUCE_350_50CC":
      return "Basic Plan (historical 50cc package)";
    case "REDUCE_500_125CC":
      return "Basic Plan";
    case "FULL_COVERAGE_50CC_125CC":
      return "Full Coverage";
    case "REDUCE_800_ATV":
      return "ATV reduced liability (EUR 800)";
    default:
      return option;
  }
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;width:40%;font-size:13px;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:500;">${value}</td>
  </tr>`;
}

function section(title: string, rows: string): string {
  return `
  <h3 style="margin:18px 0 8px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">${escapeHtml(title)}</h3>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e5e7eb;">
    ${rows}
  </table>`;
}

/**
 * Builds the internal admin notification email for a new booking.
 * Sent to the business owner — not the customer.
 */
export function buildAdminBookingNotificationEmail(
  booking: Booking,
): AdminBookingNotificationEmailContent {
  const ref = booking.bookingReference;
  const subject = `🔔 New Booking — ${ref} (${vehicleLabel(booking.vehicleType)})`;

  const pickupWhen = formatDateTime(booking.pickupDateTime);
  const returnWhen = formatDateTime(booking.returnDateTime);

  /* ── text ──────────────────────────────────────────────────────── */
  const textSections = [
    `NEW BOOKING RECEIVED`,
    `Reference: ${ref}`,
    "",
    "CUSTOMER",
    `Name:    ${booking.customerFullName}`,
    `Email:   ${booking.customerEmail}`,
    `Phone:   ${formatOptional(booking.customerPhone)}`,
    "",
    "RENTAL",
    `Vehicle:  ${vehicleLabel(booking.vehicleType)}${booking.vehicleNameSnapshot ? ` — ${booking.vehicleNameSnapshot}` : ""}`,
    `Plate:    ${formatOptional(booking.vehicleLicensePlateSnapshot)}`,
    `Pickup:   ${pickupWhen}`,
    `Return:   ${returnWhen}`,
    `Duration: ${booking.billableDays} day(s)`,
    "",
    "PICKUP / DROP-OFF",
    `Pickup option:  ${booking.pickupOption === "DELIVERY" ? "Delivery" : "Office pickup"}`,
    `Pickup address: ${formatOptional(booking.pickupAddress)}`,
    `Drop-off:       ${booking.dropoffOption === "DROPOFF" ? "Drop-off at address" : "Return at office"}`,
    `Drop-off addr:  ${formatOptional(booking.dropoffAddress)}`,
    "",
    "ADD-ONS",
    `CDW:               ${cdwLabel(booking.cdwOption)}`,
    `Additional driver: ${booking.additionalDriverEnabled ? "Yes" : "No"}`,
    `Storage box:       ${booking.storageBoxSelected ? "Yes" : "No"}`,
    `Helmets:           ${[booking.helmetSize1, booking.helmetSize2].filter(Boolean).join(", ") || "—"}`,
    "",
    "PAYMENT",
    `Subtotal:     ${formatMoneyEur(booking.subtotal)}`,
    `Online:       ${formatMoneyEur(booking.totalDueOnline)}`,
    `Deposit:      ${formatMoneyEur(booking.depositAmount)} (${booking.depositMethod === "ONLINE" ? "online" : "in person"})`,
    `Due later:    ${formatMoneyEur(booking.totalDueLater)}`,
    "",
    `Reply to this email to contact the customer directly.`,
  ];
  const text = textSections.join("\n");

  /* ── html ──────────────────────────────────────────────────────── */
  const vehicleName = booking.vehicleNameSnapshot
    ? `${escapeHtml(vehicleLabel(booking.vehicleType))} — ${escapeHtml(booking.vehicleNameSnapshot)}`
    : escapeHtml(vehicleLabel(booking.vehicleType));

  const helmetStr = [booking.helmetSize1, booking.helmetSize2].filter(Boolean).join(", ") || "—";

  const htmlBody = `
  <!-- Alert banner -->
  <div style="margin:0 0 20px 0;padding:12px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;display:flex;align-items:center;gap:10px;">
    <span style="font-size:20px;">🔔</span>
    <div>
      <p style="margin:0;font-size:14px;font-weight:700;color:#92400e;">New booking received</p>
      <p style="margin:2px 0 0 0;font-size:12px;color:#b45309;">Action required — confirm availability and respond to the customer.</p>
    </div>
  </div>

  <!-- Reference -->
  <div style="margin:0 0 18px 0;padding:14px 16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;">
    <p style="margin:0 0 4px 0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Booking reference</p>
    <p style="margin:0;font-size:22px;font-weight:700;color:#111827;letter-spacing:0.03em;">${escapeHtml(ref)}</p>
  </div>

  ${section("Customer", [
    row("Full name", `<strong>${escapeHtml(booking.customerFullName)}</strong>`),
    row("Email", `<a href="mailto:${escapeHtml(booking.customerEmail)}" style="color:#0f766e;text-decoration:none;">${escapeHtml(booking.customerEmail)}</a>`),
    row("Phone", escapeHtml(formatOptional(booking.customerPhone))),
  ].join(""))}

  ${section("Rental", [
    row("Vehicle", vehicleName),
    row("License plate", escapeHtml(formatOptional(booking.vehicleLicensePlateSnapshot))),
    row("Pickup", escapeHtml(pickupWhen)),
    row("Return", escapeHtml(returnWhen)),
    row("Duration", `${booking.billableDays} day(s)`),
  ].join(""))}

  ${section("Pickup & drop-off", [
    row("Pickup option", booking.pickupOption === "DELIVERY" ? "🚚 Delivery to address" : "🏢 Office pickup"),
    row("Pickup address", escapeHtml(formatOptional(booking.pickupAddress))),
    row("Drop-off option", booking.dropoffOption === "DROPOFF" ? "📍 Drop-off at address" : "🏢 Return at office"),
    row("Drop-off address", escapeHtml(formatOptional(booking.dropoffAddress))),
  ].join(""))}

  ${section("Add-ons & protection", [
    row("CDW", escapeHtml(cdwLabel(booking.cdwOption))),
    row("Additional driver", booking.additionalDriverEnabled ? "✅ Yes" : "No"),
    row("Storage box", booking.storageBoxSelected ? "✅ Yes" : "No"),
    row("Helmets", escapeHtml(helmetStr)),
  ].join(""))}

  ${section("Payment", [
    row("Subtotal", escapeHtml(formatMoneyEur(booking.subtotal))),
    row("Paid online", escapeHtml(formatMoneyEur(booking.totalDueOnline))),
    row("Deposit", `${escapeHtml(formatMoneyEur(booking.depositAmount))} <span style="color:#6b7280;font-size:12px;">(${booking.depositMethod === "ONLINE" ? "online" : "in person at pickup"})</span>`),
    row("Due later", escapeHtml(formatMoneyEur(booking.totalDueLater))),
  ].join(""))}

  <p style="margin:20px 0 0 0;font-size:13px;color:#4b5563;">
    Reply directly to this email to contact <strong>${escapeHtml(booking.customerFullName)}</strong>.
  </p>`;

  const { html, text: templatedText } = buildCompanyEmailTemplate({
    subject,
    previewText: `New booking ${ref} — ${booking.customerFullName}`,
    htmlBody,
    textBody: text,
  });

  return { subject, html, text: templatedText };
}
