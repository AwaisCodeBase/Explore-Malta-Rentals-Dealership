import assert from "node:assert/strict";

import { buildAdminBookingPriceBuildup } from "@/lib/admin/bookings/build-admin-booking-price-buildup";
import type { AdminBookingDetail } from "@/lib/admin/bookings/types";
import { buildBookingPaymentSummary } from "@/lib/booking/build-booking-payment-summary";

function baseBooking(overrides: Partial<AdminBookingDetail> = {}): AdminBookingDetail {
  return {
    id: "booking-1",
    bookingReference: "EMR-TEST-001",
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    securityDepositStatus: "PENDING",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    customerFullName: "Test Customer",
    customerPhone: "+35600000000",
    customerEmail: "test@example.com",
    customerNationality: "Malta",
    customerDateOfBirth: "1990-01-01T00:00:00.000Z",
    customerLicenseCategory: "B",
    customerSpecialNotes: null,
    customerLicenseUploadPath: null,
    customerPassportUploadPath: null,
    paymentProofUploadPath: null,
    customerWillPresentLicenseAtPickup: false,
    customerWillPresentIdAtPickup: false,
    vehicleId: "vehicle-1",
    vehicleUnitId: "unit-1",
    vehicleUnitStatus: "RESERVED",
    vehicleName: "Test Scooter",
    vehicleLicensePlate: "ABC-123",
    vehicleColor: null,
    vehicleType: "Scooter",
    vehicleTypeSnapshot: "Scooter",
    pickupDateTime: "2026-06-10T09:00:00.000Z",
    returnDateTime: "2026-07-04T09:00:00.000Z",
    billableDays: 24,
    actualDurationHours: 576,
    pickupOption: "DELIVERY",
    pickupAddress: "Hotel",
    pickupLatitude: null,
    pickupLongitude: null,
    dropoffOption: "DROPOFF",
    dropoffAddress: "Airport",
    dropoffLatitude: null,
    dropoffLongitude: null,
    cdwOption: "REDUCE_350_50CC",
    cdwDailyRate: 3,
    cdwTotal: 72,
    helmetSize1: "M",
    helmetSize2: null,
    storageBoxSelected: false,
    storageBoxCost: 0,
    additionalDriverEnabled: false,
    additionalDriverFullName: null,
    additionalDriverPhone: null,
    additionalDriverEmail: null,
    additionalDriverNationality: null,
    additionalDriverDateOfBirth: null,
    additionalDriverLicenseCategory: null,
    additionalDriverLicenseUploadPath: null,
    additionalDriverPassportUploadPath: null,
    additionalDriverWillPresentLicenseAtPickup: false,
    additionalDriverWillPresentIdAtPickup: false,
    additionalDriverDailyRate: 5,
    additionalDriverTotal: 0,
    hotelCode: null,
    hotelName: null,
    hotelDiscountPercentSnapshot: null,
    hotelDiscountAmountSnapshot: null,
    subtotalAfterHotelDiscountSnapshot: null,
    baseDailyRateSnapshot: 50,
    durationDiscountPercentSnapshot: 40,
    appliedDailyRateSnapshot: 30,
    rentalCost: 720,
    deliveryFee: 20,
    dropoffFee: 20,
    deliveryTotal: 30,
    subtotal: 822,
    depositAmount: 250,
    depositMethod: "IN_PERSON",
    totalDueOnline: 822,
    totalDueLater: 250,
    termsAccepted: true,
    termsAcceptedAt: "2026-06-01T10:00:00.000Z",
    termsVersion: "v1",
    consentSource: "web",
    confirmationEmailStatus: "SENT",
    confirmationEmailSentAt: "2026-06-01T10:01:00.000Z",
    paymentReceivedAmount: null,
    paymentMethod: null,
    securityDepositCollectedAmount: null,
    handoverDateTime: null,
    handoverNotes: null,
    returnRecordedAt: null,
    returnNotes: null,
    depositRefundAmount: null,
    depositDeductionAmount: null,
    depositDeductionReason: null,
    completionNotes: null,
    statusHistory: [],
    ...overrides,
  };
}

function runTests() {
  const example = buildAdminBookingPriceBuildup(baseBooking());

  assert.equal(example.rental.originalRentalBeforeDiscount, 1200);
  assert.equal(example.rental.durationDiscountAmount, 480);
  assert.equal(example.rental.rentalSubtotal, 720);
  assert.equal(example.delivery.combinedBeforeAdjustment, 40);
  assert.equal(example.delivery.adjustment, 10);
  assert.equal(example.delivery.hasAdjustment, true);
  assert.equal(example.cdw.total, 72);
  assert.equal(example.subtotal.subtotal, 822);
  assert.equal(example.deposit.depositDueAtPickup, true);
  assert.equal(example.hotel.used, false);
  assert.equal(example.hotel.rentalAfterHotelDiscount, 720);

  assert.equal(example.paymentSummary.bookingChargesTotal, 822);
  assert.equal(example.paymentSummary.securityDeposit, 250);
  assert.equal(example.paymentSummary.amountPayableOnline, null);
  assert.equal(example.paymentSummary.amountDueAtPickupLater, 1072);
  assert.equal(example.paymentSummary.totalCustomerLiability, 1072);
  assert.equal(example.paymentSummary.onlinePaymentEnabled, false);

  const withHotel = buildAdminBookingPriceBuildup(
    baseBooking({
      hotelCode: "HOTEL10",
      hotelName: "Example Hotel",
      hotelDiscountPercentSnapshot: 10,
      hotelDiscountAmountSnapshot: 72,
      subtotalAfterHotelDiscountSnapshot: 648,
      subtotal: 750,
      totalDueOnline: 750,
    }),
  );

  assert.equal(withHotel.hotel.used, true);
  assert.equal(withHotel.hotel.rentalAfterHotelDiscount, 648);
  assert.equal(withHotel.subtotal.rentalAfterHotelDiscount, 648);

  const sharedSummary = buildBookingPaymentSummary({
    subtotal: 822,
    depositAmount: 250,
    depositMethod: "IN_PERSON",
    totalDueOnline: 822,
    totalDueLater: 250,
  });
  assert.equal(sharedSummary.amountPayableOnline, null);
  assert.equal(sharedSummary.amountDueAtPickupLater, 1072);
  assert.equal(sharedSummary.totalCustomerLiability, 1072);

  console.log("admin booking price buildup tests passed");
}

runTests();
