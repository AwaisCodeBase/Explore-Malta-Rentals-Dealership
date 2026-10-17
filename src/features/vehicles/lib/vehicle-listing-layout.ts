import type { Vehicle } from "@/features/vehicles/data/vehicles";
import type { EngineCcValue } from "@/lib/vehicles/engine-cc";

/** Mobile: horizontal swipe track. sm+: standard responsive grid. */
export const vehicleListingTrackClass =
  "flex items-stretch gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:x_mandatory] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 sm:[scroll-snap-type:none] xl:grid-cols-3";

export const vehicleListingItemClass =
  "h-full w-[min(85vw,19.5rem)] shrink-0 snap-start sm:w-auto sm:min-w-0 sm:shrink";

export type EngineCcGroupId = "50" | "125" | "other";

export type EngineCcVehicleGroup = Readonly<{
  id: EngineCcGroupId;
  engineCc: EngineCcValue | null;
  vehicles: readonly Vehicle[];
}>;

/** Prefer 50cc then 125cc rows; leftover types (ATV/bike/unknown) last. */
export function groupVehiclesByEngineCc(
  vehicles: readonly Vehicle[],
): EngineCcVehicleGroup[] {
  const by50: Vehicle[] = [];
  const by125: Vehicle[] = [];
  const other: Vehicle[] = [];

  for (const vehicle of vehicles) {
    if (vehicle.engineCc === 50) {
      by50.push(vehicle);
    } else if (vehicle.engineCc === 125) {
      by125.push(vehicle);
    } else {
      other.push(vehicle);
    }
  }

  const groups: EngineCcVehicleGroup[] = [];
  if (by50.length > 0) {
    groups.push({ id: "50", engineCc: 50, vehicles: by50 });
  }
  if (by125.length > 0) {
    groups.push({ id: "125", engineCc: 125, vehicles: by125 });
  }
  if (other.length > 0) {
    groups.push({ id: "other", engineCc: null, vehicles: other });
  }
  return groups;
}
