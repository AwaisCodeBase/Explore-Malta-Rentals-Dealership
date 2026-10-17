"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StepShell } from "@/features/booking-flow/components/step-shell";
import { useBookingFlow } from "@/features/booking-flow/context/booking-flow-context";
import { formatVehicleTypeLabel } from "@/features/vehicles/data/vehicles";
import { useVehicle, useVehicles } from "@/features/vehicles/lib/use-vehicles";

/** Hairline ghost link used by the empty / error states. */
const ghostLinkClass =
  "mt-4 inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

function VehicleSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--r-card)] border border-[var(--line-subtle)] bg-[var(--surface-card)] shadow-[var(--elev-1)]">
      <div className="skeleton h-48 sm:h-56" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-5 w-2/3 rounded-md" />
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-11/12 rounded-md" />
      </div>
    </div>
  );
}

export function SelectVehicleStep() {
  const t = useTranslations("BookingSteps.selectVehicle");
  const { state, reservationHold, updateSection, getFieldError, getBookingValues } = useBookingFlow();
  const incomingSlug = state.rental.vehicleSlug?.trim() ?? "";

  const rentalWindow = useMemo(() => {
    const { pickupDate, pickupTime, returnDate, returnTime } = state.rental;
    if (!pickupDate.trim() || !pickupTime.trim() || !returnDate.trim() || !returnTime.trim()) {
      return null;
    }
    return {
      pickupDate: pickupDate.trim(),
      pickupTime: pickupTime.trim(),
      returnDate: returnDate.trim(),
      returnTime: returnTime.trim(),
      sessionKey: reservationHold.sessionKey?.trim() || undefined,
    };
  }, [
    reservationHold.sessionKey,
    state.rental.pickupDate,
    state.rental.pickupTime,
    state.rental.returnDate,
    state.rental.returnTime,
  ]);

  const { vehicles, isLoading, error } = useVehicles({ rentalWindow });

  const selectedVehicle = useMemo(() => {
    if (!state.rental.vehicleId) {
      return null;
    }
    return vehicles.find((vehicle) => vehicle.id === state.rental.vehicleId) ?? null;
  }, [state.rental.vehicleId, vehicles]);

  // Detail endpoint includes the full image gallery; list only returns the main image.
  const detailSlug = incomingSlug || selectedVehicle?.slug || "";
  const {
    vehicle: slugVehicle,
    isLoading: slugVehicleLoading,
    error: slugVehicleError,
  } = useVehicle(detailSlug);
  const vehicleError = getFieldError("rental.vehicleType");

  const displayVehicle = selectedVehicle ?? slugVehicle;

  const galleryImages = useMemo(() => {
    if (!displayVehicle) {
      return [] as string[];
    }

    const detailMatches =
      slugVehicle &&
      (slugVehicle.id === displayVehicle.id || slugVehicle.slug === displayVehicle.slug);

    const fromDetail = detailMatches ? slugVehicle.images : [];
    const fromList = displayVehicle.images;
    const fallback = displayVehicle.mainImageUrl ? [displayVehicle.mainImageUrl] : [];
    const source =
      fromDetail.length > 0 ? fromDetail : fromList.length > 0 ? fromList : fallback;

    return Array.from(new Set(source.filter(Boolean)));
  }, [displayVehicle, slugVehicle]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    setActiveImageIdx(0);
  }, [displayVehicle?.id, galleryImages]);

  const showGalleryNav = galleryImages.length > 1;
  const selectedVehicleImageSrc = galleryImages[activeImageIdx] ?? galleryImages[0] ?? null;

  const goToPrevImage = useCallback(() => {
    setActiveImageIdx((i) => (i === 0 ? galleryImages.length - 1 : i - 1));
  }, [galleryImages.length]);

  const goToNextImage = useCallback(() => {
    setActiveImageIdx((i) => (i === galleryImages.length - 1 ? 0 : i + 1));
  }, [galleryImages.length]);

  const selectedVehicleBrandModel = displayVehicle
    ? [displayVehicle.brand, displayVehicle.model].filter(Boolean).join(" ")
    : "";

  const holdIsOnSelectedVehicle =
    reservationHold.status === "ACTIVE" &&
    reservationHold.holdReference !== null &&
    reservationHold.vehicleId !== null &&
    (reservationHold.vehicleId === state.rental.vehicleId ||
      reservationHold.vehicleId === displayVehicle?.id);

  useEffect(() => {
    if (vehicles.length === 0) {
      return;
    }

    const slug = state.rental.vehicleSlug?.trim();
    const rentalId = state.rental.vehicleId;
    const holdId = reservationHold.vehicleId;

    const bySlug = slug ? vehicles.find((vehicle) => vehicle.slug === slug) : undefined;
    const byRentalId = rentalId ? vehicles.find((vehicle) => vehicle.id === rentalId) : undefined;
    const byHoldId = holdId ? vehicles.find((vehicle) => vehicle.id === holdId) : undefined;
    const resolved = bySlug ?? byRentalId ?? byHoldId;

    if (!resolved) {
      return;
    }

    if (
      rentalId !== resolved.id ||
      slug !== resolved.slug ||
      state.rental.vehicleName !== resolved.name ||
      state.rental.vehicleType !== resolved.apiVehicleType ||
      state.rental.engineCc !== resolved.engineCc
    ) {
      updateSection("rental", {
        vehicleId: resolved.id,
        vehicleSlug: resolved.slug,
        vehicleName: resolved.name,
        vehicleLicensePlate: "",
        vehicleType: resolved.apiVehicleType,
        engineCc: resolved.engineCc,
      });
      if (!resolved.supportsStorageBox && getBookingValues().addons.storageBox) {
        updateSection("addons", { storageBox: false });
      }
    }
  }, [
    getBookingValues,
    reservationHold.vehicleId,
    state.rental.vehicleId,
    state.rental.vehicleName,
    state.rental.vehicleSlug,
    state.rental.vehicleType,
    state.rental.engineCc,
    updateSection,
    vehicles,
  ]);

  useEffect(() => {
    if (!slugVehicle) {
      return;
    }

    const rentalId = state.rental.vehicleId;
    const slug = state.rental.vehicleSlug?.trim();
    if (
      rentalId === slugVehicle.id &&
      slug === slugVehicle.slug &&
      state.rental.vehicleName === slugVehicle.name &&
      state.rental.vehicleType === slugVehicle.apiVehicleType &&
      state.rental.engineCc === slugVehicle.engineCc
    ) {
      return;
    }

    updateSection("rental", {
      vehicleId: slugVehicle.id,
      vehicleSlug: slugVehicle.slug,
      vehicleName: slugVehicle.name,
      vehicleLicensePlate: "",
      vehicleType: slugVehicle.apiVehicleType,
      engineCc: slugVehicle.engineCc,
    });
    if (!slugVehicle.supportsStorageBox && getBookingValues().addons.storageBox) {
      updateSection("addons", { storageBox: false });
    }
  }, [
    getBookingValues,
    slugVehicle,
    state.rental.vehicleId,
    state.rental.vehicleName,
    state.rental.vehicleSlug,
    state.rental.vehicleType,
    state.rental.engineCc,
    updateSection,
  ]);

  const slugNotFound =
    !isLoading &&
    !slugVehicleLoading &&
    !error &&
    !slugVehicleError &&
    vehicles.length > 0 &&
    Boolean(incomingSlug) &&
    !state.rental.vehicleId &&
    !displayVehicle &&
    !vehicles.some((v) => v.slug === state.rental.vehicleSlug);

  const staleVehicleId =
    !isLoading &&
    !slugVehicleLoading &&
    !error &&
    !slugVehicleError &&
    vehicles.length > 0 &&
    Boolean(state.rental.vehicleId) &&
    !displayVehicle &&
    !(reservationHold.status === "ACTIVE" && reservationHold.vehicleId);

  const needsVehicleFromFleet =
    !isLoading &&
    !slugVehicleLoading &&
    !error &&
    vehicles.length > 0 &&
    !incomingSlug &&
    !state.rental.vehicleId &&
    !displayVehicle;

  return (
    <StepShell title={t("title")} description={t("description")}>
      {isLoading || slugVehicleLoading ? (
        <VehicleSkeleton />
      ) : error ? (
        <div className="rounded-[var(--r-card)] border border-red-200 bg-red-50/70 p-4 sm:p-5">
          <p className="text-sm font-semibold tracking-[-0.01em] text-red-900">
            {t("loadErrorTitle")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-red-800">{error}</p>
          <Link
            href="/vehicles"
            className={`${ghostLinkClass} border-red-300 bg-[var(--surface-card)] text-red-900 hover:bg-red-100`}
          >
            {t("browseFleet")}
          </Link>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-sunken)] p-4 sm:p-5">
          <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {t("emptyTitle")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{t("emptyBody")}</p>
        </div>
      ) : needsVehicleFromFleet ? (
        <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-sunken)] p-4 sm:p-5">
          <p className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {t("noneSelectedTitle")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
            {t("noneSelectedBodyLong")}
          </p>
          <Link
            href="/vehicles"
            className={`${ghostLinkClass} border-[var(--line-strong)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-[var(--elev-1)] hover:shadow-[var(--elev-2)]`}
          >
            {t("browseFleet")}
          </Link>
        </div>
      ) : slugNotFound || staleVehicleId ? (
        <div className="rounded-[var(--r-card)] border border-amber-200 bg-amber-50/80 p-4 sm:p-5">
          <p className="text-sm font-semibold tracking-[-0.01em] text-amber-900">
            {slugNotFound ? t("slugNotInList") : t("noLiveMatch")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">{t("pickAnother")}</p>
          <Link
            href="/vehicles"
            className={`${ghostLinkClass} border-amber-300 bg-[var(--surface-card)] text-amber-950 hover:bg-amber-100`}
          >
            {t("browseFleet")}
          </Link>
        </div>
      ) : displayVehicle ? (
        <article className="overflow-hidden rounded-[var(--r-panel)] bg-[var(--surface-card)] shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-3)]">
          {/* ── vehicle image ─────────────────────────────────────── */}
          <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[var(--surface-band)] via-[var(--surface-sunken)] to-[var(--surface-band)]">
            {selectedVehicleImageSrc ? (
              <>
                <Image
                  key={selectedVehicleImageSrc}
                  src={selectedVehicleImageSrc}
                  alt={
                    showGalleryNav
                      ? `${displayVehicle.name} — photo ${activeImageIdx + 1} of ${galleryImages.length}`
                      : displayVehicle.name
                  }
                  fill
                  className="object-contain p-6 drop-shadow-md transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 42rem"
                  priority
                />
                {/* subtle radial glow under the vehicle */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 left-1/2 h-1/3 w-2/3 -translate-x-1/2 rounded-full bg-[var(--ink-200)]/60 blur-2xl"
                />

                {showGalleryNav ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPrevImage}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--surface-card)]/90 text-[var(--text-primary)] shadow-[var(--elev-2)] ring-1 ring-[var(--line)] backdrop-blur-sm transition duration-[var(--dur-fast)] hover:bg-[var(--surface-card)] hover:shadow-[var(--elev-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:left-4 sm:h-11 sm:w-11"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--surface-card)]/90 text-[var(--text-primary)] shadow-[var(--elev-2)] ring-1 ring-[var(--line)] backdrop-blur-sm transition duration-[var(--dur-fast)] hover:bg-[var(--surface-card)] hover:shadow-[var(--elev-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:right-4 sm:h-11 sm:w-11"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </button>
                    <span className="type-spec absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[var(--surface-inverse)]/70 px-2.5 py-1 text-white backdrop-blur-sm">
                      {activeImageIdx + 1} / {galleryImages.length}
                    </span>
                  </>
                ) : null}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--text-faint)]">
                {t("imageComingSoon")}
              </div>
            )}
          </div>

          {/* ── vehicle info ──────────────────────────────────────── */}
          <div className="border-t border-[var(--line-subtle)] px-5 py-4 sm:px-6 sm:py-5">
            <p className="type-eyebrow text-[var(--orange-600)]">{t("yourSelection")}</p>
            <h3 className="type-h3 mt-1.5 text-[var(--text-primary)]">{displayVehicle.name}</h3>
            {selectedVehicleBrandModel ? (
              <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                {selectedVehicleBrandModel}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {displayVehicle.shortDescription ?? t("noShortDescription")}
            </p>
            <p className="type-spec mt-3 text-[var(--text-muted)]">
              {formatVehicleTypeLabel(displayVehicle.apiVehicleType)}
              {" · "}
              {t("helmetsSummary", { count: displayVehicle.helmetIncludedCount })}
              {" · "}
              {displayVehicle.supportsStorageBox ? t("storageYes") : t("storageNo")}
            </p>
            {holdIsOnSelectedVehicle ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                {t("reservedTemp")}
              </p>
            ) : null}
          </div>
        </article>
      ) : (
        <VehicleSkeleton />
      )}

      {vehicleError ? (
        <p
          className="mt-3 rounded-[var(--r-field)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
          role="alert"
        >
          {vehicleError}
        </p>
      ) : null}
    </StepShell>
  );
}
