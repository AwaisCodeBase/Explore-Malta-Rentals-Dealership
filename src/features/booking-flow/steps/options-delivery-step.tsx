"use client";

import { PickupDropoffStep } from "@/features/booking-flow/steps/pickup-dropoff-step";
import { AddonsStep } from "@/features/booking-flow/steps/addons-step";
import { HotelCodeField } from "@/features/booking-flow/components/hotel-code-field";

export function OptionsDeliveryStep() {
  return (
    <div className="space-y-5">
      <PickupDropoffStep />
      <AddonsStep />
      <HotelCodeField />
    </div>
  );
}
