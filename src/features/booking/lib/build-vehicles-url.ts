import type { BookingFormValues } from "@/features/booking/lib/booking-schema";
import { BOOKING_SHOP_LABEL } from "@/features/booking/lib/booking-schema";
import {
  brandToUrlParam,
  parseTransmissionSearchParam,
  seatsFilterToUrlParam,
  transmissionToUrlParam,
  vehicleColorToUrlParam,
} from "@/features/vehicles/lib/booking-search-params";
import type { VehicleColor, VehicleSeatsFilter } from "@/features/vehicles/data/vehicles";

function buildPickupLabel(values: BookingFormValues): string {
  if (values.alternatePickupRequested && values.alternatePickupAddress?.trim()) {
    return `${BOOKING_SHOP_LABEL} · Off-site pickup: ${values.alternatePickupAddress.trim()}`;
  }
  return BOOKING_SHOP_LABEL;
}

function buildDropoffLabel(values: BookingFormValues): string {
  if (!values.differentDropoff) {
    return buildPickupLabel(values);
  }
  return values.dropoffAddress?.trim() ?? BOOKING_SHOP_LABEL;
}

export function buildVehiclesSearchUrl(values: BookingFormValues): string {
  const pickupLabel = buildPickupLabel(values);
  const dropLabel = buildDropoffLabel(values);

  const params = new URLSearchParams({
    pickupLocation: pickupLabel,
    dropoffLocation: dropLabel,
    pickupDate: values.pickupDate,
    returnDate: values.dropoffDate,
    pickupTime: values.pickupTime,
    dropoffTime: values.dropoffTime,
    differentDropoff: values.differentDropoff ? "1" : "0",
    alternatePickup: values.alternatePickupRequested ? "1" : "0",
  });

  const type = values.vehicleType?.trim();
  if (type && type !== "all") {
    params.set("type", type);
  }

  const brand = values.brand?.trim();
  if (brand && brand !== "all") {
    params.set("brand", brandToUrlParam(brand));
  }

  const transmissionRaw = values.transmission?.trim().toLowerCase();
  if (transmissionRaw && transmissionRaw !== "all") {
    const transmission = parseTransmissionSearchParam(transmissionRaw);
    if (transmission !== "All") {
      params.set("transmission", transmissionToUrlParam(transmission));
    }
  }

  const seatsRaw = values.seats?.trim().toLowerCase();
  if (seatsRaw && seatsRaw !== "all") {
    const seats: VehicleSeatsFilter =
      seatsRaw === "1" ? 1 : seatsRaw === "2" ? 2 : seatsRaw === "3" ? 3 : "All";
    if (seats !== "All") {
      params.set("seats", seatsFilterToUrlParam(seats));
    }
  }

  const colorRaw = values.color?.trim().toLowerCase();
  if (colorRaw && colorRaw !== "all") {
    const colorLabels: Record<string, VehicleColor> = {
      black: "Black",
      white: "White",
      grey: "Grey",
      gray: "Grey",
      red: "Red",
      blue: "Blue",
      silver: "Silver",
      orange: "Orange",
      green: "Green",
      cream: "Cream",
    };
    const color = colorLabels[colorRaw];
    if (color) {
      params.set("color", vehicleColorToUrlParam(color));
    }
  }

  return `/vehicles?${params.toString()}`;
}
