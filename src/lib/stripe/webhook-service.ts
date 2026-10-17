import type Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma";
import { stripe } from "./stripe-client";
import { prisma } from "@/lib/prisma";
import { writePaymentAuditLog } from "./audit-service";
import { markBookingPaidAndConfirmIfPending } from "./confirm-paid-booking";
import { deliverBookingConfirmationIfNeeded } from "@/lib/email/deliverBookingConfirmation";
import { releaseUnpaidBooking } from "@/lib/booking/releaseUnpaidBooking";
import type { ProcessWebhookResult } from "./types";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Verifies the Stripe webhook signature and returns the parsed event.
 * Throws if the signature is invalid.
 */
export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  if (!WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
}

/**
 * Processes a single verified Stripe webhook event idempotently.
 * Returns { ok: true } if processed (or already processed), { ok: false } on real error.
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<ProcessWebhookResult> {
  const stripeEventId = event.id;
  const eventType = event.type;

  // Idempotency check — mark as processing first (upsert)
  const existing = await prisma.webhookEvent.findUnique({
    where: { stripeEventId },
    select: { processed: true },
  });

  if (existing?.processed) {
    return { ok: true, action: "skipped:already_processed", alreadyProcessed: true } as ProcessWebhookResult & { alreadyProcessed: boolean };
  }

  // Store the event payload (or create record if first time seeing it)
  const webhookRecord = await prisma.webhookEvent.upsert({
    where: { stripeEventId },
    create: {
      id: randomUUID(),
      stripeEventId,
      eventType,
      processed: false,
      payload: event as unknown as Prisma.InputJsonValue,
    },
    update: {},
  });

  await writePaymentAuditLog({
    action: "webhook_received",
    actor: "stripe-webhook",
    newValue: { eventType, stripeEventId },
  });

  try {
    let action = "unhandled";

    switch (eventType) {
      case "checkout.session.completed":
        action = await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.expired":
        action = await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        action = await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        action = await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.canceled":
        action = await handlePaymentIntentCancelled(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        action = await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "charge.dispute.created":
        action = await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case "charge.dispute.closed":
        action = await handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      case "refund.created":
        action = await handleRefundCreated(event.data.object as Stripe.Refund);
        break;

      case "refund.updated":
        action = await handleRefundUpdated(event.data.object as Stripe.Refund);
        break;

      default:
        console.log(`[webhook] Unhandled event type: ${eventType}`);
        action = "unhandled";
    }

    await prisma.webhookEvent.update({
      where: { id: webhookRecord.id },
      data: { processed: true, processedAt: new Date() },
    });

    return { ok: true, action };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[webhook] Failed to process event", { eventType, stripeEventId, error });

    await prisma.webhookEvent.update({
      where: { id: webhookRecord.id },
      data: { error: errorMessage },
    }).catch(() => null);

    return { ok: false, error: errorMessage };
  }
}

// ─── Event Handlers ────────────────────────────────────────────────────────────

async function confirmBookingPayment(
  bookingId: string,
  paymentIntentId: string | null,
  checkoutSessionId?: string,
  amountCents?: number | null,
  currency?: string | null,
): Promise<"payment_confirmed" | "already_succeeded"> {
  return prisma.$transaction(async (tx) => {
    const stripePayment = await tx.stripePayment.findUnique({ where: { bookingId } });
    if (!stripePayment) {
      throw new Error(`No StripePayment record found for bookingId=${bookingId}`);
    }

    if (stripePayment.stripeStatus === "SUCCEEDED") {
      // Success-page fallback may have marked Stripe/payment paid without confirming
      // the booking. Still promote PENDING_PAYMENT → CONFIRMED if needed.
      await markBookingPaidAndConfirmIfPending(
        tx,
        bookingId,
        "[stripe-webhook] Payment succeeded — booking confirmed",
      );
      return "already_succeeded";
    }

    await tx.stripePayment.update({
      where: { bookingId },
      data: {
        stripeStatus: "SUCCEEDED",
        stripePaymentIntentId: paymentIntentId ?? stripePayment.stripePaymentIntentId,
        ...(checkoutSessionId ? { stripeCheckoutSessionId: checkoutSessionId } : {}),
      },
    });

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });

    if (booking?.status === "CANCELLED") {
      throw new Error(`Cannot confirm payment for cancelled booking ${bookingId}`);
    }

    await markBookingPaidAndConfirmIfPending(
      tx,
      bookingId,
      "[stripe-webhook] Payment succeeded — booking confirmed",
    );

    if (checkoutSessionId) {
      await tx.stripeTransaction.create({
        data: {
          id: randomUUID(),
          stripePaymentId: stripePayment.id,
          transactionType: "charge",
          stripeTransactionId: checkoutSessionId,
          amountCents: amountCents ?? stripePayment.amountCents,
          currency: currency ?? stripePayment.currency,
          status: "succeeded",
          metadata: { checkoutSessionId, paymentIntentId },
        },
      });
    }

    return "payment_confirmed";
  });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<string> {
  const bookingId = session.metadata?.bookingId;
  const bookingReference = session.metadata?.bookingReference;

  if (!bookingId || !bookingReference) {
    throw new Error(`checkout.session.completed missing bookingId/bookingReference in metadata: ${session.id}`);
  }

  if (session.payment_status !== "paid") {
    console.log(`[webhook] Checkout session ${session.id} completed but payment_status=${session.payment_status}`);
    return "checkout_completed_payment_pending";
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const result = await confirmBookingPayment(
    bookingId,
    paymentIntentId,
    session.id,
    session.amount_total,
    session.currency,
  );

  if (result === "already_succeeded") {
    return "already_succeeded";
  }

  try {
    await deliverBookingConfirmationIfNeeded(bookingId);
  } catch (emailError) {
    console.error("[webhook] Confirmation email failed after payment", { bookingId, emailError });
  }

  await writePaymentAuditLog({
    bookingId,
    action: "payment_succeeded",
    actor: "stripe-webhook",
    newValue: { sessionId: session.id, paymentIntentId, amountCents: session.amount_total },
  });

  return "payment_confirmed";
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session): Promise<string> {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    return "no_booking_metadata";
  }

  await prisma.$transaction(async (tx) => {
    await tx.stripePayment.updateMany({
      where: { bookingId, stripeStatus: { not: "SUCCEEDED" } },
      data: { stripeStatus: "EXPIRED" },
    });

    await releaseUnpaidBooking(tx, bookingId, {
      actorLabel: "stripe-webhook",
      note: `Checkout session expired (${session.id}) — unpaid booking released`,
      allowConfirmedUnpaid: true,
    });
  });

  await writePaymentAuditLog({
    bookingId,
    action: "payment_cancelled",
    actor: "stripe-webhook",
    newValue: { sessionId: session.id, reason: "checkout_session_expired" },
  });

  return "checkout_session_expired_released";
}

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent): Promise<string> {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) {
    return "no_booking_metadata";
  }

  const result = await confirmBookingPayment(bookingId, intent.id);

  if (result !== "already_succeeded") {
    await writePaymentAuditLog({
      bookingId,
      action: "payment_succeeded",
      actor: "stripe-webhook",
      newValue: { paymentIntentId: intent.id },
    });
  }

  try {
    await deliverBookingConfirmationIfNeeded(bookingId);
  } catch (emailError) {
    console.error("[webhook] Confirmation email failed after payment_intent.succeeded", {
      bookingId,
      emailError,
    });
  }

  return result === "already_succeeded" ? "already_succeeded" : "payment_intent_succeeded";
}

async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent): Promise<string> {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) {
    return "no_booking_metadata";
  }

  await prisma.$transaction(async (tx) => {
    await tx.stripePayment.updateMany({
      where: { bookingId, stripeStatus: { not: "SUCCEEDED" } },
      data: { stripeStatus: "FAILED" },
    });

    await releaseUnpaidBooking(tx, bookingId, {
      actorLabel: "stripe-webhook",
      note: `Payment failed — ${intent.last_payment_error?.message ?? "card declined"}`,
      allowConfirmedUnpaid: true,
    });
  });

  await writePaymentAuditLog({
    bookingId,
    action: "payment_failed",
    actor: "stripe-webhook",
    newValue: {
      paymentIntentId: intent.id,
      failureMessage: intent.last_payment_error?.message,
    },
  });

  return "payment_failed";
}

async function handlePaymentIntentCancelled(intent: Stripe.PaymentIntent): Promise<string> {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) {
    return "no_booking_metadata";
  }

  await prisma.$transaction(async (tx) => {
    await tx.stripePayment.updateMany({
      where: { bookingId, stripeStatus: { not: "SUCCEEDED" } },
      data: { stripeStatus: "CANCELLED" },
    });

    await releaseUnpaidBooking(tx, bookingId, {
      actorLabel: "stripe-webhook",
      note: "Payment intent cancelled — unpaid booking released",
      allowConfirmedUnpaid: true,
    });
  });

  await writePaymentAuditLog({
    bookingId,
    action: "payment_cancelled",
    actor: "stripe-webhook",
    newValue: { paymentIntentId: intent.id },
  });

  return "payment_cancelled";
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<string> {
  const bookingId = charge.metadata?.bookingId;
  if (!bookingId) {
    return "no_booking_metadata";
  }

  const refundedAmountCents = charge.amount_refunded;
  const isFullRefund = charge.refunded;

  await prisma.stripePayment.updateMany({
    where: { bookingId },
    data: {
      stripeStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
      refundStatus: isFullRefund ? "FULL" : "PARTIAL",
      refundedAmountCents,
    },
  });

  await prisma.booking.updateMany({
    where: { id: bookingId },
    data: { paymentStatus: isFullRefund ? "REFUNDED" : "PAID" },
  });

  await writePaymentAuditLog({
    bookingId,
    action: "refund_succeeded",
    actor: "stripe-webhook",
    newValue: {
      chargeId: charge.id,
      refundedAmountCents,
      isFullRefund,
    },
  });

  return isFullRefund ? "full_refund_processed" : "partial_refund_processed";
}

async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<string> {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;

  const stripePayment = chargeId
    ? await prisma.stripePayment.findFirst({
        where: {
          StripeTransaction: { some: { stripeTransactionId: chargeId } },
        },
      })
    : null;

  const bookingId = stripePayment?.bookingId;

  if (bookingId) {
    await prisma.stripePayment.update({
      where: { bookingId },
      data: { stripeStatus: "DISPUTED" },
    });
  }

  await writePaymentAuditLog({
    bookingId,
    action: "dispute_created",
    actor: "stripe-webhook",
    newValue: {
      disputeId: dispute.id,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
      chargeId,
    },
  });

  console.warn("[webhook] Dispute created — admin action required", { disputeId: dispute.id, bookingId });
  return "dispute_recorded";
}

async function handleDisputeClosed(dispute: Stripe.Dispute): Promise<string> {
  await writePaymentAuditLog({
    action: "dispute_closed",
    actor: "stripe-webhook",
    newValue: {
      disputeId: dispute.id,
      status: dispute.status,
      reason: dispute.reason,
    },
  });

  return "dispute_closed";
}

async function handleRefundCreated(refund: Stripe.Refund): Promise<string> {
  const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : null;
  if (!paymentIntentId) {
    return "no_payment_intent";
  }

  const stripePayment = await prisma.stripePayment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!stripePayment) {
    return "no_payment_record";
  }

  await prisma.stripeRefund.upsert({
    where: { stripeRefundId: refund.id },
    create: {
      id: randomUUID(),
      stripePaymentId: stripePayment.id,
      stripeRefundId: refund.id,
      amountCents: refund.amount,
      reason: mapStripeRefundReason(refund.reason),
      status: refund.status ?? "pending",
      updatedAt: new Date(),
    },
    update: {
      status: refund.status ?? "pending",
    },
  });

  return "refund_recorded";
}

async function handleRefundUpdated(refund: Stripe.Refund): Promise<string> {
  await prisma.stripeRefund.updateMany({
    where: { stripeRefundId: refund.id },
    data: { status: refund.status ?? "unknown" },
  });
  return "refund_updated";
}

function mapStripeRefundReason(reason: Stripe.Refund["reason"] | null | undefined): import("@/generated/prisma").RefundReason {
  switch (reason) {
    case "duplicate":
      return "DUPLICATE";
    case "fraudulent":
      return "FRAUDULENT";
    default:
      return "REQUESTED_BY_CUSTOMER";
  }
}
