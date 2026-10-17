import { buildBookingCancellationEmail } from "./buildBookingCancellationEmail";
import { sendEmail } from "./emailClient";
import type { SendBookingCancellationResult } from "./types";

/**
 * Sends the customer booking cancellation email using the admin-reviewed subject and body.
 */
export async function sendBookingCancellation(input: {
  to: string;
  subject: string;
  body: string;
  bookingReference: string;
}): Promise<SendBookingCancellationResult> {
  const recipient = input.to.trim();
  if (!recipient) {
    return { success: false, reason: "send_failed" };
  }

  let subject: string;
  let html: string;
  let text: string;

  try {
    const built = buildBookingCancellationEmail({
      subject: input.subject,
      body: input.body,
      bookingReference: input.bookingReference,
    });
    subject = built.subject;
    html = built.html;
    text = built.text;
  } catch (error) {
    console.error("[email] Failed to build booking cancellation email", error);
    return { success: false, reason: "template_build_failed", cause: error };
  }

  const result = await sendEmail({
    to: recipient,
    subject,
    html,
    text,
  });

  if (result.ok) {
    console.log("[email] Cancellation email sent", {
      bookingReference: input.bookingReference,
      deliveryMode: result.deliveryMode,
    });
    return { success: true, deliveryMode: result.deliveryMode };
  }

  console.error("[email] Cancellation email was not sent", {
    bookingReference: input.bookingReference,
    reason: result.reason,
  });

  return {
    success: false,
    reason: result.reason,
    cause: result.cause,
  };
}
