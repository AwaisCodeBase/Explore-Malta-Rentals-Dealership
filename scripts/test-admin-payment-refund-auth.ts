/**
 * Authorization tests for POST /api/admin/payments/[id]/refund.
 *
 * Does not call Stripe or touch the database. Mocks session + refund deps.
 *
 *   npm run test:admin-payment-refund-auth
 */

import assert from "node:assert/strict";

import { AdminForbiddenError, AdminUnauthorizedError } from "../src/lib/admin-auth/errors";
import { requireAdminApiRole } from "../src/lib/admin-auth/require-admin-api-role";
import type { AdminSessionRecord } from "../src/lib/admin-auth/types";
import { handleAdminPaymentRefund } from "../src/app/api/admin/payments/[id]/refund/handle-admin-payment-refund";
import type { CreateRefundResult } from "../src/lib/stripe/types";

function session(role: "ADMIN" | "STAFF", id = "user-1"): AdminSessionRecord {
  return {
    id,
    name: "Test User",
    email: `${role.toLowerCase()}@test.local`,
    role,
    sessionId: "sess-1",
    expiresAt: new Date(Date.now() + 60_000),
  };
}

async function testRequireAdminApiRole() {
  await assert.rejects(
    () => requireAdminApiRole(["ADMIN"], async () => null),
    (error: unknown) => error instanceof AdminUnauthorizedError && error.status === 401,
  );

  await assert.rejects(
    () => requireAdminApiRole(["ADMIN"], async () => session("STAFF")),
    (error: unknown) => error instanceof AdminForbiddenError && error.status === 403,
  );

  const admin = await requireAdminApiRole(["ADMIN"], async () => session("ADMIN", "admin-9"));
  assert.equal(admin.id, "admin-9");
  assert.equal(admin.role, "ADMIN");
}

async function testRefundRouteAuthorization() {
  let refundCalls = 0;
  let paymentLookups = 0;

  const createRefund = async (): Promise<CreateRefundResult> => {
    refundCalls += 1;
    return { ok: true, refundId: "re_test", amountEur: 10 };
  };

  const findPaymentBookingId = async (): Promise<string | null> => {
    paymentLookups += 1;
    return "booking-1";
  };

  const request = () =>
    new Request("http://localhost/api/admin/payments/pay_1/refund", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "requested_by_customer" }),
    });

  // Unauthenticated → 401; refund must not run
  refundCalls = 0;
  paymentLookups = 0;
  const unauth = await handleAdminPaymentRefund(request(), "pay_1", {
    authorize: async () => {
      throw new AdminUnauthorizedError();
    },
    findPaymentBookingId,
    createRefund,
  });
  assert.equal(unauth.status, 401);
  assert.equal(refundCalls, 0);
  assert.equal(paymentLookups, 0);
  assert.deepEqual(await unauth.json(), { success: false, message: "Unauthorized" });

  // STAFF → 403; refund must not run
  refundCalls = 0;
  paymentLookups = 0;
  const staff = await handleAdminPaymentRefund(request(), "pay_1", {
    authorize: async () => {
      throw new AdminForbiddenError();
    },
    findPaymentBookingId,
    createRefund,
  });
  assert.equal(staff.status, 403);
  assert.equal(refundCalls, 0);
  assert.equal(paymentLookups, 0);
  assert.deepEqual(await staff.json(), { success: false, message: "Forbidden" });

  // ADMIN → proceeds; refund called once; response contract unchanged
  refundCalls = 0;
  paymentLookups = 0;
  const admin = await handleAdminPaymentRefund(request(), "pay_1", {
    authorize: async () => session("ADMIN", "admin-42"),
    findPaymentBookingId,
    createRefund,
  });
  assert.equal(admin.status, 200);
  assert.equal(refundCalls, 1);
  assert.equal(paymentLookups, 1);
  assert.deepEqual(await admin.json(), {
    success: true,
    refundId: "re_test",
    amountEur: 10,
    message: "Refund of €10.00 initiated successfully",
  });
}

async function testAdminAuthorizeWiringMatchesRoleHelper() {
  // Mirrors route.ts: authorize: () => requireAdminApiRole(["ADMIN"], ...)
  await assert.rejects(
    () => requireAdminApiRole(["ADMIN"], async () => session("STAFF")),
    AdminForbiddenError,
  );

  const allowed = await requireAdminApiRole(["ADMIN"], async () => session("ADMIN"));
  assert.equal(allowed.role, "ADMIN");
}

async function run() {
  await testRequireAdminApiRole();
  await testRefundRouteAuthorization();
  await testAdminAuthorizeWiringMatchesRoleHelper();
  console.log("Admin payment refund authorization checks passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
