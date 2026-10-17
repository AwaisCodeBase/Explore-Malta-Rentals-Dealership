import { mapVehicleListItemToVehicle, type Vehicle } from "@/features/vehicles/data/vehicles";
import { enrichVehicleListWithRentalWindow } from "@/lib/vehicles/enrichVehicleListWithRentalWindow";
import { getVehicles } from "@/lib/vehicles";
import { isBookableRentalWindowStatus } from "@/lib/vehicles/types";

export type RentalWindowParams = Readonly<{
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}>;

const AVAILABILITY_ENRICH_TIMEOUT_MS = 12_000;

export async function getInitialVehiclesForListing(
  rentalWindow?: RentalWindowParams | null,
): Promise<Vehicle[]> {
  const result = await getVehicles();
  let listItems = result.vehicles;

  if (rentalWindow) {
    const enrichPromise = enrichVehicleListWithRentalWindow(listItems, rentalWindow);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Availability check timed out")), AVAILABILITY_ENRICH_TIMEOUT_MS),
    );

    try {
      const enriched = await Promise.race([enrichPromise, timeoutPromise]);
      listItems = enriched.filter((vehicle) =>
        isBookableRentalWindowStatus(vehicle.rentalWindowStatus),
      );
    } catch (error) {
      console.warn(
        "[vehicles] Availability enrichment failed, returning unenriched list",
        error,
      );
    }
  }

  return listItems.map(mapVehicleListItemToVehicle);
}
