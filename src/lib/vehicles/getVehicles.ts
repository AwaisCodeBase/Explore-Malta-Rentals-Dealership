import type { Prisma } from "@/generated/prisma/index";
import { prisma } from "@/lib/prisma";

import type { GetVehiclesFilters, GetVehiclesResult, VehicleListItemDto } from "./types";

function mapVehicleListItem(
  vehicle: {
    id: string;
    name: string;
    slug: string;
    vehicleType: VehicleListItemDto["vehicleType"];
    engineCc: number | null;
    brand: string | null;
    model: string | null;
    color: string | null;
    shortDescription: string | null;
    description: string | null;
    mainImageUrl: string | null;
    isActive: boolean;
    displayOrder: number;
    baseDailyRate: { toNumber(): number };
    helmetIncludedCount: number;
    supportsStorageBox: boolean;
    images: Array<{ imageUrl: string }>;
  },
): VehicleListItemDto {
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
    isActive: vehicle.isActive,
    displayOrder: vehicle.displayOrder,
    baseDailyRate: vehicle.baseDailyRate.toNumber(),
    helmetIncludedCount: vehicle.helmetIncludedCount,
    supportsStorageBox: vehicle.supportsStorageBox,
  };
}

export async function getVehicles(filters: GetVehiclesFilters = {}): Promise<GetVehiclesResult> {
  const where: Prisma.VehicleWhereInput = {
    isActive: filters.active ?? true,
  };

  if (filters.type) {
    where.vehicleType = filters.type;
  }

  const vehicles = await prisma.vehicle.findMany({
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
      shortDescription: true,
      description: true,
      mainImageUrl: true,
      isActive: true,
      displayOrder: true,
      baseDailyRate: true,
      helmetIncludedCount: true,
      supportsStorageBox: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          imageUrl: true,
        },
      },
    },
  });

  return {
    vehicles: vehicles.map(mapVehicleListItem),
  };
}
