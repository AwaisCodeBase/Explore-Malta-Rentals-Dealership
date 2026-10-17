import { z } from "zod";

import { VEHICLE_CATALOG_STATUSES, VEHICLE_TYPES } from "@/lib/admin/vehicles/types";
import { isEngineCcValue, vehicleTypeUsesEngineCc } from "@/lib/vehicles/engine-cc";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

export function normalizeLicensePlate(value: string): string {
  return value.trim().toUpperCase();
}

const vehicleImageSchema = z.object({
  id: z.string().cuid().optional(),
  imageUrl: z.string().trim().min(1, "Image URL is required").max(2048),
  altText: optionalText,
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isPrimary: z.boolean().default(false),
});

export const adminVehicleWriteSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
  vehicleType: z.enum(VEHICLE_TYPES as [string, ...string[]]),
  engineCc: z.union([z.literal(50), z.literal(125), z.null()]).optional(),
  brand: optionalText,
  model: optionalText,
  color: optionalText,
  shortDescription: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  mainImageUrl: z.string().trim().max(2048).nullable().optional(),
  catalogStatus: z.enum(VEHICLE_CATALOG_STATUSES as [string, ...string[]]),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0).max(9999).default(0),
  helmetIncludedCount: z.number().int().min(0).max(10).default(2),
  supportsStorageBox: z.boolean().default(false),
  images: z.array(vehicleImageSchema).max(20).default([]),
  baseDailyRate: z
    .number({ required_error: "Base daily rate is required", invalid_type_error: "Base daily rate is required" })
    .positive("Base daily rate must be greater than 0")
    .max(99999, "Base daily rate is too high"),
}).superRefine((data, context) => {
  if (vehicleTypeUsesEngineCc(data.vehicleType)) {
    if (!isEngineCcValue(data.engineCc)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["engineCc"],
        message: "Engine size must be 50cc or 125cc",
      });
    }
    return;
  }

  if (data.engineCc != null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["engineCc"],
      message: "Engine size is only used for scooters and motorcycles",
    });
  }
});

export type AdminVehicleWriteInput = z.infer<typeof adminVehicleWriteSchema>;

export const adminVehicleListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  vehicleType: z.enum(VEHICLE_TYPES as [string, ...string[]]).optional(),
  catalogStatus: z.enum(VEHICLE_CATALOG_STATUSES as [string, ...string[]]).optional(),
});
