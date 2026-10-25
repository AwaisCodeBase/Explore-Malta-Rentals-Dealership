/**
 * Success-path confirmation guards (fake DB / no Stripe).
 *
 *   npm run test:confirm-paid-booking
 */

import assert from "node:assert/strict";

// Satisfy prisma module load from confirm-paid-booking; tests never query the DB.
process.env.DATABASE_URL ??= "postgresql://localhost:5432/explore_malta_test_unused";

import {
  PAID_LINEAGE_STRIPE_PAYMENT_STATUSES,
  UNPAID_STRIPE_PAYMENT_STATUSES,
} from "../src/lib/stripe/payment-status-rules";

type SyncPaidBookingAndSendConfirmationDeps =
  import("../src/lib/stripe/confirm-paid-booking").SyncPaidBookingAndSendConfirmationDeps;

type BookingRow = {
  id: string;
  status: string;
  paymentStatus: string;
};

type PaymentRow = {
  bookingId: string;
  stripeStatus: string;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
};

async function loadConfirmModule() {
  return import("../src/lib/stripe/confirm-paid-booking");
}

function createBookingDb(booking: BookingRow) {
  const history: Array<{ oldStatus: string; newStatus: string; note: string }> = [];
  return {
    history,
    db: {
      booking: {
        updateMany: async (args: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          const where = args.where;
          if (where.id !== booking.id) return { count: 0 };

          if (args.data.paymentStatus === "PAID" && !args.data.status) {
            const notIn = (where.paymentStatus as { notIn?: string[] } | undefined)?.notIn;
            if (notIn && notIn.includes(booking.paymentStatus)) {
              return { count: 0 };
            }
            booking.paymentStatus = "PAID";
            return { count: 1 };
          }

          if (args.data.status === "CONFIRMED") {
            if (where.status !== "PENDING_PAYMENT" || booking.status !== "PENDING_PAYMENT") {
              return { count: 0 };
            }
            const notRefunded = (where.paymentStatus as { not?: string } | undefined)?.not;
            if (notRefunded && booking.paymentStatus === notRefunded) {
              return { count: 0 };
            }
            booking.status = "CONFIRMED";
            booking.paymentStatus = "PAID";
            return { count: 1 };
          }

          return { count: 0 };
        },
      },
      bookingStatusHistory: {
        create: async (args: {
          data: { oldStatus: string; newStatus: string; note: string };
        }) => {
          history.push({
            oldStatus: args.data.oldStatus,
            newStatus: args.data.newStatus,
            note: args.data.note,
          });
        },
      },
    },
  };
}

function createSyncDeps(options: {
  payment: PaymentRow;
  booking: BookingRow;
}): {
  deps: SyncPaidBookingAndSendConfirmationDeps;
  payment: PaymentRow;
  booking: BookingRow;
  deliverCalls: number;
  paymentUpdateWheres: Array<{ stripeStatus: { in: string[] } }>;
} {
  const payment = options.payment;
  const booking = options.booking;
  const bookingDb = createBookingDb(booking);
  let deliverCalls = 0;
  const paymentUpdateWheres: Array<{ stripeStatus: { in: string[] } }> = [];

  const deps: SyncPaidBookingAndSendConfirmationDeps = {
    withTransaction: async (fn) =>
      fn({
        ...bookingDb.db,
        stripePayment: {
          updateMany: async (args) => {
            paymentUpdateWheres.push(args.where);
            assert.equal(args.where.bookingId, payment.bookingId);
            assert.equal(args.data.stripeStatus, "SUCCEEDED");
            if (!(args.where.stripeStatus.in as string[]).includes(payment.stripeStatus)) {
              return { count: 0 };
            }
            payment.stripeStatus = "SUCCEEDED";
            if (args.data.stripePaymentIntentId) {
              payment.stripePaymentIntentId = args.data.stripePaymentIntentId;
            }
            if (args.data.stripeCheckoutSessionId) {
              payment.stripeCheckoutSessionId = args.data.stripeCheckoutSessionId;
            }
            return { count: 1 };
          },
          findUnique: async () => ({ stripeStatus: payment.stripeStatus }),
        },
      }),
    getStripePaymentStatus: async () => payment.stripeStatus,
    deliverConfirmation: async () => {
      deliverCalls += 1;
      return { success: true, deliveryMode: "development_console" };
    },
  };

  return {
    deps,
    payment,
    booking,
    get deliverCalls() {
      return deliverCalls;
    },
    paymentUpdateWheres,
  };
}

async function testFirstTimeSuccessUpdatesPaymentAndBooking() {
  const {
    syncPaidBookingAndSendConfirmation,
  } = await loadConfirmModule();
  const mock = createSyncDeps({
    payment: {
      bookingId: "booking_1",
      stripeStatus: "PENDING",
      stripePaymentIntentId: null,
      stripeCheckoutSessionId: null,
    },
    booking: { id: "booking_1", status: "PENDING_PAYMENT", paymentStatus: "PENDING" },
  });

  const result = await syncPaidBookingAndSendConfirmation(
    {
      bookingId: "booking_1",
      paymentIntentId: "pi_1",
      checkoutSessionId: "cs_1",
    },
    mock.deps,
  );

  assert.equal(result.paymentUpdated, true);
  assert.equal(mock.payment.stripeStatus, "SUCCEEDED");
  assert.equal(mock.payment.stripePaymentIntentId, "pi_1");
  assert.equal(mock.booking.status, "CONFIRMED");
  assert.equal(mock.booking.paymentStatus, "PAID");
  assert.equal(mock.deliverCalls, 1);
  assert.deepEqual(mock.paymentUpdateWheres[0]?.stripeStatus.in, [
    ...UNPAID_STRIPE_PAYMENT_STATUSES,
  ]);
}

async function testSuccessCannotOverwriteLineageStatuses() {
  const { syncPaidBookingAndSendConfirmation } = await loadConfirmModule();
  for (const status of ["PARTIALLY_REFUNDED", "REFUNDED", "DISPUTED"] as const) {
    const mock = createSyncDeps({
      payment: {
        bookingId: "booking_1",
        stripeStatus: status,
        stripePaymentIntentId: "pi_1",
        stripeCheckoutSessionId: "cs_1",
      },
      booking: { id: "booking_1", status: "CONFIRMED", paymentStatus: "PAID" },
    });

    const result = await syncPaidBookingAndSendConfirmation(
      { bookingId: "booking_1", paymentIntentId: "pi_late" },
      mock.deps,
    );

    assert.equal(result.paymentUpdated, false, status);
    assert.equal(mock.payment.stripeStatus, status, status);
    assert.equal(mock.payment.stripePaymentIntentId, "pi_1", status);
  }
}

async function testRefundedBookingCannotRegressToPaid() {
  const {
    markBookingPaidAndConfirmIfPending,
    BOOKING_PAYMENT_STATUSES_BLOCKING_PAID,
  } = await loadConfirmModule();
  const booking = { id: "booking_1", status: "CONFIRMED", paymentStatus: "REFUNDED" };
  const bookingDb = createBookingDb(booking);

  const result = await markBookingPaidAndConfirmIfPending(
    bookingDb.db as never,
    "booking_1",
    "[test] should not regress",
  );

  assert.equal(result.paymentStatusUpdated, false);
  assert.equal(result.confirmedFromPending, false);
  assert.equal(booking.paymentStatus, "REFUNDED");
  assert.equal(booking.status, "CONFIRMED");
  assert.equal(bookingDb.history.length, 0);
  assert.deepEqual([...BOOKING_PAYMENT_STATUSES_BLOCKING_PAID], ["PAID", "REFUNDED"]);
}

async function testRepeatedVerificationOfRefundedPaymentIsNoOp() {
  const {
    syncPaidBookingAndSendConfirmation,
    shouldSyncPaidBookingForStripeStatus,
  } = await loadConfirmModule();
  const mock = createSyncDeps({
    payment: {
      bookingId: "booking_1",
      stripeStatus: "REFUNDED",
      stripePaymentIntentId: "pi_1",
      stripeCheckoutSessionId: "cs_1",
    },
    booking: { id: "booking_1", status: "CONFIRMED", paymentStatus: "REFUNDED" },
  });

  const first = await syncPaidBookingAndSendConfirmation({ bookingId: "booking_1" }, mock.deps);
  const second = await syncPaidBookingAndSendConfirmation({ bookingId: "booking_1" }, mock.deps);

  assert.equal(first.paymentUpdated, false);
  assert.equal(second.paymentUpdated, false);
  assert.equal(mock.payment.stripeStatus, "REFUNDED");
  assert.equal(mock.booking.paymentStatus, "REFUNDED");
  assert.equal(mock.deliverCalls, 0);
  assert.equal(first.confirmation.deliveryMode, "skipped_ineligible_payment");
  assert.equal(shouldSyncPaidBookingForStripeStatus("REFUNDED"), false);
  assert.equal(shouldSyncPaidBookingForStripeStatus("DISPUTED"), false);
}

async function testLegitimateSuccessReachesConfirmation() {
  const { syncPaidBookingAndSendConfirmation } = await loadConfirmModule();
  const mock = createSyncDeps({
    payment: {
      bookingId: "booking_1",
      stripeStatus: "PROCESSING",
      stripePaymentIntentId: null,
      stripeCheckoutSessionId: "cs_1",
    },
    booking: { id: "booking_1", status: "PENDING_PAYMENT", paymentStatus: "PENDING" },
  });

  const result = await syncPaidBookingAndSendConfirmation({ bookingId: "booking_1" }, mock.deps);
  assert.equal(result.paymentUpdated, true);
  assert.equal(result.stripeStatus, "SUCCEEDED");
  assert.equal(mock.deliverCalls, 1);
  assert.equal(result.confirmation.success, true);
  if (result.confirmation.success) {
    assert.equal(result.confirmation.deliveryMode, "development_console");
  }
}

async function testPartialRefundStillEligibleForConfirmation() {
  const {
    syncPaidBookingAndSendConfirmation,
    shouldSyncPaidBookingForStripeStatus,
  } = await loadConfirmModule();
  const mock = createSyncDeps({
    payment: {
      bookingId: "booking_1",
      stripeStatus: "PARTIALLY_REFUNDED",
      stripePaymentIntentId: "pi_1",
      stripeCheckoutSessionId: "cs_1",
    },
    booking: { id: "booking_1", status: "CONFIRMED", paymentStatus: "PAID" },
  });

  const result = await syncPaidBookingAndSendConfirmation({ bookingId: "booking_1" }, mock.deps);
  assert.equal(result.paymentUpdated, false);
  assert.equal(mock.payment.stripeStatus, "PARTIALLY_REFUNDED");
  assert.equal(mock.deliverCalls, 1);
  assert.equal(shouldSyncPaidBookingForStripeStatus("PARTIALLY_REFUNDED"), true);
  assert.equal(shouldSyncPaidBookingForStripeStatus("SUCCEEDED"), true);
}

async function testRefundedAndDisputedSkipConfirmationDelivery() {
  const { deliverBookingConfirmationIfStripePaymentAllows } = await loadConfirmModule();
  for (const status of ["REFUNDED", "DISPUTED"] as const) {
    let deliverCalls = 0;
    const result = await deliverBookingConfirmationIfStripePaymentAllows("booking_1", {
      getStripePaymentStatus: async () => status,
      deliverConfirmation: async () => {
        deliverCalls += 1;
        return { success: true, deliveryMode: "resend" };
      },
    });
    assert.equal(deliverCalls, 0, status);
    assert.deepEqual(result, { success: true, deliveryMode: "skipped_ineligible_payment" });
  }

  let unpaidDeliver = 0;
  const unpaid = await deliverBookingConfirmationIfStripePaymentAllows("booking_1", {
    getStripePaymentStatus: async () => "PENDING",
    deliverConfirmation: async () => {
      unpaidDeliver += 1;
      return { success: true, deliveryMode: "resend" };
    },
  });
  assert.equal(unpaidDeliver, 0);
  assert.equal(unpaid.deliveryMode, "skipped_ineligible_payment");
}

async function testSentEmailIdempotencyPreservedThroughGate() {
  const { deliverBookingConfirmationIfStripePaymentAllows } = await loadConfirmModule();
  let deliverCalls = 0;
  const result = await deliverBookingConfirmationIfStripePaymentAllows("booking_1", {
    getStripePaymentStatus: async () => "SUCCEEDED",
    deliverConfirmation: async () => {
      deliverCalls += 1;
      return { success: true, deliveryMode: "already_sent" };
    },
  });
  assert.equal(deliverCalls, 1);
  assert.deepEqual(result, { success: true, deliveryMode: "already_sent" });
}

async function testNoOpDoesNotClaimPaymentWrite() {
  const { syncPaidBookingAndSendConfirmation } = await loadConfirmModule();
  const mock = createSyncDeps({
    payment: {
      bookingId: "booking_1",
      stripeStatus: "DISPUTED",
      stripePaymentIntentId: "pi_1",
      stripeCheckoutSessionId: "cs_1",
    },
    booking: { id: "booking_1", status: "CONFIRMED", paymentStatus: "PAID" },
  });

  const result = await syncPaidBookingAndSendConfirmation({ bookingId: "booking_1" }, mock.deps);
  assert.equal(result.paymentUpdated, false);
  assert.equal(result.stripeStatus, "DISPUTED");
  assert.equal(result.confirmation.deliveryMode, "skipped_ineligible_payment");
}

async function testUnpaidAllowlistMatchesSharedRules() {
  const { unpaidStripeStatusesAllowingSucceededWrite } = await loadConfirmModule();
  assert.deepEqual(unpaidStripeStatusesAllowingSucceededWrite(), [...UNPAID_STRIPE_PAYMENT_STATUSES]);
  for (const status of PAID_LINEAGE_STRIPE_PAYMENT_STATUSES) {
    assert.equal(
      unpaidStripeStatusesAllowingSucceededWrite().includes(status as never),
      false,
      status,
    );
  }
}

async function testPendingPaymentRefundedDoesNotPromoteToPaidConfirmed() {
  const { markBookingPaidAndConfirmIfPending } = await loadConfirmModule();
  const booking = {
    id: "booking_1",
    status: "PENDING_PAYMENT",
    paymentStatus: "REFUNDED",
  };
  const bookingDb = createBookingDb(booking);
  const result = await markBookingPaidAndConfirmIfPending(
    bookingDb.db as never,
    "booking_1",
    "note",
  );
  assert.equal(result.confirmedFromPending, false);
  assert.equal(booking.status, "PENDING_PAYMENT");
  assert.equal(booking.paymentStatus, "REFUNDED");
}

async function main() {
  await testFirstTimeSuccessUpdatesPaymentAndBooking();
  await testSuccessCannotOverwriteLineageStatuses();
  await testRefundedBookingCannotRegressToPaid();
  await testRepeatedVerificationOfRefundedPaymentIsNoOp();
  await testLegitimateSuccessReachesConfirmation();
  await testPartialRefundStillEligibleForConfirmation();
  await testRefundedAndDisputedSkipConfirmationDelivery();
  await testSentEmailIdempotencyPreservedThroughGate();
  await testNoOpDoesNotClaimPaymentWrite();
  await testUnpaidAllowlistMatchesSharedRules();
  await testPendingPaymentRefundedDoesNotPromoteToPaidConfirmed();
  console.log("confirm-paid-booking tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
