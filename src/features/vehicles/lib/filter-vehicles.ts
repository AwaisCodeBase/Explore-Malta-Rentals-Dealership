import type {
  Transmission,
  Vehicle,
  VehicleColor,
  VehicleSeatsFilter,
  VehicleType,
} from "@/features/vehicles/data/vehicles";
import {
  parseBrandSearchParam,
  parseCcSearchParam,
  parseColorSearchParam,
  parseSeatsSearchParam,
  parseTransmissionSearchParam,
  parseVehicleTypeSearchParam,
  type EngineCcFilter,
} from "@/features/vehicles/lib/booking-search-params";
import { brandsMatch } from "@/lib/vehicles/brand-utils";
import { colorsMatch } from "@/features/vehicles/lib/vehicle-color";

type FilterVehiclesInput = Readonly<{
  vehicles: readonly Vehicle[];
  type?: VehicleType | "All";
  brand?: string | "All";
  transmission?: Transmission | "All";
  color?: VehicleColor | "All";
  seats?: VehicleSeatsFilter;
  cc?: EngineCcFilter;
}>;

export function filterVehicles({
  vehicles,
  type = "All",
  brand = "All",
  transmission = "All",
  color = "All",
  seats = "All",
  cc = "All",
}: FilterVehiclesInput): Vehicle[] {
  const typeFiltered =
    type === "All" ? vehicles : vehicles.filter((vehicle) => vehicle.type === type);
  const brandFiltered =
    brand === "All"
      ? typeFiltered
      : typeFiltered.filter(
          (vehicle) => vehicle.brand != null && brandsMatch(vehicle.brand, brand),
        );
  const transmissionFiltered =
    transmission === "All"
      ? brandFiltered
      : brandFiltered.filter((vehicle) => vehicle.transmission === transmission);
  const colorFiltered =
    color === "All"
      ? transmissionFiltered
      : transmissionFiltered.filter((vehicle) => {
          if (vehicle.availableColors && vehicle.availableColors.length > 0) {
            return vehicle.availableColors.some((option) => colorsMatch(option.label, color));
          }
          return vehicle.color === color;
        });
  const seatsFiltered =
    seats === "All"
      ? colorFiltered
      : colorFiltered.filter((vehicle) => vehicle.seats === seats);

  if (cc === "All") {
    return [...seatsFiltered];
  }

  return seatsFiltered.filter((vehicle) =>
    cc === "50"
      ? vehicle.engineCc === 50 || /\b50cc\b/i.test(vehicle.engine)
      : vehicle.engineCc === 125 || /\b125cc\b/i.test(vehicle.engine),
  );
}

export function filterVehiclesFromSearchParams(
  vehicles: readonly Vehicle[],
  searchParams: Record<string, string | string[] | undefined>,
): Vehicle[] {
  const typeParam = searchParams.type;
  const brandParam = searchParams.brand;
  const transmissionParam = searchParams.transmission;
  const colorParam = searchParams.color;
  const seatsParam = searchParams.seats;
  const ccParam = searchParams.cc;

  return filterVehicles({
    vehicles,
    type: parseVehicleTypeSearchParam(
      typeof typeParam === "string" ? typeParam : null,
    ),
    brand: parseBrandSearchParam(typeof brandParam === "string" ? brandParam : null),
    transmission: parseTransmissionSearchParam(
      typeof transmissionParam === "string" ? transmissionParam : null,
    ),
    color: parseColorSearchParam(typeof colorParam === "string" ? colorParam : null),
    seats: parseSeatsSearchParam(typeof seatsParam === "string" ? seatsParam : null),
    cc: parseCcSearchParam(typeof ccParam === "string" ? ccParam : null),
  });
}
