import { Prisma, type VehicleCatalogStatus, type VehicleType } from "@/generated/prisma/client";

import { ensureUniqueVehicleSlug } from "@/lib/admin/vehicles/slug";
import type { AdminVehicleDetail } from "@/lib/admin/vehicles/types";
import type { AdminVehicleWriteInput } from "@/lib/admin/vehicles/vehicle-schema";
import { getAdminVehicleById } from "@/lib/admin/vehicles/listAdminVehicles";
import { vehicleDeleteRelationCountSelect } from "@/lib/admin/vehicles/vehicle-delete-errors";
import { prisma } from "@/lib/prisma";
import { normalizeEngineCc } from "@/lib/vehicles/engine-cc";

export class DuplicateLicensePlateError extends Error {
  constructor() {
    super("A vehicle with this license plate already exists.");
    this.name = "DuplicateLicensePlateError";
  }
}

function isLicensePlateUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes("licensePlate");
  }

  if (typeof target === "string") {
    return target.includes("licensePlate");
  }

  return false;
}

function normalizeCatalogStatus(
  catalogStatus: AdminVehicleWriteInput["catalogStatus"],
  isActive: boolean,
): VehicleCatalogStatus {
  if (!isActive) {
    return "INACTIVE";
  }
  return catalogStatus as VehicleCatalogStatus;
}

function normalizeImages(images: AdminVehicleWriteInput["images"]) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasPrimary = sorted.some((image) => image.isPrimary);

  return sorted.map((image, index) => ({
    imageUrl: image.imageUrl.trim(),
    altText: image.altText?.trim() || null,
    sortOrder: image.sortOrder ?? index,
    isPrimary: hasPrimary ? image.isPrimary : index === 0,
  }));
}

export async function createAdminVehicle(input: AdminVehicleWriteInput): Promise<AdminVehicleDetail> {
  const slug = await ensureUniqueVehicleSlug(input.slug || input.name);
  const catalogStatus = normalizeCatalogStatus(input.catalogStatus, input.isActive);
  const images = normalizeImages(input.images ?? []);
  const mainImageUrl = input.mainImageUrl?.trim() || images.find((image) => image.isPrimary)?.imageUrl || images[0]?.imageUrl || null;

  let vehicle: { id: string };
  try {
    vehicle = await prisma.vehicle.create({
      data: {
        name: input.name.trim(),
        slug,
        vehicleType: input.vehicleType as VehicleType,
        engineCc: normalizeEngineCc(input.vehicleType, input.engineCc),
        baseDailyRate: input.baseDailyRate,
        brand: input.brand?.trim() || null,
        model: input.model?.trim() || null,
        color: input.color?.trim() || null,
        shortDescription: input.shortDescription?.trim() || null,
        description: input.description?.trim() || null,
        mainImageUrl,
        catalogStatus,
        isActive: input.isActive,
        displayOrder: input.displayOrder ?? 0,
        helmetIncludedCount: input.helmetIncludedCount ?? 2,
        supportsStorageBox: input.supportsStorageBox ?? false,
        images: {
          create: images,
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (isLicensePlateUniqueConstraintError(error)) {
      throw new DuplicateLicensePlateError();
    }
    throw error;
  }

  const created = await getAdminVehicleById(vehicle.id);
  if (!created) {
    throw new Error("Failed to load vehicle after create");
  }

  return created;
}

export async function updateAdminVehicle(
  id: string,
  input: AdminVehicleWriteInput,
): Promise<AdminVehicleDetail | null> {
  const existing = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  const slug = await ensureUniqueVehicleSlug(input.slug || input.name, id);
  const catalogStatus = normalizeCatalogStatus(input.catalogStatus, input.isActive);
  const images = normalizeImages(input.images ?? []);
  const mainImageUrl = input.mainImageUrl?.trim() || images.find((image) => image.isPrimary)?.imageUrl || images[0]?.imageUrl || null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.vehicleImage.deleteMany({ where: { vehicleId: id } });

      await tx.vehicle.update({
        where: { id },
        data: {
          name: input.name.trim(),
          slug,
          vehicleType: input.vehicleType as VehicleType,
          engineCc: normalizeEngineCc(input.vehicleType, input.engineCc),
          baseDailyRate: input.baseDailyRate,
          brand: input.brand?.trim() || null,
          model: input.model?.trim() || null,
          color: input.color?.trim() || null,
          shortDescription: input.shortDescription?.trim() || null,
          description: input.description?.trim() || null,
          mainImageUrl,
          catalogStatus,
          isActive: input.isActive,
          displayOrder: input.displayOrder ?? 0,
          helmetIncludedCount: input.helmetIncludedCount ?? 2,
          supportsStorageBox: input.supportsStorageBox ?? false,
          images: {
            create: images,
          },
        },
      });
    });
  } catch (error) {
    if (isLicensePlateUniqueConstraintError(error)) {
      throw new DuplicateLicensePlateError();
    }
    throw error;
  }

  return getAdminVehicleById(id);
}

export type DeactivateAdminVehicleResult =
  | { ok: true; vehicle: AdminVehicleDetail }
  | { ok: false; reason: "not_found" };

export type ActivateAdminVehicleResult =
  | { ok: true; vehicle: AdminVehicleDetail }
  | { ok: false; reason: "not_found" | "already_active" };

export async function activateAdminVehicle(id: string): Promise<ActivateAdminVehicleResult> {
  const existing = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  if (existing.isActive) {
    return { ok: false, reason: "already_active" };
  }

  await prisma.vehicle.update({
    where: { id },
    data: {
      isActive: true,
      catalogStatus: "AVAILABLE",
    },
  });

  const vehicle = await getAdminVehicleById(id);
  if (!vehicle) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, vehicle };
}

export async function deactivateAdminVehicle(id: string): Promise<DeactivateAdminVehicleResult> {
  const existing = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  await prisma.vehicle.update({
    where: { id },
    data: {
      isActive: false,
      catalogStatus: "INACTIVE",
    },
  });

  const vehicle = await getAdminVehicleById(id);
  if (!vehicle) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, vehicle };
}

export type DeleteAdminVehicleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "has_related_records" };

export async function deleteAdminVehicle(id: string): Promise<DeleteAdminVehicleResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: vehicleDeleteRelationCountSelect(),
        },
      },
    });

    if (!existing) {
      return { ok: false, reason: "not_found" };
    }

    const { bookings, reservationHolds, availabilityBlocks } = existing._count;
    if (bookings > 0 || reservationHolds > 0 || availabilityBlocks > 0) {
      return { ok: false, reason: "has_related_records" };
    }

    await tx.booking.updateMany({
      where: {
        status: "CANCELLED",
        OR: [{ vehicleId: id }, { vehicleUnit: { vehicleId: id } }],
      },
      data: {
        vehicleId: null,
        vehicleUnitId: null,
      },
    });

    await tx.vehicle.delete({ where: { id } });

    return { ok: true };
  });
}
