import { prisma } from "@/lib/prisma";
import { getUnitColorsForVehicle } from "@/lib/vehicle-units/getAvailableColorsForVehicle";

import type { AvailableColorDto, GetVehicleBySlugResult, VehicleDetailDto } from "./types";

function mapVehicleDetail(
  vehicle: {
    id: string;
    name: string;
    slug: string;
    vehicleType: VehicleDetailDto["vehicleType"];
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
    images: VehicleDetailDto["images"];
  },
  availableColors: AvailableColorDto[],
): VehicleDetailDto {
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
    images: vehicle.images.map((image) => ({
      imageUrl: image.imageUrl,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })),
    ...(availableColors.length > 0 ? { availableColors } : {}),
  };
}

export async function getVehicleBySlug(slug: string): Promise<GetVehicleBySlugResult> {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      slug,
      isActive: true,
    },
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
        select: {
          imageUrl: true,
          altText: true,
          sortOrder: true,
          isPrimary: true,
        },
      },
    },
  });

  if (!vehicle) {
    return { vehicle: null };
  }

  const availableColors = await getUnitColorsForVehicle(vehicle.id);

  return {
    vehicle: mapVehicleDetail(vehicle, availableColors),
  };
}
