import type { AdminVehicleUnitDto } from "@/lib/admin/vehicle-units/types";
import { isAssignableVehicleUnit } from "@/lib/vehicle-units";
import { prisma } from "@/lib/prisma";

function mapUnit(unit: {
  id: string;
  vehicleId: string;
  licensePlate: string;
  color: string | null;
  status: AdminVehicleUnitDto["status"];
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminVehicleUnitDto {
  return {
    id: unit.id,
    vehicleId: unit.vehicleId,
    licensePlate: unit.licensePlate,
    color: unit.color,
    status: unit.status,
    isActive: unit.isActive,
    notes: unit.notes,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString(),
  };
}

export async function listAdminVehicleUnits(vehicleId: string): Promise<AdminVehicleUnitDto[]> {
  const units = await prisma.vehicleUnit.findMany({
    where: { vehicleId },
    orderBy: [{ createdAt: "asc" }, { licensePlate: "asc" }],
    select: {
      id: true,
      vehicleId: true,
      licensePlate: true,
      color: true,
      status: true,
      isActive: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return units.map(mapUnit);
}

export async function getAdminVehicleUnitCounts(vehicleId: string) {
  const units = await prisma.vehicleUnit.findMany({
    where: { vehicleId },
    select: { isActive: true, status: true },
  });

  return {
    totalUnits: units.length,
    availableUnits: units.filter(isAssignableVehicleUnit).length,
  };
}

export async function getAdminVehicleUnitCountsByVehicleIds(
  vehicleIds: string[],
): Promise<Map<string, { totalUnits: number; availableUnits: number }>> {
  if (vehicleIds.length === 0) {
    return new Map();
  }

  const units = await prisma.vehicleUnit.findMany({
    where: { vehicleId: { in: vehicleIds } },
    select: { vehicleId: true, isActive: true, status: true },
  });

  const out = new Map<string, { totalUnits: number; availableUnits: number }>();
  for (const vehicleId of vehicleIds) {
    out.set(vehicleId, { totalUnits: 0, availableUnits: 0 });
  }

  for (const unit of units) {
    const current = out.get(unit.vehicleId) ?? { totalUnits: 0, availableUnits: 0 };
    current.totalUnits += 1;
    if (isAssignableVehicleUnit(unit)) {
      current.availableUnits += 1;
    }
    out.set(unit.vehicleId, current);
  }

  return out;
}
