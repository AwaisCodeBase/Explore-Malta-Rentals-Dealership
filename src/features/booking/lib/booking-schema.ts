import { z } from "zod";
import { differenceInCalendarDays, isAfter, parse, startOfDay } from "date-fns";
import { BOOKING_TIME_SLOTS } from "@/features/booking/lib/time-slots";

/** Calendar-day span between pickup and drop-off dates (`differenceInCalendarDays`). */
export const TRIP_MIN_SPAN_DAYS = 1;
export const TRIP_MAX_SPAN_DAYS = 30;

export const BOOKING_SHOP_LABEL = "Pietà — Explore Malta Rentals (shop)" as const;
export const SECURITY_DEPOSIT_EUR = 250;

export type BookingFormMessages = Readonly<{
  invalidPickupDate: string;
  invalidDropoffDate: string;
  selectPickupTime: string;
  pickupTimeWindow: string;
  selectDropoffTime: string;
  dropoffTimeWindow: string;
  alternateAddressDetail: string;
  dropoffAddressDetail: string;
  tripMinDays: string;
  tripMaxDays: string;
  dropoffAfterPickup: string;
}>;

function isBookingTime(value: string) {
  return (BOOKING_TIME_SLOTS as readonly string[]).includes(value);
}

export function createBookingFormSchema(m: BookingFormMessages) {
  return z
    .object({
      vehicleType: z.string().optional(),
      brand: z.string().optional(),
      transmission: z.string().optional(),
      seats: z.string().optional(),
      color: z.string().optional(),
      alternatePickupRequested: z.boolean(),
      alternatePickupAddress: z.string().optional(),
      differentDropoff: z.boolean(),
      dropoffAddress: z.string().optional(),
      pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, m.invalidPickupDate),
      dropoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, m.invalidDropoffDate),
      pickupTime: z
        .string()
        .min(1, m.selectPickupTime)
        .refine(isBookingTime, m.pickupTimeWindow),
      dropoffTime: z
        .string()
        .min(1, m.selectDropoffTime)
        .refine(isBookingTime, m.dropoffTimeWindow),
    })
    .superRefine((data, ctx) => {
      if (data.alternatePickupRequested) {
        const addr = data.alternatePickupAddress?.trim() ?? "";
        if (addr.length < 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.alternateAddressDetail,
            path: ["alternatePickupAddress"],
          });
        }
      }
      if (data.differentDropoff) {
        const addr = data.dropoffAddress?.trim() ?? "";
        if (addr.length < 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.dropoffAddressDetail,
            path: ["dropoffAddress"],
          });
        }
      }

      const pickupDay = startOfDay(parse(data.pickupDate, "yyyy-MM-dd", new Date()));
      const dropoffDay = startOfDay(parse(data.dropoffDate, "yyyy-MM-dd", new Date()));
      const spanDays = differenceInCalendarDays(dropoffDay, pickupDay);
      if (spanDays < TRIP_MIN_SPAN_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: m.tripMinDays,
          path: ["dropoffDate"],
        });
      } else if (spanDays > TRIP_MAX_SPAN_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: m.tripMaxDays,
          path: ["dropoffDate"],
        });
      }

      const pickup = parse(`${data.pickupDate} ${data.pickupTime}`, "yyyy-MM-dd HH:mm", new Date());
      const dropoff = parse(`${data.dropoffDate} ${data.dropoffTime}`, "yyyy-MM-dd HH:mm", new Date());
      if (!isAfter(dropoff, pickup)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: m.dropoffAfterPickup,
          path: ["dropoffDate"],
        });
      }
    });
}

export type BookingFormValues = z.infer<ReturnType<typeof createBookingFormSchema>>;
