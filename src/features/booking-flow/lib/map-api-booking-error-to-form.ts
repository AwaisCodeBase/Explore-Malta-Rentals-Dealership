import type { FieldPath } from "react-hook-form";
import type { BookingFlowState } from "@/features/booking-flow/lib/types";

/**
 * Maps `/api/bookings` validation paths to react-hook-form field paths where the UI can show them.
 */
export function mapApiBookingErrorPathToFormPath(apiPath: string): FieldPath<BookingFlowState> | null {
  const normalized = apiPath.trim();
  const map: Record<string, FieldPath<BookingFlowState>> = {
    "customer.licenseUploadPath": "customer.driverLicenseUpload",
    "customer.passportUploadPath": "customer.passportUpload",
    "additionalDriver.passportUploadPath": "additionalDriver.passportIdUpload",
    "delivery.pickupAddress": "delivery.pickupAddress",
    "delivery.dropoffAddress": "delivery.dropoffAddress",
    "customer.willPresentLicenseAtPickup": "customer.licenseConfirmationCheckbox",
    "customer.willPresentIdAtPickup": "customer.idConfirmationCheckbox",
    "additionalDriver.willPresentLicenseAtPickup": "additionalDriver.officeIdConfirmed",
    "additionalDriver.willPresentIdAtPickup": "additionalDriver.officeIdConfirmed",
    "consent.termsAccepted": "consent.termsAccepted",
    "deposit.depositMethod": "deposit.depositMethod",
    "payment.proofPath": "payment.proofPath",
    "payment.mode": "payment.mode",
    "hotelCode": "hotelCode.code",
    "addons.helmetSize1": "addons.helmetSize1",
    "addons.helmetSize2": "addons.helmetSize2",
    "addons.cdwOption": "addons.cdwPlan",
    "addons.storageBoxSelected": "addons.storageBox",
    "rental.vehicleId": "rental.vehicleId",
  };

  if (map[normalized]) {
    return map[normalized];
  }

  if (normalized.startsWith("customer.")) {
    const suffix = normalized.slice("customer.".length);
    const allowed: Record<string, FieldPath<BookingFlowState>> = {
      fullName: "customer.fullName",
      phone: "customer.phone",
      email: "customer.email",
      nationality: "customer.nationality",
      dateOfBirth: "customer.dateOfBirth",
      licenseCategory: "customer.licenseCategory",
      specialNotes: "customer.specialNotes",
    };
    return allowed[suffix] ?? null;
  }

  if (normalized.startsWith("additionalDriver.")) {
    const suffix = normalized.slice("additionalDriver.".length);
    const allowed: Record<string, FieldPath<BookingFlowState>> = {
      fullName: "additionalDriver.fullName",
      phone: "additionalDriver.phone",
      email: "additionalDriver.email",
      nationality: "additionalDriver.nationality",
      dateOfBirth: "additionalDriver.dateOfBirth",
      licenseCategory: "additionalDriver.licenseCategory",
    };
    return allowed[suffix] ?? null;
  }

  if (normalized.startsWith("rental.")) {
    const suffix = normalized.slice("rental.".length);
    const allowed: Record<string, FieldPath<BookingFlowState>> = {
      pickupDate: "rental.pickupDate",
      returnDate: "rental.returnDate",
      pickupTime: "rental.pickupTime",
      returnTime: "rental.returnTime",
      vehicleType: "rental.vehicleType",
    };
    return allowed[suffix] ?? null;
  }

  return null;
}

export function summarizeApiBookingErrors(errors: { path: string; message: string }[]): string {
  const unique = new Map<string, string>();
  for (const err of errors) {
    if (!unique.has(err.message)) {
      unique.set(err.message, err.path);
    }
  }
  return Array.from(unique.keys()).join(" ");
}
