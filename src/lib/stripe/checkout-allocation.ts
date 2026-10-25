import { SECURITY_DEPOSIT_EUR } from "@/features/booking/lib/booking-schema";

export const SECURITY_DEPOSIT_CENTS = Math.round(SECURITY_DEPOSIT_EUR * 100);

export type CheckoutAllocation = {
  amountCents: number;
  rentalAmountCents: number;
  depositAmountCents: number;
};

export type CheckoutAllocationResult =
  | ({ ok: true } & CheckoutAllocation)
  | { ok: false; error: string };

export type CheckoutAllocationInput = {
  /** Combined amount charged online (booking.totalDueOnline). */
  totalDueOnlineEur: number;
  /** Rental/booking charges only (booking.subtotal) — not inferred from the total. */
  rentalSubtotalEur: number;
  /** Stored deposit amount (booking.depositAmount). */
  depositAmountEur: number;
  /** Stored deposit method (booking.depositMethod). */
  depositMethod: string;
};

function toCents(amountEur: number): number {
  return Math.round(amountEur * 100);
}

/**
 * Builds integer-cent rental/deposit allocations for combined Stripe Checkout.
 * Rejects inconsistent booking totals rather than silently adjusting them.
 */
export function allocateCombinedCheckoutAmounts(
  input: CheckoutAllocationInput,
): CheckoutAllocationResult {
  const { totalDueOnlineEur, rentalSubtotalEur, depositAmountEur, depositMethod } = input;

  if (depositMethod !== "ONLINE") {
    return {
      ok: false,
      error: "Online checkout requires an ONLINE security deposit allocation",
    };
  }

  if (
    !Number.isFinite(totalDueOnlineEur) ||
    !Number.isFinite(rentalSubtotalEur) ||
    !Number.isFinite(depositAmountEur)
  ) {
    return { ok: false, error: "Payment amounts must be finite numbers" };
  }

  if (totalDueOnlineEur <= 0 || rentalSubtotalEur <= 0 || depositAmountEur <= 0) {
    return { ok: false, error: "Rental, deposit, and online total must be greater than zero" };
  }

  const amountCents = toCents(totalDueOnlineEur);
  const rentalAmountCents = toCents(rentalSubtotalEur);
  const depositAmountCents = toCents(depositAmountEur);

  if (depositAmountCents !== SECURITY_DEPOSIT_CENTS) {
    return {
      ok: false,
      error: `Security deposit must be exactly €${SECURITY_DEPOSIT_EUR.toFixed(2)}`,
    };
  }

  if (rentalAmountCents <= 0 || depositAmountCents <= 0 || amountCents <= 0) {
    return { ok: false, error: "Allocation amounts must be positive integer cents" };
  }

  if (rentalAmountCents + depositAmountCents !== amountCents) {
    return {
      ok: false,
      error:
        "Online total must equal rental subtotal plus security deposit (cent-accurate)",
    };
  }

  return {
    ok: true,
    amountCents,
    rentalAmountCents,
    depositAmountCents,
  };
}

export type CheckoutLineItemSpec = {
  name: string;
  description: string;
  unitAmountCents: number;
  quantity: number;
  metadata?: Record<string, string>;
};

/**
 * Builds the two Stripe Checkout line items for a validated allocation.
 * Callers must ensure allocation.ok === true.
 */
export function buildCombinedCheckoutLineItems(input: {
  allocation: CheckoutAllocation;
  vehicleName: string;
  bookingId: string;
  bookingReference: string;
  pickupDate: string;
  returnDate: string;
}): CheckoutLineItemSpec[] {
  const { allocation, vehicleName, bookingId, bookingReference, pickupDate, returnDate } = input;

  return [
    {
      name: `${vehicleName} Rental`,
      description: `Booking ${bookingReference} · ${pickupDate} → ${returnDate}`,
      unitAmountCents: allocation.rentalAmountCents,
      quantity: 1,
      metadata: {
        bookingId,
        bookingReference,
        allocation: "rental",
      },
    },
    {
      name: "Security Deposit",
      description: `Refundable security deposit for booking ${bookingReference}`,
      unitAmountCents: allocation.depositAmountCents,
      quantity: 1,
      metadata: {
        bookingId,
        bookingReference,
        allocation: "security_deposit",
      },
    },
  ];
}

export function lineItemsTotalCents(items: CheckoutLineItemSpec[]): number {
  return items.reduce((sum, item) => sum + item.unitAmountCents * item.quantity, 0);
}
