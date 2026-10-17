import { z } from "zod";

const bookingStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "CONFIRMED",
  "VEHICLE_HANDED_OVER",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
]);

const currentYear = new Date().getFullYear();

export const adminBookingListQuerySchema = z.object({
  search: z.string().trim().min(1).max(200).optional(),
  status: bookingStatusSchema.optional(),
  vehicleId: z.string().cuid().optional(),
  hotelPartnerId: z.string().cuid().optional(),
  hotelCode: z.string().trim().min(1).max(50).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(currentYear + 1).optional(),
  pickupFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pickupTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const adminBookingStatusUpdateSchema = z.object({
  status: bookingStatusSchema,
  note: z.string().trim().max(500).optional(),
});

export type AdminBookingListQueryInput = z.infer<typeof adminBookingListQuerySchema>;
export type AdminBookingStatusUpdateInput = z.infer<typeof adminBookingStatusUpdateSchema>;
