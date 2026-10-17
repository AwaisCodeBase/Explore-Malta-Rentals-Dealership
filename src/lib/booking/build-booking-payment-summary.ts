export type BookingPaymentSummaryDepositMethod = "ONLINE" | "IN_PERSON" | "online" | "in_person";

export type BookingPaymentSummaryInput = {
  subtotal: number;
  depositAmount: number;
  depositMethod: BookingPaymentSummaryDepositMethod;
  totalDueOnline: number;
  totalDueLater: number;
};

export type BookingPaymentSummary = {
  bookingChargesTotal: number;
  securityDeposit: number;
  securityDepositDueAtPickup: boolean;
  /** Null until online checkout is implemented. */
  amountPayableOnline: number | null;
  amountDueAtPickupLater: number;
  totalCustomerLiability: number;
  onlinePaymentEnabled: boolean;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function normalizeDepositMethod(method: BookingPaymentSummaryDepositMethod): "ONLINE" | "IN_PERSON" {
  return method === "ONLINE" || method === "online" ? "ONLINE" : "IN_PERSON";
}

/** Display-only payment summary from stored pricing fields. Does not recalculate pricing rules. */
export function buildBookingPaymentSummary(
  input: BookingPaymentSummaryInput,
): BookingPaymentSummary {
  const bookingChargesTotal = input.subtotal;
  const securityDeposit = input.depositAmount;
  const totalCustomerLiability = roundMoney(bookingChargesTotal + securityDeposit);
  const depositMethod = normalizeDepositMethod(input.depositMethod);
  const securityDepositDueAtPickup = depositMethod === "IN_PERSON";

  const amountPayableOnline = depositMethod === "ONLINE"
    ? roundMoney(bookingChargesTotal + securityDeposit)
    : bookingChargesTotal;

  const amountDueAtPickupLater = depositMethod === "IN_PERSON"
    ? securityDeposit
    : 0;

  return {
    bookingChargesTotal,
    securityDeposit,
    securityDepositDueAtPickup,
    amountPayableOnline,
    amountDueAtPickupLater,
    totalCustomerLiability,
    onlinePaymentEnabled: true,
  };
}
