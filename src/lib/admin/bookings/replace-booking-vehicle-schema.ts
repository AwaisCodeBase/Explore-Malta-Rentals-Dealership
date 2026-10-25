import { z } from "zod";

export const replaceBookingVehicleSchema = z.object({
  vehicleUnitId: z.string().cuid(),
  previousUnitStatus: z.enum(["AVAILABLE", "MAINTENANCE", "NOT_AVAILABLE"]),
  reason: z.enum(["mechanical_issue", "damage", "customer_requested", "other"]),
  note: z.string().trim().max(500).optional(),
  expectedUpdatedAt: z.coerce.date(),
  expectedVehicleUnitId: z.string().cuid(),
});

export type ReplaceBookingVehicleBody = z.infer<typeof replaceBookingVehicleSchema>;
