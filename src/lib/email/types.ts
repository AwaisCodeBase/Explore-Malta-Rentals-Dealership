export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional reply-to override. Defaults to the business contact email. */
  replyTo?: string;
};

export type BookingConfirmationEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type AdminBookingNotificationEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type SendEmailSuccess = {
  ok: true;
  deliveryMode: "resend" | "development_console";
};

export type SendEmailFailureReason = "transport_create_failed" | "send_failed";

export type SendEmailFailure = {
  ok: false;
  reason: SendEmailFailureReason;
  cause?: unknown;
};

export type SendEmailResult = SendEmailSuccess | SendEmailFailure;

export type SendBookingConfirmationFailureReason =
  | "template_build_failed"
  | SendEmailFailureReason;

export type SendBookingConfirmationResult =
  | { success: true; deliveryMode: "resend" | "development_console" | "already_sent" }
  | { success: false; reason: SendBookingConfirmationFailureReason; cause?: unknown };

export type BookingCancellationEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type SendBookingCancellationResult =
  | { success: true; deliveryMode: "resend" | "development_console" }
  | { success: false; reason: SendBookingConfirmationFailureReason; cause?: unknown };
