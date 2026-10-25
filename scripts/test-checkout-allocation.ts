/**
 * Pure allocation + line-item integrity for combined Stripe checkout.
 * No database and no Stripe network.
 *
 *   npm run test:checkout-allocation
 */

import assert from "node:assert/strict";

import { SECURITY_DEPOSIT_EUR } from "../src/features/booking/lib/booking-schema";
import {
  allocateCombinedCheckoutAmounts,
  buildCombinedCheckoutLineItems,
  lineItemsTotalCents,
  SECURITY_DEPOSIT_CENTS,
} from "../src/lib/stripe/checkout-allocation";

function testValidSplit() {
  const rental = 180.5;
  const deposit = SECURITY_DEPOSIT_EUR;
  const total = rental + deposit;
  const result = allocateCombinedCheckoutAmounts({
    totalDueOnlineEur: total,
    rentalSubtotalEur: rental,
    depositAmountEur: deposit,
    depositMethod: "ONLINE",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.depositAmountCents, SECURITY_DEPOSIT_CENTS);
  assert.equal(result.rentalAmountCents, Math.round(rental * 100));
  assert.equal(result.amountCents, result.rentalAmountCents + result.depositAmountCents);
}

function testRejectsInPerson() {
  const result = allocateCombinedCheckoutAmounts({
    totalDueOnlineEur: 400,
    rentalSubtotalEur: 150,
    depositAmountEur: 250,
    depositMethod: "IN_PERSON",
  });
  assert.equal(result.ok, false);
}

function testRejectsWrongDeposit() {
  const result = allocateCombinedCheckoutAmounts({
    totalDueOnlineEur: 350,
    rentalSubtotalEur: 150,
    depositAmountEur: 200,
    depositMethod: "ONLINE",
  });
  assert.equal(result.ok, false);
}

function testRejectsMismatchedTotal() {
  const result = allocateCombinedCheckoutAmounts({
    totalDueOnlineEur: 500,
    rentalSubtotalEur: 150,
    depositAmountEur: 250,
    depositMethod: "ONLINE",
  });
  assert.equal(result.ok, false);
}

function testRejectsNonPositiveRental() {
  const result = allocateCombinedCheckoutAmounts({
    totalDueOnlineEur: 250,
    rentalSubtotalEur: 0,
    depositAmountEur: 250,
    depositMethod: "ONLINE",
  });
  assert.equal(result.ok, false);
}

function testTwoLineItemsSumToTotal() {
  const allocation = allocateCombinedCheckoutAmounts({
    totalDueOnlineEur: 430,
    rentalSubtotalEur: 180,
    depositAmountEur: 250,
    depositMethod: "ONLINE",
  });
  assert.equal(allocation.ok, true);
  if (!allocation.ok) return;

  const items = buildCombinedCheckoutLineItems({
    allocation,
    vehicleName: "Test Scooter",
    bookingId: "b1",
    bookingReference: "EMR-TEST",
    pickupDate: "01 Jan 2026",
    returnDate: "03 Jan 2026",
  });

  assert.equal(items.length, 2);
  assert.equal(items[0]?.metadata?.allocation, "rental");
  assert.equal(items[1]?.metadata?.allocation, "security_deposit");
  assert.equal(lineItemsTotalCents(items), allocation.amountCents);
  assert.equal(items[0]?.unitAmountCents, allocation.rentalAmountCents);
  assert.equal(items[1]?.unitAmountCents, allocation.depositAmountCents);
}

function main() {
  testValidSplit();
  testRejectsInPerson();
  testRejectsWrongDeposit();
  testRejectsMismatchedTotal();
  testRejectsNonPositiveRental();
  testTwoLineItemsSumToTotal();
  console.log("test-checkout-allocation: all passed");
}

main();
