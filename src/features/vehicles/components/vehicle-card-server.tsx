import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatVehicleTypeLabel, type Vehicle } from "@/features/vehicles/data/vehicles";
import { BookNowButton } from "@/features/vehicles/components/book-now-button";
import { buildBookingUrlWithVehicle } from "@/features/vehicles/lib/build-booking-url-with-vehicle";

type VehicleCardServerProps = Readonly<{
  vehicle: Vehicle;
  bookingHref?: string;
  detailsHref?: string;
  tripDatesCommitted?: boolean;
  pickupDate?: string | null;
  returnDate?: string | null;
  pickupTime?: string | null;
  returnTime?: string | null;
  priorityImage?: boolean;
}>;

/* Keep these class strings in sync with the client `VehicleCard` — both render the same card. */
const photoPlateClass =
  "relative aspect-[4/3] overflow-hidden bg-white";

const floatingChipClass =
  "type-spec absolute left-2.5 top-2.5 inline-flex items-center rounded-md border border-white/60 bg-white/85 px-2 py-1 text-[var(--ink-800)] shadow-sm backdrop-blur-md sm:left-3 sm:top-3 sm:rounded-full sm:px-2.5 sm:py-1.5";

const statusChipClass =
  "type-spec absolute right-2.5 top-2.5 inline-flex items-center rounded-md px-2 py-1 shadow-sm sm:right-3 sm:top-3 sm:rounded-full sm:px-2.5 sm:py-1.5";

const specRibbonClass =
  "mt-2.5 grid grid-cols-2 divide-x divide-[var(--line-subtle)] border-y border-[var(--line-subtle)] sm:mt-4";

const specCellClass =
  "type-spec flex items-center py-1.5 text-[var(--text-muted)] sm:py-2.5";

const ghostActionClass =
  "inline-flex min-h-9 flex-1 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-card)] px-2.5 text-[0.8125rem] font-semibold text-[var(--ink-800)] transition-[background-color,border-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink-950)] active:scale-[0.985] sm:min-h-10 sm:rounded-[var(--r-field)] sm:px-3";

const primaryActionClass =
  "inline-flex min-h-9 w-full items-center justify-center rounded-md bg-[var(--orange-400)] px-2.5 text-[0.8125rem] font-semibold text-[var(--ink-950)] shadow-[var(--elev-orange)] transition-[background-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:bg-[var(--orange-500)] hover:shadow-[var(--elev-orange-lift)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none sm:min-h-10 sm:rounded-[var(--r-field)] sm:px-3";

const primaryActionBusyClass =
  "inline-flex min-h-9 w-full cursor-not-allowed items-center justify-center rounded-md bg-[var(--orange-300)] px-2.5 text-[0.8125rem] font-semibold text-[var(--ink-950)] opacity-90 transition-colors duration-[var(--dur-fast)] sm:min-h-10 sm:rounded-[var(--r-field)] sm:px-3";

const disabledActionClass =
  "inline-flex min-h-9 flex-1 cursor-not-allowed items-center justify-center rounded-md border border-[var(--line-subtle)] bg-[var(--surface-sunken)] px-2.5 text-[0.8125rem] font-semibold text-[var(--text-faint)] sm:min-h-10 sm:rounded-[var(--r-field)] sm:px-3";

export async function VehicleCardServer({
  vehicle,
  bookingHref = "/booking",
  detailsHref,
  tripDatesCommitted = true,
  pickupDate,
  returnDate,
  pickupTime,
  returnTime,
  priorityImage = false,
}: VehicleCardServerProps) {
  const t = await getTranslations("VehicleCard");
  const mainImage = vehicle.mainImageUrl ?? vehicle.images[0] ?? null;
  const brandModel = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
  const status = vehicle.rentalWindowStatus;
  const completeBookingHref = buildBookingUrlWithVehicle(bookingHref, vehicle.slug);

  return (
    <article className="surface-card lift group flex h-full flex-col overflow-hidden">
      <div className={photoPlateClass}>
        {mainImage ? (
          <Image
            src={mainImage}
            alt={vehicle.name}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1280px) 50vw, 33vw"
            className="object-contain object-center p-2 transition-transform duration-[var(--dur-slower)] ease-[var(--ease-out-expo)] will-change-transform motion-safe:group-hover:scale-[1.03] sm:p-3"
            priority={priorityImage}
            loading={priorityImage ? undefined : "lazy"}
          />
        ) : (
          <div className="type-spec flex h-full items-center justify-center px-6 text-center text-[var(--text-faint)]">
            {t("imageSoon")}
          </div>
        )}
        <span className={floatingChipClass}>
          {formatVehicleTypeLabel(vehicle.apiVehicleType)}
        </span>
        {status === "reserved_other" ? (
          <span
            className={`${statusChipClass} bg-[var(--orange-400)] text-[var(--ink-950)]`}
          >
            {t("reserved")}
          </span>
        ) : null}
        {status === "reserved_you" ? (
          <span className={`${statusChipClass} bg-emerald-600 text-white`}>
            {t("yourHold")}
          </span>
        ) : null}
        {status === "unavailable" ? (
          <span
            className={`${statusChipClass} bg-[var(--surface-inverse)] text-white`}
          >
            {t("unavailable")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <div>
          <h3 className="text-[0.95rem] font-semibold leading-snug tracking-[-0.025em] text-[var(--ink-950)] sm:text-[1.0625rem]">
            {vehicle.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[0.75rem] leading-snug text-[var(--text-secondary)] sm:mt-1.5 sm:text-[0.8125rem] sm:leading-relaxed">
            {vehicle.shortDescription ?? vehicle.tagline}
          </p>
          {brandModel ? (
            <p className="mt-1 text-xs font-medium text-[var(--text-faint)] sm:mt-2">{brandModel}</p>
          ) : null}
          {status === "reserved_you" ? (
            <p className="mt-2 rounded-[var(--r-field)] bg-emerald-50 px-2.5 py-1.5 text-xs font-medium leading-relaxed text-emerald-900 sm:mt-3 sm:px-3 sm:py-2">
              {t("holdNotice")}
            </p>
          ) : null}
          {status === "reserved_other" ? (
            <p className="mt-2 rounded-[var(--r-field)] bg-[var(--orange-50)] px-2.5 py-1.5 text-xs font-medium leading-relaxed text-[var(--orange-900)] sm:mt-3 sm:px-3 sm:py-2">
              {t("reservedOtherNotice")}
            </p>
          ) : null}
          {status === "unavailable" ? (
            <p className="mt-2 rounded-[var(--r-field)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs font-medium leading-relaxed text-[var(--text-secondary)] sm:mt-3 sm:px-3 sm:py-2">
              {t("unavailableWindow")}
            </p>
          ) : null}
        </div>

        <ul className={specRibbonClass}>
          <li className={`${specCellClass} pr-3`}>
            {t("helmetsInline", { count: vehicle.helmetIncludedCount })}
          </li>
          <li className={`${specCellClass} pl-3`}>
            {vehicle.supportsStorageBox ? t("storageYes") : t("storageNo")}
          </li>
        </ul>

        <div className="mt-auto pt-3 sm:pt-4">
          {vehicle.pricePerDay > 0 ? (
            <p
              data-numeric
              className="text-[1.125rem] font-bold leading-none tracking-[-0.035em] text-[var(--ink-950)] sm:text-[1.3125rem]"
            >
              {t("fromPerDay", { price: vehicle.pricePerDay })}
            </p>
          ) : (
            <p className="text-sm font-semibold text-[var(--text-muted)]">
              {t("priceOnRequest")}
            </p>
          )}

          <div className="mt-2.5 flex items-stretch gap-2 sm:mt-4">
            <Link
              href={detailsHref ?? `/vehicles/${vehicle.slug}`}
              className={ghostActionClass}
            >
              {t("viewDetails")}
            </Link>
            {status === "reserved_you" ? (
              <Link
                href={completeBookingHref}
                className={`${primaryActionClass} flex-1`}
              >
                {t("completeBooking")}
              </Link>
            ) : status === "reserved_other" || status === "unavailable" ? (
              <span aria-disabled className={disabledActionClass}>
                {status === "reserved_other" ? t("onHold") : t("unavailableShort")}
              </span>
            ) : (
              <BookNowButton
                vehicle={vehicle}
                bookingHref={bookingHref}
                tripDatesCommitted={tripDatesCommitted}
                pickupDate={pickupDate}
                returnDate={returnDate}
                pickupTime={pickupTime}
                returnTime={returnTime}
                className={primaryActionClass}
                busyClassName={primaryActionBusyClass}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
