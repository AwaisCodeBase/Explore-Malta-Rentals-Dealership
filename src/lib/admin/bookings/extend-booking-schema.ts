import { z } from "zod";

export const previewBookingExtensionSchema = z.object({
  newReturnDateTime: z.coerce.date(),
});

export const extendBookingSchema = previewBookingExtensionSchema.extend({
  expectedUpdatedAt: z.coerce.date(),
});

export type PreviewBookingExtensionInput = z.infer<typeof previewBookingExtensionSchema>;
export type ExtendBookingInput = z.infer<typeof extendBookingSchema>;
