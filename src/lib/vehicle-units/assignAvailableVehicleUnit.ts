import type { Prisma } from "@/generated/prisma/index";

import { findAvailableVehicleUnits } from "@/lib/vehicle-units/findAvailableVehicleUnits";
import type { AssignVehicleUnitInput, AssignVehicleUnitResult } from "@/lib/vehicle-units/types";

export class NoAvailableVehicleUnitError extends Error {
  readonly color?: string;

  constructor(message = "No physical vehicle unit is available for the selected dates", color?: string) {
    super(message);
    this.name = "NoAvailableVehicleUnitError";
    this.color = color;
  }
}

export async function assignAvailableVehicleUnit(
  input: AssignVehicleUnitInput,
  db: Prisma.TransactionClient,
): Promise<AssignVehicleUnitResult> {
  const availableUnits = await findAvailableVehicleUnits(input, db);

  const selected = availableUnits[0];
  if (!selected) {
    const message = input.color
      ? `No ${input.color} unit is available for the selected dates`
      : "No physical vehicle unit is available for the selected dates";
    throw new NoAvailableVehicleUnitError(message, input.color);
  }

  return {
    vehicleUnitId: selected.id,
    licensePlate: selected.licensePlate,
    color: selected.color,
  };
}
