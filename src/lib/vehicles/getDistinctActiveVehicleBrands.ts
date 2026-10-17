import { dedupeBrandLabels } from "@/lib/vehicles/brand-utils";
import { prisma } from "@/lib/prisma";

export async function getDistinctActiveVehicleBrands(): Promise<string[]> {
  const rows = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      brand: { not: null },
      NOT: { brand: "" },
    },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });

  return dedupeBrandLabels(rows.map((row) => row.brand));
}
