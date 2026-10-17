import type { ReactNode } from "react";

import { ArrowLeft, Pencil } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { AdminVehicleBookingCalendar } from "@/features/admin/components/admin-vehicle-booking-calendar";
import { AdminVehicleUnitsPanel } from "@/features/admin/components/admin-vehicle-units-panel";
import type { AdminVehicleDetail } from "@/lib/admin/vehicles/types";
import type { AdminVehicleBookingCalendarItem } from "@/lib/admin/vehicles/getAdminVehicleBookingsForCalendar";
import {
  buildDurationPricingPreview,
  roundPricingAmount,
} from "@/lib/pricing/duration-pricing";

type AdminVehicleDetailViewProps = Readonly<{
  locale: string;
  vehicle: AdminVehicleDetail;
  bookings: AdminVehicleBookingCalendarItem[];
}>;

function formatPrice(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `€${value.toFixed(2)}`;
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailField({
  label,
  value,
  className,
}: Readonly<{ label: string; value: ReactNode; className?: string }>) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export async function AdminVehicleDetailView({
  locale,
  vehicle,
  bookings,
}: AdminVehicleDetailViewProps) {
  const t = await getTranslations({ locale, namespace: "Admin.vehicles" });
  const durationPreview = buildDurationPricingPreview(vehicle.baseDailyRate);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <a
            href={`/${locale}/admin/vehicles`}
            className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-[#3a7ca5]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("details.backToList")}
          </a>
          <h2 className="border-t border-slate-200/80 pt-4 text-lg font-bold text-slate-950">
            {t("details.title", { name: vehicle.name })}
          </h2>
        </div>
        <a
          href={`/${locale}/admin/vehicles/${vehicle.id}/edit`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#3a7ca5]/30 hover:text-[#3a7ca5]"
        >
          <Pencil className="size-4" aria-hidden />
          {t("table.edit")}
        </a>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-6 p-5 lg:grid-cols-2 lg:gap-8">
          <div className="min-w-0">
            <div className="flex flex-col gap-5">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                {vehicle.mainImageUrl ? (
                  <Image
                    src={vehicle.mainImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-sm font-semibold text-slate-400">
                    {t("form.noImage")}
                  </div>
                )}
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField label={t("form.name")} value={vehicle.name} className="sm:col-span-2" />
                <DetailField label={t("form.slug")} value={vehicle.slug} />
                <DetailField label={t("form.vehicleType")} value={t(`vehicleTypes.${vehicle.vehicleType}`)} />
                <DetailField
                  label={t("form.engineCc")}
                  value={
                    vehicle.engineCc === 50
                      ? t("form.engineCc50")
                      : vehicle.engineCc === 125
                        ? t("form.engineCc125")
                        : "—"
                  }
                />
                <DetailField
                  label={t("table.totalUnits")}
                  value={t("units.counts", { total: vehicle.totalUnits, available: vehicle.availableUnits })}
                />
                <DetailField label={t("form.brand")} value={vehicle.brand ?? "—"} />
                <DetailField label={t("form.model")} value={vehicle.model ?? "—"} />
                <DetailField label={t("form.color")} value={vehicle.color ?? "—"} />
                <DetailField label={t("form.catalogStatus")} value={t(`catalogStatus.${vehicle.catalogStatus}`)} />
                <DetailField
                  label={t("form.isActive")}
                  value={vehicle.isActive ? t("table.visible") : t("table.hidden")}
                />
                <DetailField label={t("form.displayOrder")} value={vehicle.displayOrder} />
                <DetailField
                  label={t("table.bookingCount", { count: vehicle.bookingCount })}
                  value={vehicle.bookingCount}
                />
              </dl>
            </div>
          </div>

          <div className="min-w-0 lg:border-l lg:border-slate-100 lg:pl-8">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-950">{t("details.calendar.title")}</h3>
              <p className="mt-1 text-sm text-slate-600">{t("details.calendar.subtitle")}</p>
            </div>
            <AdminVehicleBookingCalendar bookings={bookings} />
          </div>
        </div>
      </section>

      {(vehicle.shortDescription || vehicle.description) && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-950">{t("form.sections.description")}</h3>
          <dl className="mt-4 grid gap-4">
            {vehicle.shortDescription ? (
              <DetailField label={t("form.shortDescription")} value={vehicle.shortDescription} />
            ) : null}
            {vehicle.description ? (
              <DetailField
                label={t("form.description")}
                value={<span className="whitespace-pre-wrap font-normal leading-relaxed">{vehicle.description}</span>}
              />
            ) : null}
          </dl>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-950">{t("form.sections.features")}</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailField label={t("form.helmetIncludedCount")} value={vehicle.helmetIncludedCount} />
          <DetailField
            label={t("form.supportsStorageBox")}
            value={vehicle.supportsStorageBox ? t("details.yes") : t("details.no")}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-950">{t("form.sections.pricing")}</h3>
        <p className="mt-1 text-xs text-slate-600">{t("form.pricingFlatTierNote")}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label={t("form.baseDailyRate")} value={formatPrice(vehicle.baseDailyRate)} />
        </dl>
        {durationPreview.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {durationPreview.map((row) => (
              <li key={`${row.minDays}-${row.maxDays ?? "plus"}`}>
                {row.label}: {row.discountPercent}% {t("form.discountOff")} → €{roundPricingAmount(row.appliedDailyRate).toFixed(2)}/day
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {vehicle.images.length > 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-950">{t("form.sections.images")}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {vehicle.images.map((image) => (
              <div key={image.id ?? image.imageUrl} className="overflow-hidden rounded-xl border border-slate-100">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image src={image.imageUrl} alt={image.altText ?? ""} fill sizes="240px" className="object-cover" />
                </div>
                <div className="px-3 py-2 text-xs text-slate-600">
                  {image.isPrimary ? (
                    <span className="font-semibold text-[#3a7ca5]">{t("form.primary")}</span>
                  ) : (
                    <span>{image.altText || t("form.imageUrl")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <AdminVehicleUnitsPanel vehicleId={vehicle.id} initialUnits={vehicle.units} />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-950">{t("details.metadata")}</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailField label={t("details.createdAt")} value={formatDate(vehicle.createdAt, locale)} />
          <DetailField label={t("details.updatedAt")} value={formatDate(vehicle.updatedAt, locale)} />
        </dl>
      </section>
    </div>
  );
}
