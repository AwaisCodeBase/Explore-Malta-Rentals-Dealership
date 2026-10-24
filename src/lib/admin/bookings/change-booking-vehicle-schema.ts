import { z } from "zod";

export const previewChangeBookingVehicleSchema = z.object({
  vehicleId: z.string().trim().min(1),
  color: z.string().trim().max(40).nullable().optional(),
  priceMode: z.enum(["keep_existing", "apply_catalog"]),
});

export const changeBookingVehicleSchema = previewChangeBookingVehicleSchema.extend({
  expectedUpdatedAt: z.coerce.date(),
});

export type PreviewChangeBookingVehicleInput = z.infer<typeof previewChangeBookingVehicleSchema>;
export type ChangeBookingVehicleInput = z.infer<typeof changeBookingVehicleSchema>;
