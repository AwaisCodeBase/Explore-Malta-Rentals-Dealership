import { format } from "date-fns";

export type BookingCancellationDraftInput = {
  customerFullName: string;
  bookingReference: string;
  vehicleName: string;
  pickupDateTime: string | Date;
  returnDateTime: string | Date;
  refundPayment?: boolean;
};

export type BookingCancellationDraft = {
  subject: string;
  body: string;
};

function formatWhen(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return format(date, "dd MMM yyyy, HH:mm");
}

function refundParagraph(refundPayment: boolean | undefined): string {
  if (refundPayment) {
    return "A refund of your payment will be processed. If you have questions about timing, reply to this email.";
  }
  return "If you have already made a payment, our team will be in touch about any amount due back to you.";
}

/**
 * Default customer-facing cancellation email for the admin review/edit form.
 */
export function buildBookingCancellationEmailDraft(
  input: BookingCancellationDraftInput,
): BookingCancellationDraft {
  const subject = `Explore Malta Rentals – Booking ${input.bookingReference} cancelled`;
  const body = [
    `Hello ${input.customerFullName},`,
    "",
    "We're writing to confirm that your booking with Explore Malta Rentals has been cancelled.",
    "",
    `Booking reference: ${input.bookingReference}`,
    `Vehicle: ${input.vehicleName}`,
    `Pickup: ${formatWhen(input.pickupDateTime)}`,
    `Return: ${formatWhen(input.returnDateTime)}`,
    "",
    refundParagraph(input.refundPayment),
    "",
    "We're sorry we won't see you this time. If you would like to book again or need any help, just reply to this email and our team will assist you.",
    "",
    "Kind regards,",
    "Explore Malta Rentals",
  ].join("\n");

  return { subject, body };
}
