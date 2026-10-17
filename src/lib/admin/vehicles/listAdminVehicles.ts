import type { Prisma } from "@/generated/prisma/index";

import { getAdminVehicleUnitCountsByVehicleIds, listAdminVehicleUnits } from "@/lib/admin/vehicle-units";
import type {
  AdminVehicleDetail,
  AdminVehicleListFilters,
  AdminVehicleListResult,
} from "@/lib/admin/vehicles/types";
import { prisma } from "@/lib/prisma";
import {
  vehicleCanDelete,
  vehicleDeleteBlockedReasons,
  vehicleDeleteRelationCountSelect,
} from "@/lib/admin/vehicles/vehicle-delete-errors";

function normalizeSearchTerm(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export async function listAdminVehicles(filters: AdminVehicleListFilters = {}): Promise<AdminVehicleListResult> {
  const where: Prisma.VehicleWhereInput = {};
  const search = normalizeSearchTerm(filters.search);

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { units: { some: { licensePlate: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (filters.vehicleType) {
    where.vehicleType = filters.vehicleType;
  }

  if (filters.catalogStatus) {
    where.catalogStatus = filters.catalogStatus;
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        vehicleType: true,
        engineCc: true,
        brand: true,
        model: true,
        color: true,
        mainImageUrl: true,
        catalogStatus: true,
        isActive: true,
        displayOrder: true,
        baseDailyRate: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { imageUrl: true },
        },
        _count: {
          select: vehicleDeleteRelationCountSelect(),
        },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  const unitCounts = await getAdminVehicleUnitCountsByVehicleIds(vehicles.map((vehicle) => vehicle.id));

  return {
    total,
    vehicles: vehicles.map((vehicle) => {
      const counts = unitCounts.get(vehicle.id) ?? { totalUnits: 0, availableUnits: 0 };
      return {
        id: vehicle.id,
        name: vehicle.name,
        slug: vehicle.slug,
        vehicleType: vehicle.vehicleType,
        engineCc: vehicle.engineCc,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        mainImageUrl: vehicle.mainImageUrl ?? vehicle.images[0]?.imageUrl ?? null,
        catalogStatus: vehicle.catalogStatus,
        isActive: vehicle.isActive,
        displayOrder: vehicle.displayOrder,
        baseDailyRate: vehicle.baseDailyRate.toNumber(),
        totalUnits: counts.totalUnits,
        availableUnits: counts.availableUnits,
        bookingCount: vehicle._count.bookings,
        reservationHoldCount: vehicle._count.reservationHolds,
        availabilityBlockCount: vehicle._count.availabilityBlocks,
        canDelete: vehicleCanDelete(vehicle._count),
        deleteBlockedReasons: vehicleDeleteBlockedReasons(vehicle._count),
      };
    }),
  };
}

export async function getAdminVehicleById(id: string): Promise<AdminVehicleDetail | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      vehicleType: true,
      engineCc: true,
      brand: true,
      model: true,
      color: true,
      shortDescription: true,
      description: true,
      mainImageUrl: true,
      catalogStatus: true,
      isActive: true,
      displayOrder: true,
      baseDailyRate: true,
      helmetIncludedCount: true,
      supportsStorageBox: true,
      createdAt: true,
      updatedAt: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          sortOrder: true,
          isPrimary: true,
        },
      },
      _count: {
        select: vehicleDeleteRelationCountSelect(),
      },
    },
  });

  if (!vehicle) {
    return null;
  }

  const [units, unitCounts] = await Promise.all([
    listAdminVehicleUnits(id),
    getAdminVehicleUnitCountsByVehicleIds([id]),
  ]);
  const counts = unitCounts.get(id) ?? { totalUnits: 0, availableUnits: 0 };

  return {
    id: vehicle.id,
    name: vehicle.name,
    slug: vehicle.slug,
    vehicleType: vehicle.vehicleType,
    engineCc: vehicle.engineCc,
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color,
    shortDescription: vehicle.shortDescription,
    description: vehicle.description,
    mainImageUrl: vehicle.mainImageUrl ?? vehicle.images[0]?.imageUrl ?? null,
    catalogStatus: vehicle.catalogStatus,
    isActive: vehicle.isActive,
    displayOrder: vehicle.displayOrder,
    baseDailyRate: vehicle.baseDailyRate.toNumber(),
    totalUnits: counts.totalUnits,
    availableUnits: counts.availableUnits,
    helmetIncludedCount: vehicle.helmetIncludedCount,
    supportsStorageBox: vehicle.supportsStorageBox,
    bookingCount: vehicle._count.bookings,
    reservationHoldCount: vehicle._count.reservationHolds,
    availabilityBlockCount: vehicle._count.availabilityBlocks,
    canDelete: vehicleCanDelete(vehicle._count),
    deleteBlockedReasons: vehicleDeleteBlockedReasons(vehicle._count),
    images: vehicle.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })),
    units,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}
