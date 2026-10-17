import assert from "node:assert/strict";

import type { Vehicle } from "@/features/vehicles/data/vehicles";
import { filterVehicles } from "@/features/vehicles/lib/filter-vehicles";
import {
  brandToUrlParam,
  parseBrandSearchParam,
} from "@/features/vehicles/lib/booking-search-params";
import {
  brandsMatch,
  dedupeBrandLabels,
  resolveBrandFilterLabel,
} from "@/lib/vehicles/brand-utils";

function sampleVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "v1",
    slug: "honda-pcx-red",
    name: "Honda PCX Red",
    type: "Scooter",
    apiVehicleType: "Scooter",
    brand: "Honda",
    model: "PCX",
    shortDescription: null,
    tagline: "Honda PCX",
    description: "Red scooter",
    mainImageUrl: null,
    images: [],
    helmetIncludedCount: 2,
    supportsStorageBox: false,
    pricePerDay: 25,
    baseDailyRate: 25,
    seats: 2,
    transmission: "Automatic",
    fuel: "Petrol",
    color: "Red",
    engineCc: 125,
    engine: "125cc",
    rating: 0,
    reviewCount: 0,
    location: "Pieta, Malta",
    highlights: [],
    features: [],
    addOns: [],
    ...overrides,
  };
}

const vehicles = [
  sampleVehicle(),
  sampleVehicle({
    id: "v2",
    slug: "honda-pcx-black",
    name: "Honda PCX Black",
    color: "Black",
  }),
  sampleVehicle({
    id: "v3",
    slug: "yamaha-nmax",
    name: "Yamaha NMAX",
    brand: "Yamaha",
    model: "NMAX",
    color: "Blue",
  }),
  sampleVehicle({
    id: "v4",
    slug: "inactive-honda",
    name: "Inactive Honda",
    brand: "Honda",
    model: "Inactive",
    color: "Grey",
  }),
];

assert.equal(filterVehicles({ vehicles, brand: "All" }).length, 4);
assert.equal(filterVehicles({ vehicles, brand: "Honda" }).length, 3);
assert.deepEqual(
  filterVehicles({ vehicles, brand: "Honda", color: "Red" }).map((v) => v.slug),
  ["honda-pcx-red"],
);

const deduped = dedupeBrandLabels(["Honda", "honda", " Yamaha ", "", null, "Yamaha"]);
assert.deepEqual(deduped, ["Honda", "Yamaha"]);
assert.equal(brandsMatch("Honda", "honda"), true);

assert.equal(parseBrandSearchParam(null), "All");
assert.equal(parseBrandSearchParam("all"), "All");
assert.equal(parseBrandSearchParam(encodeURIComponent("CFMOTO")), "CFMOTO");
assert.equal(brandToUrlParam("CFMOTO"), "CFMOTO");

assert.equal(
  resolveBrandFilterLabel("honda", ["Honda", "Yamaha"]),
  "Honda",
);
assert.equal(
  resolveBrandFilterLabel("Unknown", ["Honda", "Yamaha"]),
  "Unknown",
);

console.log("filter-vehicles brand tests passed");
