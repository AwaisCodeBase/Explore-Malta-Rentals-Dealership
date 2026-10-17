"use client";

import { BookingSummaryStep } from "@/features/booking-flow/steps/booking-summary-step";

export function ReviewConfirmStep() {
  return (
    <div className="space-y-5">
      <BookingSummaryStep />
    </div>
  );
}
