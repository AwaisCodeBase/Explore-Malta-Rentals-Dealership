import type { VehicleType } from "@/generated/prisma/client";
import { calculateHotelDiscount } from "@/lib/hotel-codes/calculate-hotel-discount";
import { calculateVehicleRentalPricing } from "@/lib/pricing/duration-pricing";
import type { PricingTierKey } from "@/lib/pricing/pricing-tiers";
import {
  calculateInsuranceTotal,
  INSURANCE_PLANS,
  isInsurancePlanCode,
  type InsurancePlanCode,
  type InsurancePlanSelection,
} from "@/lib/pricing/insurance-plans";
import { calculateRentalDuration } from "@/lib/pricing/rental-duration";

export { calculateRentalDuration, type RentalDurationBreakdown } from "@/lib/pricing/rental-duration";
export {
  INSURANCE_PLANS,
  INSURANCE_PLAN_CODES,
  calculateInsuranceTotal,
  getInsuranceDailyRate,
  isInsurancePlanCode,
  mapStoredCdwToInsurancePlan,
  type InsurancePlanCode,
  type InsurancePlanSelection,
} from "@/lib/pricing/insurance-plans";

export type PricingVehicleCategory = "motorbike" | "bicycle" | "atv";
export type PricingCdwOption =
  | "no_cdw"
  | "cdw_50cc_reduced_350"
  | "cdw_125cc_reduced_500"
  | "cdw_full_50cc_125cc"
  | "cdw_atv_reduced_800";

type LegacyCdwOption = "none" | "scooter_50" | "scooter_125" | "scooter_full" | "atv_full";

/** Accepted client/API values for CDW / insurance selection in pricing. */
export type PricingCdwInput =
  | PricingCdwOption
  | LegacyCdwOption
  | InsurancePlanCode
  | InsurancePlanSelection
  | "";

export type BookingPricingInput = Readonly<{
  rental: Readonly<{
    vehicle: Readonly<{
      id?: string;
      slug?: string;
      name?: string;
      type: string;
    }>;
    pickupDate: string;
    returnDate: string;
    pickupTime: string;
    returnTime: string;
  }>;
  delivery: Readonly<{
    pickupOption: "office" | "delivery";
    pickupAddress?: string;
    dropoffOption: "office" | "dropoff";
    dropoffAddress?: string;
  }>;
  addons: Readonly<{
    cdwOption?: PricingCdwInput;
    additionalDriver: boolean;
    storageBox: boolean;
    helmetSize1?: string;
    helmetSize2?: string;
  }>;
  additionalDriver: Readonly<{
    enabled: boolean;
  }>;
  deposit: Readonly<{
    method: "online" | "in_person" | "";
  }>;
  vehiclePricing: Readonly<{
    baseDailyRate: number;
    vehicleType: VehicleType;
    supportsStorageBox?: boolean;
  }>;
  hotelDiscount?: Readonly<{
    discountPercent: number;
  }>;
}>;

export type PricingLineItem = Readonly<{
  key: string;
  label: string;
  amount: number;
}>;

export type DeliveryFeeBreakdown = Readonly<{
  deliveryFee: number;
  dropoffFee: number;
  discount: number;
  deliveryTotal: number;
}>;

export type CdwBreakdown = Readonly<{
  selectedOption: PricingCdwOption;
  dailyRate: number;
  total: number;
}>;

export type BookingPriceBreakdown = Readonly<{
  rentalDays: number;
  actualDurationMinutes: number;
  actualDurationHours: number;
  rentalCost: number;
  baseDailyRate: number;
  tierKey: PricingTierKey;
  tierRange: string;
  durationDiscountPercent: number;
  discountAmountPerDay: number;
  appliedDailyRate: number;
  undiscountedRentalSubtotal: number;
  totalDiscountAmount: number;
  sundayDaysCharged: number;
  deliveryFee: number;
  dropoffFee: number;
  deliveryDiscount: number;
  deliveryTotal: number;
  cdwCost: number;
  cdwOptionApplied: PricingCdwOption;
  additionalDriverCost: number;
  storageBoxCost: number;
  hotelDiscountPercent: number;
  hotelDiscountAmount: number;
  rentalCostAfterHotelDiscount: number;
  subtotal: number;
  depositAmount: number;
  totalDueOnline: number;
  totalDueLater: number;
  lineItems: readonly PricingLineItem[];
}>;

export const pricingConfig = {
  delivery: {
    perLeg: 20,
    bothLegsDiscount: 10,
  },
  addons: {
    additionalDriverPerDay: 5,
    storageBoxOneTime: 10,
  },
  deposit: {
    amount: 250,
  },
  cdwPerDay: {
    no_cdw: INSURANCE_PLANS.NO_INSURANCE.dailyRate,
    /** Historical 50cc reduced package — same daily rate as Basic. */
    cdw_50cc_reduced_350: INSURANCE_PLANS.BASIC.dailyRate,
    /** Canonical Basic Plan storage mapping (€3/day). */
    cdw_125cc_reduced_500: INSURANCE_PLANS.BASIC.dailyRate,
    /** Canonical Full Coverage storage mapping (€8/day). */
    cdw_full_50cc_125cc: INSURANCE_PLANS.FULL_COVERAGE.dailyRate,
    /** Historical ATV package — kept for snapshot readability of old bookings. */
    cdw_atv_reduced_800: 15,
  } as const,
} as const;

export function normalizeVehicleCategory(type: string): PricingVehicleCategory | null {
  const normalized = type.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized.includes("atv")) {
    return "atv";
  }
  if (normalized.includes("bicycle") || normalized === "bike") {
    return "bicycle";
  }
  if (
    normalized.includes("scooter") ||
    normalized.includes("motorbike") ||
    normalized.includes("motorcycle")
  ) {
    return "motorbike";
  }
  if (normalized.includes("bike")) {
    return "bicycle";
  }
  return null;
}

export function calculateVehicleRentalCost(
  baseDailyRate: number,
  rentalDays: number,
): {
  rentalCost: number;
  baseDailyRate: number;
  tierKey: PricingTierKey;
  tierRange: string;
  durationDiscountPercent: number;
  discountAmountPerDay: number;
  appliedDailyRate: number;
  undiscountedRentalSubtotal: number;
  totalDiscountAmount: number;
  sundayDaysCharged: number;
} {
  const pricing = calculateVehicleRentalPricing(baseDailyRate, rentalDays);
  if (!pricing) {
    return {
      rentalCost: 0,
      baseDailyRate: 0,
      tierKey: "TIER_1",
      tierRange: "",
      durationDiscountPercent: 0,
      discountAmountPerDay: 0,
      appliedDailyRate: 0,
      undiscountedRentalSubtotal: 0,
      totalDiscountAmount: 0,
      sundayDaysCharged: 0,
    };
  }

  return {
    rentalCost: pricing.rentalSubtotal,
    baseDailyRate: pricing.baseDailyRate,
    tierKey: pricing.tierKey,
    tierRange: pricing.tierRange,
    durationDiscountPercent: pricing.durationDiscountPercent,
    discountAmountPerDay: pricing.discountAmountPerDay,
    appliedDailyRate: pricing.appliedDailyRate,
    undiscountedRentalSubtotal: pricing.undiscountedRentalSubtotal,
    totalDiscountAmount: pricing.totalDiscountAmount,
    sundayDaysCharged: 0,
  };
}

export function calculateDeliveryFees(
  pickupOption: "office" | "delivery",
  dropoffOption: "office" | "dropoff",
): DeliveryFeeBreakdown {
  const deliveryFee = pickupOption === "delivery" ? pricingConfig.delivery.perLeg : 0;
  const dropoffFee = dropoffOption === "dropoff" ? pricingConfig.delivery.perLeg : 0;
  const hasBothLegs = deliveryFee > 0 && dropoffFee > 0;
  const discount = hasBothLegs ? pricingConfig.delivery.bothLegsDiscount : 0;

  return {
    deliveryFee,
    dropoffFee,
    discount,
    deliveryTotal: Math.max(0, deliveryFee + dropoffFee - discount),
  };
}

export function mapInsurancePlanToPricingCdw(plan: InsurancePlanCode): PricingCdwOption {
  switch (plan) {
    case "BASIC":
      return "cdw_125cc_reduced_500";
    case "FULL_COVERAGE":
      return "cdw_full_50cc_125cc";
    case "NO_INSURANCE":
    default:
      return "no_cdw";
  }
}

function normalizeCdwOption(option?: PricingCdwInput): PricingCdwOption {
  if (option === null || option === undefined || option === "") {
    return "no_cdw";
  }
  if (isInsurancePlanCode(option)) {
    return mapInsurancePlanToPricingCdw(option);
  }
  switch (option) {
    case "cdw_50cc_reduced_350":
    case "cdw_125cc_reduced_500":
    case "cdw_full_50cc_125cc":
    case "cdw_atv_reduced_800":
    case "no_cdw":
      return option;
    case "scooter_50":
      return "cdw_50cc_reduced_350";
    case "scooter_125":
      return "cdw_125cc_reduced_500";
    case "scooter_full":
      return "cdw_full_50cc_125cc";
    case "atv_full":
      return "cdw_atv_reduced_800";
    case "none":
      return "no_cdw";
    default:
      return "no_cdw";
  }
}

export function calculateCdwCost(
  rentalDays: number,
  _vehicleCategory: PricingVehicleCategory,
  _vehicleHint: string,
  selectedOption?: PricingCdwInput,
): CdwBreakdown {
  const normalizedOption = normalizeCdwOption(selectedOption);

  if (isInsurancePlanCode(selectedOption)) {
    const insurance = calculateInsuranceTotal(selectedOption, rentalDays);
    return {
      selectedOption: mapInsurancePlanToPricingCdw(selectedOption),
      dailyRate: insurance.dailyRate,
      total: insurance.total,
    };
  }

  const dailyRate = pricingConfig.cdwPerDay[normalizedOption];
  return {
    selectedOption: normalizedOption,
    dailyRate,
    total: dailyRate * rentalDays,
  };
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCdwLabel(option: PricingCdwOption): string {
  switch (option) {
    case "cdw_125cc_reduced_500":
      return INSURANCE_PLANS.BASIC.label;
    case "cdw_full_50cc_125cc":
      return INSURANCE_PLANS.FULL_COVERAGE.label;
    case "cdw_50cc_reduced_350":
      return "Basic Plan (historical 50cc package)";
    case "cdw_atv_reduced_800":
      return "ATV reduced liability (EUR 800)";
    default:
      return INSURANCE_PLANS.NO_INSURANCE.label;
  }
}

export function calculateBookingPrice(input: BookingPricingInput): BookingPriceBreakdown | null {
  const vehicleCategory = normalizeVehicleCategory(input.rental.vehicle.type);
  if (!vehicleCategory || !input.vehiclePricing) {
    return null;
  }

  const duration = calculateRentalDuration(
    input.rental.pickupDate,
    input.rental.pickupTime,
    input.rental.returnDate,
    input.rental.returnTime,
  );
  if (!duration) {
    return null;
  }

  const rentalPricing = calculateVehicleRentalCost(
    input.vehiclePricing.baseDailyRate,
    duration.billableDays,
  );
  if (rentalPricing.rentalCost <= 0) {
    return null;
  }

  const {
    rentalCost,
    baseDailyRate,
    tierKey,
    tierRange,
    durationDiscountPercent,
    discountAmountPerDay,
    appliedDailyRate,
    undiscountedRentalSubtotal,
    totalDiscountAmount,
    sundayDaysCharged,
  } = rentalPricing;
  const deliveryBreakdown = calculateDeliveryFees(
    input.delivery.pickupOption,
    input.delivery.dropoffOption,
  );
  const vehicleHint = [
    input.rental.vehicle.id ?? "",
    input.rental.vehicle.slug ?? "",
    input.rental.vehicle.name ?? "",
  ].join(" ");
  const cdw = calculateCdwCost(
    duration.billableDays,
    vehicleCategory,
    vehicleHint,
    input.addons.cdwOption,
  );

  const additionalDriverEnabled = input.additionalDriver.enabled || input.addons.additionalDriver;
  const additionalDriverCost = additionalDriverEnabled
    ? pricingConfig.addons.additionalDriverPerDay * duration.billableDays
    : 0;
  const storageBoxAvailable = input.vehiclePricing.supportsStorageBox === true;
  const storageBoxCost =
    storageBoxAvailable && input.addons.storageBox ? pricingConfig.addons.storageBoxOneTime : 0;
  const hotelDiscount = input.hotelDiscount
    ? calculateHotelDiscount(rentalCost, input.hotelDiscount.discountPercent)
    : {
        discountPercent: 0,
        discountAmount: 0,
        rentalCostAfterDiscount: rentalCost,
      };
  const subtotal =
    hotelDiscount.rentalCostAfterDiscount +
    deliveryBreakdown.deliveryTotal +
    cdw.total +
    additionalDriverCost +
    storageBoxCost;
  const depositAmount = pricingConfig.deposit.amount;
  const totalDueOnline = subtotal + (input.deposit.method === "online" ? depositAmount : 0);
  const totalDueLater = input.deposit.method === "in_person" ? depositAmount : 0;

  const lineItems: PricingLineItem[] = [
    { key: "rental_cost", label: "Rental Cost", amount: rentalCost },
    ...(hotelDiscount.discountAmount > 0
      ? [
          {
            key: "hotel_discount",
            label: "Hotel Discount",
            amount: -hotelDiscount.discountAmount,
          },
        ]
      : []),
    { key: "delivery_dropoff", label: "Delivery / Drop-off", amount: deliveryBreakdown.deliveryTotal },
    { key: "cdw", label: "Insurance", amount: cdw.total },
    { key: "additional_driver", label: "Additional Driver", amount: additionalDriverCost },
    { key: "storage_box", label: "Storage Box", amount: storageBoxCost },
  ];

  return {
    rentalDays: duration.billableDays,
    actualDurationMinutes: duration.actualDurationMinutes,
    actualDurationHours: duration.actualDurationHours,
    rentalCost,
    baseDailyRate,
    tierKey,
    tierRange,
    durationDiscountPercent,
    discountAmountPerDay,
    appliedDailyRate,
    undiscountedRentalSubtotal,
    totalDiscountAmount,
    sundayDaysCharged,
    deliveryFee: deliveryBreakdown.deliveryFee,
    dropoffFee: deliveryBreakdown.dropoffFee,
    deliveryDiscount: deliveryBreakdown.discount,
    deliveryTotal: deliveryBreakdown.deliveryTotal,
    cdwCost: cdw.total,
    cdwOptionApplied: cdw.selectedOption,
    additionalDriverCost,
    storageBoxCost,
    hotelDiscountPercent: hotelDiscount.discountPercent,
    hotelDiscountAmount: hotelDiscount.discountAmount,
    rentalCostAfterHotelDiscount: hotelDiscount.rentalCostAfterDiscount,
    subtotal,
    depositAmount,
    totalDueOnline,
    totalDueLater,
    lineItems,
  };
}
