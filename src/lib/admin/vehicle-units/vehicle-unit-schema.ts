import { z } from "zod";

import { normalizeLicensePlate } from "@/lib/admin/vehicles/vehicle-schema";
import { normalizeVehicleColorForStorage } from "@/features/vehicles/lib/vehicle-color";
import { VEHICLE_COLOR_OPTIONS } from "@/features/vehicles/lib/vehicle-color";

export const VEHICLE_UNIT_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "OUT_WITH_CUSTOMER",
  "MAINTENANCE",
  "NOT_AVAILABLE",
] as const;

const colorFieldSchema = z
  .string()
  .trim()
  .min(1, "Color is required")
  .max(50, "Color must be at most 50 characters")
  .transform((value) => normalizeVehicleColorForStorage(value))
  .refine((value) => value !== null, { message: "Invalid color selection" });

const optionalColorFieldSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    if (trimmed.length > 50) {
      return null;
    }
    return normalizeVehicleColorForStorage(trimmed);
  });

export const adminVehicleUnitCreateSchema = z.object({
  licensePlate: z
    .string()
    .trim()
    .min(1, "License plate is required")
    .max(20, "License plate must be at most 20 characters")
    .transform(normalizeLicensePlate),
  color: colorFieldSchema,
  status: z.enum(VEHICLE_UNIT_STATUSES).default("AVAILABLE"),
  isActive: z.boolean().default(true),
  notes: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
});

export const adminVehicleUnitUpdateSchema = z.object({
  licensePlate: z
    .string()
    .trim()
    .min(1, "License plate is required")
    .max(20, "License plate must be at most 20 characters")
    .transform(normalizeLicensePlate),
  color: optionalColorFieldSchema,
  status: z.enum(VEHICLE_UNIT_STATUSES).default("AVAILABLE"),
  isActive: z.boolean().default(true),
  notes: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
});

/** @deprecated Use adminVehicleUnitCreateSchema or adminVehicleUnitUpdateSchema */
export const adminVehicleUnitWriteSchema = adminVehicleUnitCreateSchema;

export type AdminVehicleUnitCreateInput = z.infer<typeof adminVehicleUnitCreateSchema>;
export type AdminVehicleUnitUpdateInput = z.infer<typeof adminVehicleUnitUpdateSchema>;
export type AdminVehicleUnitWriteInput = AdminVehicleUnitCreateInput;

export { VEHICLE_COLOR_OPTIONS };
