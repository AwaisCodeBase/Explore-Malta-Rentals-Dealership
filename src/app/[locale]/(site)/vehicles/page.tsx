import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { BookingSearchFormSkeleton } from "@/features/booking/components/booking-search-form-skeleton";
import { VehicleGridServer } from "@/features/vehicles/components/vehicle-grid-server";
import { VehicleListingShell } from "@/features/vehicles/components/vehicle-listing-shell";
import type { VehicleColor } from "@/features/vehicles/data/vehicles";
import { filterVehiclesFromSearchParams } from "@/features/vehicles/lib/filter-vehicles";
import { getDistinctActiveVehicleBrands } from "@/lib/vehicles/getDistinctActiveVehicleBrands";
import { getInitialVehiclesForListing } from "@/lib/vehicles/getInitialVehiclesForListing";

const BookingSearchFormFromUrl = dynamic(
  () =>
    import("@/features/booking/components/booking-search-form-from-url").then((m) => ({
      default: m.BookingSearchFormFromUrl,
    })),
  {
    loading: () => <BookingSearchFormSkeleton />,
  },
);

type VehiclesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata({ params }: VehiclesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("vehiclesTitle");
  const description = t("vehiclesDescription");
  return {
    title,
    description,
    openGraph: { title, description, locale },
  };
}

export default async function VehiclesPage({ params, searchParams }: VehiclesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = (await searchParams) ?? {};
  const t = await getTranslations({ locale, namespace: "VehiclesPage" });
  const heroIntro = {
    title: t("heroTitle"),
    description: t("heroDescription"),
  } as const;

  const pickupDateRaw = resolvedSearchParams.pickupDate ?? resolvedSearchParams.date;
  const returnDateRaw = resolvedSearchParams.returnDate ?? resolvedSearchParams.dropoffDate;
  const pickupTimeRaw = resolvedSearchParams.pickupTime;
  const returnTimeRaw = resolvedSearchParams.dropoffTime;

  const pickupDate = typeof pickupDateRaw === "string" ? pickupDateRaw.trim() : "";
  const returnDate = typeof returnDateRaw === "string" ? returnDateRaw.trim() : "";
  const pickupTime = typeof pickupTimeRaw === "string" ? pickupTimeRaw.trim() : "";
  const returnTime = typeof returnTimeRaw === "string" ? returnTimeRaw.trim() : "";

  const hasFullRentalWindow =
    pickupDate.length > 0 &&
    returnDate.length > 0 &&
    pickupTime.length > 0 &&
    returnTime.length > 0;

  const rentalWindow = hasFullRentalWindow
    ? { pickupDate, pickupTime, returnDate, returnTime }
    : null;

  const initialVehicles = await getInitialVehiclesForListing(rentalWindow);
  const brandOptions = await getDistinctActiveVehicleBrands();
  const filteredVehicles = filterVehiclesFromSearchParams(
    initialVehicles,
    resolvedSearchParams,
  );

  const listingColorOptions = [
    ...new Set(
      initialVehicles
        .map((vehicle) => vehicle.color)
        .filter((color): color is VehicleColor => color != null),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const bookingHref = rentalWindow
    ? `/booking?${new URLSearchParams({
        date: rentalWindow.pickupDate,
        returnDate: rentalWindow.returnDate,
        pickupTime: rentalWindow.pickupTime,
        dropoffTime: rentalWindow.returnTime,
      }).toString()}`
    : "/booking";

  const detailsDateQuery = rentalWindow
    ? `?${new URLSearchParams({
        pickupDate: rentalWindow.pickupDate,
        returnDate: rentalWindow.returnDate,
        pickupTime: rentalWindow.pickupTime,
        returnTime: rentalWindow.returnTime,
      }).toString()}`
    : "";

  return (
    <main className="flex flex-1 flex-col bg-white">
      <Suspense
        fallback={
          <Container className="pb-16 pt-28 sm:pt-32">
            <div
              className="h-10 max-w-md animate-pulse rounded-md bg-slate-200/70"
              aria-hidden
            />
            <div
              className="mt-4 h-20 max-w-2xl animate-pulse rounded-md bg-slate-200/60"
              aria-hidden
            />
            <div
              className="mt-8 h-72 animate-pulse rounded-2xl bg-slate-100/80"
              aria-hidden
            />
          </Container>
        }
      >
        <VehicleListingShell
          heroIntro={heroIntro}
          vehicles={initialVehicles}
          brandOptions={brandOptions}
          searchPanel={
            <Suspense
              fallback={
                <BookingSearchFormSkeleton />
              }
            >
              <BookingSearchFormFromUrl
                brandOptions={brandOptions}
                vehicleListingFilters
                listingColorOptions={listingColorOptions}
              />
            </Suspense>
          }
        >
          {filteredVehicles.length > 0 ? (
            <VehicleGridServer
              vehicles={filteredVehicles}
              bookingHref={bookingHref}
              detailsDateQuery={detailsDateQuery}
              tripDatesCommitted={hasFullRentalWindow}
              pickupDate={pickupDate || null}
              returnDate={returnDate || null}
              pickupTime={pickupTime || null}
              returnTime={returnTime || null}
            />
          ) : null}
        </VehicleListingShell>
      </Suspense>
    </main>
  );
}
