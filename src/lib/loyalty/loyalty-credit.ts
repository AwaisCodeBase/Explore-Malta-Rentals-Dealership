import { Prisma } from "@/generated/prisma/index";

import { isValidCustomerEmail } from "@/lib/reviews/customer-email";
import { roundPricingAmount } from "@/lib/pricing/duration-pricing";

/** Fixed next-rental credit. Decimal euros, matching the booking money columns. */
export const LOYALTY_CREDIT_AMOUNT_EUR = 5;
export const LOYALTY_CREDIT_CURRENCY = "EUR";

/**
 * Customer identity for loyalty is the booking email.
 * Trim and lowercase only. Provider-specific rewrites, such as removing Gmail dots, are not used.
 * Phone and display name are not identity.
 */
export function normalizeLoyaltyCustomerEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function loyaltyCustomerEmailOrNull(value: string | null | undefined): string | null {
  const email = normalizeLoyaltyCustomerEmail(value);
  return isValidCustomerEmail(email) ? email : null;
}

/**
 * A credit applies only when booking charges, excluding the security deposit, are at least €5.
 * The credit is consumed in full. There is no partial remaining balance.
 */
export function loyaltyDiscountForCharges(chargesEur: number): number {
  if (!Number.isFinite(chargesEur)) return 0;
  const charges = roundPricingAmount(chargesEur);
  if (charges < LOYALTY_CREDIT_AMOUNT_EUR) return 0;
  return LOYALTY_CREDIT_AMOUNT_EUR;
}

export function chargesAfterLoyalty(chargesEur: number, loyaltyCreditAmount: number): number {
  const loyalty = roundPricingAmount(Math.max(0, loyaltyCreditAmount));
  return roundPricingAmount(Math.max(0, chargesEur - loyalty));
}

export type LoyaltyCreditEmailSection = {
  html: string;
  text: string;
};

/**
 * Post-rental copy. The credit is for completing the rental.
 * It is not a reward for leaving a Google review.
 */
export function buildLoyaltyCreditEmailSection(): LoyaltyCreditEmailSection {
  const text = [
    "€5 off your next rental",
    "As a thank-you for renting with Explore Malta Rentals, you have received €5 credit toward your next booking.",
    "This credit is yours because you completed this rental. It does not depend on leaving a Google review.",
    "Use the same email address on your next booking and the €5 will be applied once.",
  ].join("\n");

  const html = `<p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#111827;">€5 off your next rental</p>
<p style="margin:0 0 8px 0;">As a thank-you for renting with Explore Malta Rentals, you have received <strong>€5 credit</strong> toward your next booking.</p>
<p style="margin:0;">This credit is yours because you completed this rental. It does not depend on leaving a Google review. Use the same email address on your next booking and the €5 will be applied once.</p>`;

  return { html, text };
}

type LoyaltyDb = Prisma.TransactionClient;

export type IssueLoyaltyCreditResult = {
  created: boolean;
  skippedReason: "invalid_email" | null;
};

/**
 * Issues one €5 credit for a booking that has just been marked returned.
 * Safe to call again: the source booking unique key allows only one credit.
 */
export async function issueLoyaltyCreditForReturnedBooking(
  db: Pick<LoyaltyDb, "customerLoyaltyCredit">,
  booking: { id: string; customerEmail: string },
  now = new Date(),
): Promise<IssueLoyaltyCreditResult> {
  const existing = await db.customerLoyaltyCredit.findUnique({
    where: { sourceBookingId: booking.id },
    select: { id: true },
  });
  if (existing) {
    return { created: false, skippedReason: null };
  }

  const email = loyaltyCustomerEmailOrNull(booking.customerEmail);
  if (!email) {
    return { created: false, skippedReason: "invalid_email" };
  }

  await db.customerLoyaltyCredit.create({
    data: {
      sourceBookingId: booking.id,
      customerEmailNormalized: email,
      amount: LOYALTY_CREDIT_AMOUNT_EUR,
      currency: LOYALTY_CREDIT_CURRENCY,
      status: "AVAILABLE",
      issuedAt: now,
    },
  });

  return { created: true, skippedReason: null };
}

export type LoyaltyRedemptionResult =
  | { applied: false; reason: "ineligible" | "none_available" | "already_applied" }
  | { applied: true; creditId: string; amountEur: number };

/**
 * Claims the oldest available credit for this email and links it to the new booking.
 * The row lock makes a concurrent checkout wait, then see the credit as already redeemed.
 * Call this only inside the booking-creation transaction, after the booking row exists.
 */
export async function redeemOldestAvailableLoyaltyCredit(
  db: LoyaltyDb,
  input: {
    customerEmail: string;
    bookingId: string;
    eligibleChargesEur: number;
    now?: Date;
  },
): Promise<LoyaltyRedemptionResult> {
  const discount = loyaltyDiscountForCharges(input.eligibleChargesEur);
  if (discount <= 0) {
    return { applied: false, reason: "ineligible" };
  }

  const already = await db.customerLoyaltyCredit.findUnique({
    where: { redeemedBookingId: input.bookingId },
    select: { id: true, amount: true },
  });
  if (already) {
    return { applied: false, reason: "already_applied" };
  }

  const email = loyaltyCustomerEmailOrNull(input.customerEmail);
  if (!email) {
    return { applied: false, reason: "none_available" };
  }

  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "CustomerLoyaltyCredit"
    WHERE "customerEmailNormalized" = ${email}
      AND "status" = 'AVAILABLE'::"LoyaltyCreditStatus"
      AND "sourceBookingId" <> ${input.bookingId}
    ORDER BY "issuedAt" ASC, "id" ASC
    LIMIT 1
    FOR UPDATE
  `;

  const creditId = rows[0]?.id;
  if (!creditId) {
    return { applied: false, reason: "none_available" };
  }

  const claimed = await db.customerLoyaltyCredit.updateMany({
    where: { id: creditId, status: "AVAILABLE" },
    data: {
      status: "REDEEMED",
      redeemedAt: input.now ?? new Date(),
      redeemedBookingId: input.bookingId,
    },
  });

  if (claimed.count !== 1) {
    return { applied: false, reason: "none_available" };
  }

  return { applied: true, creditId, amountEur: discount };
}

/**
 * Returns a credit that was redeemed on a booking whose payment never completed.
 * A later manual cancellation of a confirmed booking does not call this.
 */
export async function restoreLoyaltyCreditForUnpaidBooking(
  db: Pick<LoyaltyDb, "customerLoyaltyCredit">,
  bookingId: string,
): Promise<{ restored: boolean }> {
  const restored = await db.customerLoyaltyCredit.updateMany({
    where: { redeemedBookingId: bookingId, status: "REDEEMED" },
    data: {
      status: "AVAILABLE",
      redeemedAt: null,
      redeemedBookingId: null,
    },
  });
  return { restored: restored.count > 0 };
}

export type AvailableLoyaltyCreditOffer = {
  available: boolean;
  amountEur: number;
};

/** Minimum public answer: whether one €5 credit can be applied. No customer details. */
export async function findAvailableLoyaltyCreditOffer(
  db: Pick<LoyaltyDb, "customerLoyaltyCredit">,
  email: string,
): Promise<AvailableLoyaltyCreditOffer> {
  const normalized = loyaltyCustomerEmailOrNull(email);
  if (!normalized) {
    return { available: false, amountEur: 0 };
  }

  const credit = await db.customerLoyaltyCredit.findFirst({
    where: { customerEmailNormalized: normalized, status: "AVAILABLE" },
    select: { id: true },
  });

  return credit
    ? { available: true, amountEur: LOYALTY_CREDIT_AMOUNT_EUR }
    : { available: false, amountEur: 0 };
}
