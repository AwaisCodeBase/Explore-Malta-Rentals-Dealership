import { format } from "date-fns";
import { stripe } from "./stripe-client";
import { prisma } from "@/lib/prisma";
import { writePaymentAuditLog } from "./audit-service";
import { syncPaidBookingAndSendConfirmation } from "./confirm-paid-booking";
import type { CreateCheckoutSessionInput, CreateCheckoutSessionResult } from "./types";

const CURRENCY = "eur";

function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
  }
  return url;
}

function toAmountCents(amountEur: number): number {
  return Math.round(amountEur * 100);
}

/**
 * Creates a Stripe Checkout Session for a booking and stores a StripePayment record.
 * Idempotent: if a pending checkout session already exists for this booking, returns the existing URL.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> {
  const { bookingId, bookingReference, customerEmail, customerName, vehicleName, pickupDate, returnDate, amountEur, locale = "en" } = input;

  if (amountEur <= 0) {
    return { ok: false, error: "Payment amount must be greater than zero" };
  }

  const amountCents = toAmountCents(amountEur);
  const baseUrl = getAppBaseUrl();

  // Idempotency: check for an existing pending payment record
  const existing = await prisma.stripePayment.findUnique({
    where: { bookingId },
    select: {
      id: true,
      stripeCheckoutSessionId: true,
      stripeStatus: true,
    },
  });

  if (existing?.stripeStatus === "SUCCEEDED") {
    return { ok: false, error: "This booking has already been paid" };
  }

  // If a checkout session already exists and is still pending, try to reuse it
  if (existing?.stripeCheckoutSessionId && existing.stripeStatus === "PENDING") {
    try {
      const session = await stripe.checkout.sessions.retrieve(existing.stripeCheckoutSessionId);
      if (session.status === "open" && session.url) {
        return { ok: true, checkoutUrl: session.url, sessionId: session.id };
      }
    } catch {
      // Session expired or invalid — fall through to create a new one
    }
  }

  try {
    const idempotencyKey = `checkout-${bookingId}`;

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: customerEmail,
        client_reference_id: bookingReference,
        line_items: [
          {
            price_data: {
              currency: CURRENCY,
              product_data: {
                name: `${vehicleName} Rental`,
                description: `Booking ${bookingReference} · ${pickupDate} → ${returnDate}`,
                metadata: {
                  bookingId,
                  bookingReference,
                },
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId,
          bookingReference,
          customerName,
        },
        success_url: `${baseUrl}/${locale}/booking/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/${locale}/booking/payment/cancel?ref=${encodeURIComponent(bookingReference)}`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30-minute checkout window
        payment_intent_data: {
          metadata: {
            bookingId,
            bookingReference,
          },
          description: `Explore Malta Rentals — ${bookingReference}`,
          receipt_email: customerEmail,
        },
        locale: "en",
        allow_promotion_codes: false,
      },
      { idempotencyKey },
    );

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL" };
    }

    // Upsert StripePayment record
    await prisma.stripePayment.upsert({
      where: { bookingId },
      create: {
        id: crypto.randomUUID(),
        bookingId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        amountCents,
        currency: CURRENCY,
        stripeStatus: "PENDING",
        refundStatus: "NONE",
        updatedAt: new Date(),
        metadata: {
          customerEmail,
          customerName,
          vehicleName,
          pickupDate,
          returnDate,
        },
      },
      update: {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        stripeStatus: "PENDING",
        amountCents,
        updatedAt: new Date(),
      },
    });

    await writePaymentAuditLog({
      bookingId,
      action: "checkout_session_created",
      actor: customerEmail,
      newValue: {
        sessionId: session.id,
        amountEur,
        currency: CURRENCY,
      },
    });

    return { ok: true, checkoutUrl: session.url, sessionId: session.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe error";
    console.error("[payment-service] Failed to create checkout session", { bookingId, error });
    return { ok: false, error: `Payment session creation failed: ${message}` };
  }
}

/**
 * Retrieves the StripePayment record for a booking, including payment intent status.
 */
export async function getPaymentByBookingId(bookingId: string) {
  return prisma.stripePayment.findUnique({
    where: { bookingId },
    include: {
      StripeTransaction: { orderBy: { createdAt: "desc" } },
      StripeRefund: { orderBy: { createdAt: "desc" } },
    },
  });
}

/**
 * Retrieves a StripePayment record by checkout session ID.
 */
export async function getPaymentByCheckoutSessionId(sessionId: string) {
  return prisma.stripePayment.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: { Booking: { select: { bookingReference: true, customerEmail: true, totalDueOnline: true } } },
  });
}

export type VerifiedPaymentData = {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  vehicleName: string;
  vehicleType: string;
  pickupDateTime: Date;
  returnDateTime: Date;
  billableDays: number;
  pickupOption: string;
  pickupAddress: string | null;
  dropoffOption: string;
  dropoffAddress: string | null;
  amountEur: number;
  depositAmountEur: number;
  depositMethod: string;
  paymentStatus: "paid" | "pending" | "unpaid";
  stripeReceiptUrl: string | null;
  paidAt: Date | null;
};

/**
 * Verifies a checkout session and returns rich booking info for the success page.
 * Checks Stripe directly so it works even before the webhook arrives.
 */
export async function verifyCheckoutSession(sessionId: string): Promise<
  | { ok: true; data: VerifiedPaymentData }
  | { ok: false; error: string }
> {
  try {
    const [session, payment] = await Promise.all([
      stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent.latest_charge"],
      }),
      prisma.stripePayment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        include: {
          Booking: {
            select: {
              bookingReference: true,
              customerFullName: true,
              customerEmail: true,
              vehicleNameSnapshot: true,
              vehicleTypeSnapshot: true,
              pickupDateTime: true,
              returnDateTime: true,
              billableDays: true,
              pickupOption: true,
              pickupAddress: true,
              dropoffOption: true,
              dropoffAddress: true,
              depositAmount: true,
              depositMethod: true,
              paymentStatus: true,
            },
          },
        },
      }),
    ]);

    if (!payment?.Booking) {
      return { ok: false, error: "Payment record not found" };
    }

    const booking = payment.Booking;

    // Determine payment status from Stripe (authoritative) then fall back to DB
    const stripePaymentStatus = session.payment_status;
    const isPaid = stripePaymentStatus === "paid" || payment.stripeStatus === "SUCCEEDED";

    // If Stripe already collected payment but the webhook never arrived, persist
    // PAID status and send the confirmation email from this verifier.
    if (stripePaymentStatus === "paid") {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent && typeof session.payment_intent === "object"
            ? session.payment_intent.id
            : null;
      try {
        await syncPaidBookingAndSendConfirmation({
          bookingId: payment.bookingId,
          paymentIntentId,
          checkoutSessionId: sessionId,
        });
      } catch (syncError) {
        console.error("[payment-service] Failed to persist paid booking or send confirmation", {
          sessionId,
          bookingId: payment.bookingId,
          error: syncError,
        });
      }
    }

    // Extract receipt URL from the charge object if available
    let receiptUrl: string | null = null;
    if (session.payment_intent && typeof session.payment_intent === "object") {
      const intent = session.payment_intent as import("stripe").Stripe.PaymentIntent & {
        latest_charge?: import("stripe").Stripe.Charge;
      };
      receiptUrl = intent.latest_charge?.receipt_url ?? null;
    }

    // Estimate paid-at time from the payment intent's created timestamp
    let paidAt: Date | null = null;
    if (isPaid && session.payment_intent && typeof session.payment_intent === "object") {
      const intent = session.payment_intent as import("stripe").Stripe.PaymentIntent;
      paidAt = new Date((intent.created ?? 0) * 1000);
    }

    return {
      ok: true,
      data: {
        bookingReference: booking.bookingReference,
        customerName: booking.customerFullName,
        customerEmail: booking.customerEmail,
        vehicleName: booking.vehicleNameSnapshot ?? "Vehicle",
        vehicleType: booking.vehicleTypeSnapshot ?? "Vehicle",
        pickupDateTime: booking.pickupDateTime,
        returnDateTime: booking.returnDateTime,
        billableDays: booking.billableDays,
        pickupOption: booking.pickupOption,
        pickupAddress: booking.pickupAddress,
        dropoffOption: booking.dropoffOption,
        dropoffAddress: booking.dropoffAddress,
        amountEur: payment.amountCents / 100,
        depositAmountEur: booking.depositAmount.toNumber(),
        depositMethod: booking.depositMethod,
        paymentStatus: isPaid ? "paid" : stripePaymentStatus === "unpaid" ? "unpaid" : "pending",
        stripeReceiptUrl: receiptUrl,
        paidAt,
      },
    };
  } catch (error) {
    console.error("[payment-service] Failed to verify checkout session", { sessionId, error });
    return { ok: false, error: "Could not verify payment status" };
  }
}

/** Formats a date string for display in the Stripe line item */
export function formatDateForStripe(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}
