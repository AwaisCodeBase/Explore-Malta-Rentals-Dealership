import { getTranslations } from "next-intl/server";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { Vehicle } from "@/features/vehicles/data/vehicles";
import { VehicleCardServer } from "@/features/vehicles/components/vehicle-card-server";
import {
  groupVehiclesByEngineCc,
  vehicleListingItemClass,
  vehicleListingTrackClass,
  type EngineCcGroupId,
} from "@/features/vehicles/lib/vehicle-listing-layout";

type VehicleGridServerProps = Readonly<{
  vehicles: readonly Vehicle[];
  bookingHref?: string;
  detailsDateQuery?: string;
  tripDatesCommitted?: boolean;
  pickupDate?: string | null;
  returnDate?: string | null;
  pickupTime?: string | null;
  returnTime?: string | null;
}>;

function groupTitleKey(id: EngineCcGroupId): "group50" | "group125" | "groupOther" {
  if (id === "50") return "group50";
  if (id === "125") return "group125";
  return "groupOther";
}

export async function VehicleGridServer({
  vehicles,
  bookingHref = "/booking",
  detailsDateQuery = "",
  tripDatesCommitted = false,
  pickupDate,
  returnDate,
  pickupTime,
  returnTime,
}: VehicleGridServerProps) {
  const t = await getTranslations("VehicleListing");
  const groups = groupVehiclesByEngineCc(vehicles);
  let imagePriorityBudget = 2;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {groups.map((group) => {
        const headingId = `vehicle-group-${group.id}`;
        return (
          <section
            key={group.id}
            aria-labelledby={headingId}
            className="min-w-0"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3 sm:mb-4">
              <h2
                id={headingId}
                className="text-base font-semibold tracking-[-0.02em] text-[var(--ink-950)] sm:text-lg"
              >
                {t(groupTitleKey(group.id))}
              </h2>
              <p className="text-xs font-medium tabular-nums text-[var(--text-muted)] sm:text-sm">
                {t("groupCount", { count: group.vehicles.length })}
              </p>
            </div>
            <Stagger className={vehicleListingTrackClass} step={0.06}>
              {group.vehicles.map((vehicle) => {
                const priorityImage = imagePriorityBudget > 0;
                if (priorityImage) imagePriorityBudget -= 1;
                return (
                  <StaggerItem
                    key={vehicle.slug}
                    className={vehicleListingItemClass}
                    y={18}
                  >
                    <VehicleCardServer
                      vehicle={vehicle}
                      bookingHref={bookingHref}
                      detailsHref={`/vehicles/${vehicle.slug}${detailsDateQuery}`}
                      tripDatesCommitted={tripDatesCommitted}
                      pickupDate={pickupDate}
                      returnDate={returnDate}
                      pickupTime={pickupTime}
                      returnTime={returnTime}
                      priorityImage={priorityImage}
                    />
                  </StaggerItem>
                );
              })}
            </Stagger>
          </section>
        );
      })}
    </div>
  );
}
