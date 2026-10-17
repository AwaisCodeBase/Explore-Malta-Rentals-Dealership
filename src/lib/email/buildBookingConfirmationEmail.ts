import { format } from "date-fns";

import type { Booking } from "@/generated/prisma/client";

import { buildCompanyEmailTemplate } from "./buildCompanyEmailTemplate";
import type { BookingConfirmationEmailContent } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOptional(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "—";
  }
  return value.trim();
}

function formatMoneyEur(value: { toString(): string } | number): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  if (Number.isNaN(n)) {
    return "€0.00";
  }
  return new Intl.NumberFormat("en-MT", { style: "currency", currency: "EUR" }).format(n);
}

function formatDateTime(d: Date): string {
  return format(d, "dd MMM yyyy, HH:mm");
}

function vehicleLabel(vehicleType: Booking["vehicleType"]): string {
  return vehicleType;
}

function pickupOptionLabel(option: Booking["pickupOption"]): string {
  return option === "DELIVERY" ? "Delivery to address" : "Pickup at office";
}

function dropoffOptionLabel(option: Booking["dropoffOption"]): string {
  return option === "DROPOFF" ? "Drop-off at address" : "Return at office";
}

function depositMethodLabel(method: Booking["depositMethod"]): string {
  return method === "ONLINE" ? "Online (with this booking)" : "In person at pickup";
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

function helmetLine(booking: Booking): string {
  const parts: string[] = [];
  if (booking.helmetSize1) {
    parts.push(`Rider helmet: size ${booking.helmetSize1}`);
  }
  if (booking.helmetSize2) {
    parts.push(`Second helmet: size ${booking.helmetSize2}`);
  }
  if (parts.length === 0) {
    return "Helmets: as agreed with rental terms / office";
  }
  return parts.join(" · ");
}

/**
 * Builds subject, HTML, and plain-text bodies for the customer booking confirmation email.
 */
export function buildBookingConfirmationEmail(booking: Booking): BookingConfirmationEmailContent {
  const subject = `Explore Malta Rentals Booking Confirmation – ${booking.bookingReference}`;

  const customerName = escapeHtml(booking.customerFullName);
  const ref = escapeHtml(booking.bookingReference);
  const vehicle = escapeHtml(vehicleLabel(booking.vehicleType));
  const pickupWhen = formatDateTime(booking.pickupDateTime);
  const returnWhen = formatDateTime(booking.returnDateTime);
  const billableDays = booking.billableDays;
  const hours = booking.actualDurationHours.toString();

  const pickupOpt = escapeHtml(pickupOptionLabel(booking.pickupOption));
  const pickupAddr = escapeHtml(formatOptional(booking.pickupAddress));
  const dropOpt = escapeHtml(dropoffOptionLabel(booking.dropoffOption));
  const dropAddr = escapeHtml(formatOptional(booking.dropoffAddress));

  const cdw = escapeHtml(cdwLabel(booking.cdwOption));
  const addDriver = booking.additionalDriverEnabled ? "Yes" : "No";
  const storage = booking.storageBoxSelected ? "Yes" : "No";
  const helmetText = helmetLine(booking);

  const subtotal = formatMoneyEur(booking.subtotal);
  const totalOnline = formatMoneyEur(booking.totalDueOnline);
  const deposit = formatMoneyEur(booking.depositAmount);
  const depositMethod = escapeHtml(depositMethodLabel(booking.depositMethod));
  const dueLater = formatMoneyEur(booking.totalDueLater);

  const termsNote = booking.termsAccepted
    ? "Your booking is subject to the rental terms you accepted when submitting this request."
    : "Your booking is subject to Explore Malta Rentals rental terms.";

  const textSections = [
    `Hello ${booking.customerFullName},`,
    "",
    "Thank you for choosing Explore Malta Rentals. Your reservation has been successfully recorded.",
    "Please find your booking confirmation details below.",
    "",
    `BOOKING REFERENCE: ${booking.bookingReference}`,
    "",
    "RENTAL DETAILS",
    `Vehicle: ${vehicleLabel(booking.vehicleType)}`,
    `Pickup: ${pickupWhen}`,
    `Return: ${returnWhen}`,
    `Billable days: ${billableDays} (actual rental duration ≈ ${hours} hours)`,
    "",
    "PICKUP / DROP-OFF",
    `Pickup: ${pickupOptionLabel(booking.pickupOption)}`,
    `Pickup address (if delivery): ${formatOptional(booking.pickupAddress)}`,
    `Drop-off: ${dropoffOptionLabel(booking.dropoffOption)}`,
    `Drop-off address (if applicable): ${formatOptional(booking.dropoffAddress)}`,
    "",
    "ADD-ONS & PROTECTION",
    `CDW: ${cdwLabel(booking.cdwOption)}`,
    `Additional driver: ${addDriver}`,
    `Storage box: ${storage}`,
    `Helmets: ${helmetText}`,
    "",
    "PAYMENT SUMMARY",
    `Rental subtotal: ${subtotal}`,
    `Amount paid online: ${totalOnline}`,
    `Deposit amount: ${deposit}`,
    `Deposit payment method: ${depositMethodLabel(booking.depositMethod)}`,
    `Amount due later (if any): ${dueLater}`,
    "",
    "TERMS",
    termsNote,
    "",
    "If you need any amendments or support, reply to this email and our team will be happy to assist.",
  ];

  const text = textSections.join("\n");
  const htmlBody = `<p style="margin:0 0 14px 0;">Hello ${customerName},</p>
  <p style="margin:0 0 18px 0;color:#374151;">
    Thank you for choosing <strong>Explore Malta Rentals</strong>. Your reservation has been successfully recorded.
    Please find your booking confirmation details below.
  </p>

  <div style="margin:0 0 18px 0;padding:14px 16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;">
    <p style="margin:0 0 6px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Booking reference</p>
    <p style="margin:0;font-size:22px;font-weight:700;color:#111827;letter-spacing:0.03em;">${ref}</p>
  </div>

  <h2 style="margin:0 0 10px 0;font-size:16px;color:#111827;">Rental details</h2>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 16px 0;">
    <tr><td style="padding:7px 0;color:#6b7280;width:42%;">Vehicle</td><td style="padding:7px 0;color:#111827;">${vehicle}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Pickup</td><td style="padding:7px 0;color:#111827;">${escapeHtml(pickupWhen)}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Return</td><td style="padding:7px 0;color:#111827;">${escapeHtml(returnWhen)}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Duration</td><td style="padding:7px 0;color:#111827;">${billableDays} billable day(s) (${escapeHtml(hours)} hours)</td></tr>
  </table>

  <h2 style="margin:4px 0 10px 0;font-size:16px;color:#111827;">Pickup and return</h2>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 16px 0;">
    <tr><td style="padding:7px 0;color:#6b7280;width:42%;">Pickup option</td><td style="padding:7px 0;color:#111827;">${pickupOpt}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Pickup address</td><td style="padding:7px 0;color:#111827;">${pickupAddr}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Drop-off option</td><td style="padding:7px 0;color:#111827;">${dropOpt}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Drop-off address</td><td style="padding:7px 0;color:#111827;">${dropAddr}</td></tr>
  </table>

  <h2 style="margin:4px 0 10px 0;font-size:16px;color:#111827;">Add-ons and protection</h2>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 16px 0;">
    <tr><td style="padding:7px 0;color:#6b7280;width:42%;">CDW option</td><td style="padding:7px 0;color:#111827;">${cdw}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Additional driver</td><td style="padding:7px 0;color:#111827;">${addDriver}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Storage box</td><td style="padding:7px 0;color:#111827;">${storage}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Helmets</td><td style="padding:7px 0;color:#111827;">${escapeHtml(helmetText)}</td></tr>
  </table>

  <h2 style="margin:4px 0 10px 0;font-size:16px;color:#111827;">Payment summary</h2>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px 0;">
    <tr><td style="padding:7px 0;color:#6b7280;width:42%;">Rental subtotal</td><td style="padding:7px 0;color:#111827;">${escapeHtml(subtotal)}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Amount paid online</td><td style="padding:7px 0;color:#111827;">${escapeHtml(totalOnline)}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Deposit amount</td><td style="padding:7px 0;color:#111827;">${escapeHtml(deposit)}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Deposit method</td><td style="padding:7px 0;color:#111827;">${depositMethod}</td></tr>
    <tr><td style="padding:7px 0;color:#6b7280;">Amount due later</td><td style="padding:7px 0;color:#111827;">${escapeHtml(dueLater)}</td></tr>
  </table>

  <h2 style="margin:4px 0 10px 0;font-size:16px;color:#111827;">Terms reminder</h2>
  <p style="margin:0;color:#374151;">${escapeHtml(termsNote)}</p>
  <p style="margin:14px 0 0 0;color:#374151;">If you need any amendments or support, simply reply to this email and our team will assist you.</p>`;

  const { html, text: templatedText } = buildCompanyEmailTemplate({
    subject,
    previewText: `Booking ${booking.bookingReference} confirmed`,
    htmlBody,
    textBody: text,
  });

  return { subject, html, text: templatedText };
}
