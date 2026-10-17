"use client";

import { Loader2, Plus, Star, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminSelect } from "@/features/admin/components/admin-select";
import { VehicleColorSelect } from "@/features/admin/components/vehicle-color-select";
import { defaultBaseDailyRateForVehicleType } from "@/lib/admin/vehicles/pricing-defaults";
import { slugifyVehicleName } from "@/lib/admin/vehicles/slugify-name";
import type { AdminVehicleDetail } from "@/lib/admin/vehicles/types";
import { VEHICLE_CATALOG_STATUSES, VEHICLE_TYPES } from "@/lib/admin/vehicles/types";
import {
  defaultEngineCcForVehicleType,
  vehicleTypeUsesEngineCc,
  type EngineCcValue,
} from "@/lib/vehicles/engine-cc";
import {
  buildDurationPricingPreview,
  roundPricingAmount,
} from "@/lib/pricing/duration-pricing";
import type { VehicleCatalogStatus, VehicleType } from "@/generated/prisma/client";

type GalleryImage = {
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

type AdminVehicleFormProps = Readonly<{
  locale: string;
  mode: "create" | "edit";
  vehicle?: AdminVehicleDetail;
}>;

type PricingState = {
  baseDailyRate: string;
};

function pricingFromVehicle(vehicleType: VehicleType, vehicle?: AdminVehicleDetail): PricingState {
  const baseRate = vehicle?.baseDailyRate ?? defaultBaseDailyRateForVehicleType(vehicleType);
  return {
    baseDailyRate: baseRate?.toString() ?? "",
  };
}

function parseRequiredPositiveNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function formatTierRate(value: number): string {
  return `€${roundPricingAmount(value).toFixed(2).replace(/\.00$/, "")}`;
}

function inputClassName(): string {
  return "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3a7ca5]/40 focus:bg-white focus:ring-2 focus:ring-[#3a7ca5]/15";
}

export function AdminVehicleForm({ locale, mode, vehicle }: AdminVehicleFormProps) {
  const t = useTranslations("Admin.vehicles");
  const router = useRouter();

  const [name, setName] = useState(vehicle?.name ?? "");
  const [slug, setSlug] = useState(vehicle?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [vehicleType, setVehicleType] = useState<VehicleType>(vehicle?.vehicleType ?? "Scooter");
  const [engineCc, setEngineCc] = useState<EngineCcValue | null>(
    vehicleTypeUsesEngineCc(vehicle?.vehicleType ?? "Scooter")
      ? ((vehicle?.engineCc === 50 || vehicle?.engineCc === 125
          ? vehicle.engineCc
          : defaultEngineCcForVehicleType(vehicle?.vehicleType ?? "Scooter")) ?? 50)
      : null,
  );
  const [brand, setBrand] = useState(vehicle?.brand ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [color, setColor] = useState(vehicle?.color ?? "");
  const [shortDescription, setShortDescription] = useState(vehicle?.shortDescription ?? "");
  const [description, setDescription] = useState(vehicle?.description ?? "");
  const [mainImageUrl, setMainImageUrl] = useState(vehicle?.mainImageUrl ?? "");
  const [catalogStatus, setCatalogStatus] = useState<VehicleCatalogStatus>(
    vehicle?.catalogStatus ?? "AVAILABLE",
  );
  const [isActive, setIsActive] = useState(vehicle?.isActive ?? true);
  const [displayOrder, setDisplayOrder] = useState(String(vehicle?.displayOrder ?? 0));
  const [helmetIncludedCount, setHelmetIncludedCount] = useState(String(vehicle?.helmetIncludedCount ?? 2));
  const [supportsStorageBox, setSupportsStorageBox] = useState(vehicle?.supportsStorageBox ?? false);
  const [images, setImages] = useState<GalleryImage[]>(
    vehicle?.images.map((image) => ({
      imageUrl: image.imageUrl,
      altText: image.altText ?? "",
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })) ?? [],
  );
  const [pricing, setPricing] = useState<PricingState>(() => pricingFromVehicle(vehicleType, vehicle));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | "main" | null>(null);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyVehicleName(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (mode === "create") {
      setPricing(pricingFromVehicle(vehicleType));
    }
  }, [mode, vehicleType]);

  const derivedTierRates = useMemo(() => {
    const baseRate = parseRequiredPositiveNumber(pricing.baseDailyRate);
    if (baseRate == null) {
      return null;
    }
    return buildDurationPricingPreview(baseRate);
  }, [pricing.baseDailyRate]);

  const cancelHref = `/${locale}/admin/vehicles`;

  const payload = useMemo(
    () => ({
      name,
      slug,
      vehicleType,
      engineCc,
      brand: brand.trim() || null,
      model: model.trim() || null,
      color: color.trim() || null,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      mainImageUrl: mainImageUrl.trim() || null,
      catalogStatus,
      isActive,
      displayOrder: Number(displayOrder) || 0,
      helmetIncludedCount: Number(helmetIncludedCount) || 0,
      supportsStorageBox,
      images: images.filter((image) => image.imageUrl.trim().length > 0),
      baseDailyRate: parseRequiredPositiveNumber(pricing.baseDailyRate) ?? 0,
    }),
    [
      brand,
      color,
      catalogStatus,
      description,
      displayOrder,
      engineCc,
      helmetIncludedCount,
      images,
      isActive,
      mainImageUrl,
      model,
      name,
      pricing,
      shortDescription,
      slug,
      supportsStorageBox,
      vehicleType,
    ],
  );

  async function uploadImage(file: File, target: "main" | number) {
    const slugForUpload = slug.trim() || slugifyVehicleName(name) || "vehicle";
    setUploadingIndex(target);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/admin/vehicles/upload-image?vehicleSlug=${encodeURIComponent(slugForUpload)}`,
        {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        file?: { publicUrl: string };
      };

      if (!response.ok || !result.success || !result.file?.publicUrl) {
        setError(result.message ?? t("form.uploadError"));
        return;
      }

      const url = result.file.publicUrl;

      if (target === "main") {
        setMainImageUrl(url);
        return;
      }

      setImages((current) =>
        current.map((image, index) => (index === target ? { ...image, imageUrl: url } : image)),
      );
    } catch {
      setError(t("form.uploadError"));
    } finally {
      setUploadingIndex(null);
    }
  }

  function addGalleryImage() {
    setImages((current) => [
      ...current,
      {
        imageUrl: "",
        altText: "",
        sortOrder: current.length,
        isPrimary: current.length === 0,
      },
    ]);
  }

  function removeGalleryImage(index: number) {
    setImages((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      if (next.length > 0 && !next.some((image) => image.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next.map((image, itemIndex) => ({ ...image, sortOrder: itemIndex }));
    });
  }

  function setPrimaryImage(index: number) {
    setImages((current) =>
      current.map((image, itemIndex) => ({ ...image, isPrimary: itemIndex === index })),
    );
    const primary = images[index];
    if (primary?.imageUrl) {
      setMainImageUrl(primary.imageUrl);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "create" ? "/api/admin/vehicles" : `/api/admin/vehicles/${vehicle?.id ?? ""}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !result.success) {
        setError(result.message ?? t("form.saveError"));
        return;
      }

      router.push(`/${locale}/admin/vehicles`);
      router.refresh();
    } catch {
      setError(t("form.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">{t("form.sections.basic")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.name")}</span>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName()}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.slug")}</span>
            <input
              type="text"
              required
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className={inputClassName()}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.vehicleType")}</span>
            <select
              value={vehicleType}
              onChange={(event) => {
                const nextType = event.target.value as VehicleType;
                setVehicleType(nextType);
                if (vehicleTypeUsesEngineCc(nextType)) {
                  setEngineCc((current) =>
                    current === 50 || current === 125
                      ? current
                      : (defaultEngineCcForVehicleType(nextType) ?? 50),
                  );
                } else {
                  setEngineCc(null);
                }
              }}
              className={inputClassName()}
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`vehicleTypes.${type}`)}
                </option>
              ))}
            </select>
          </label>
          {vehicleTypeUsesEngineCc(vehicleType) ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.engineCc")}</span>
              <AdminSelect
                value={engineCc ?? 50}
                onChange={setEngineCc}
                required
                aria-label={t("form.engineCc")}
                options={[
                  { value: 50, label: t("form.engineCc50") },
                  { value: 125, label: t("form.engineCc125") },
                ]}
              />
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.brand")}</span>
            <input type="text" value={brand} onChange={(event) => setBrand(event.target.value)} className={inputClassName()} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.model")}</span>
            <input type="text" value={model} onChange={(event) => setModel(event.target.value)} className={inputClassName()} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.color")}</span>
            <VehicleColorSelect
              value={color}
              onChange={setColor}
              allowEmpty
              emptyLabel={t("form.colorNone")}
              customColorLabel={t("form.colorCustom")}
              customColorPlaceholder={t("form.colorCustomPlaceholder")}
              applyCustomLabel={t("form.colorCustomApply")}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">{t("form.sections.description")}</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.shortDescription")}</span>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              className={inputClassName()}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.description")}</span>
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={inputClassName()}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">{t("form.sections.status")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.catalogStatus")}</span>
            <select
              value={catalogStatus}
              onChange={(event) => setCatalogStatus(event.target.value as VehicleCatalogStatus)}
              className={inputClassName()}
            >
              {VEHICLE_CATALOG_STATUSES.filter((status) => status !== "INACTIVE").map((status) => (
                <option key={status} value={status}>
                  {t(`catalogStatus.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.displayOrder")}</span>
            <input
              type="number"
              min={0}
              value={displayOrder}
              onChange={(event) => setDisplayOrder(event.target.value)}
              className={inputClassName()}
            />
          </label>
          <label className="flex w-fit self-end items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="size-4 rounded border-slate-300"
            />
            <span className="text-sm font-semibold text-slate-700">{t("form.isActive")}</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">{t("form.sections.features")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.helmetIncludedCount")}</span>
            <input
              type="number"
              min={0}
              max={10}
              value={helmetIncludedCount}
              onChange={(event) => setHelmetIncludedCount(event.target.value)}
              className={inputClassName()}
            />
          </label>
          <label className="flex w-fit self-end items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={supportsStorageBox}
              onChange={(event) => setSupportsStorageBox(event.target.checked)}
              className="size-4 rounded border-slate-300"
            />
            <span className="text-sm font-semibold text-slate-700">{t("form.supportsStorageBox")}</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">{t("form.sections.pricing")}</h2>
        <p className="mt-1 text-xs text-slate-500">{t("form.pricingHint")}</p>
        <p className="mt-2 text-xs text-slate-600">{t("form.pricingFlatTierNote")}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.baseDailyRate")}</span>
            <input
              type="number"
              required
              min={0.01}
              step="0.01"
              value={pricing.baseDailyRate}
              onChange={(event) =>
                setPricing({ baseDailyRate: event.target.value })
              }
              className={inputClassName()}
            />
          </label>
          {derivedTierRates && derivedTierRates.length > 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {t("form.derivedDurationRates")} ({t(`vehicleTypes.${vehicleType}`)})
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {derivedTierRates.map((row) => (
                  <li key={`${row.minDays}-${row.maxDays ?? "plus"}`}>
                    {row.label}: {row.discountPercent}% {t("form.discountOff")} → {formatTierRate(row.appliedDailyRate)}/day
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="self-center text-sm text-slate-500">{t("form.pricingDerivedPending")}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">{t("form.sections.images")}</h2>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-end">
            <div className="relative size-[120px] overflow-hidden rounded-xl bg-slate-100">
              {mainImageUrl ? (
                <Image src={mainImageUrl} alt="" fill sizes="120px" className="object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-xs font-semibold text-slate-400">
                  {t("form.noImage")}
                </div>
              )}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("form.mainImageUrl")}</span>
              <input
                type="url"
                value={mainImageUrl}
                onChange={(event) => setMainImageUrl(event.target.value)}
                className={inputClassName()}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              {uploadingIndex === "main" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              {t("form.upload")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadImage(file, "main");
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">{t("form.gallery")}</h3>
              <button
                type="button"
                onClick={addGalleryImage}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus className="size-3.5" aria-hidden />
                {t("form.addImage")}
              </button>
            </div>

            {images.length === 0 ? (
              <p className="text-sm text-slate-500">{t("form.galleryEmpty")}</p>
            ) : (
              images.map((image, index) => (
                <div key={`gallery-${index}`} className="grid gap-3 rounded-xl border border-slate-100 p-3 md:grid-cols-[80px_minmax(0,1fr)_auto] md:items-end">
                  <div className="relative size-20 overflow-hidden rounded-lg bg-slate-100">
                    {image.imageUrl ? (
                      <Image src={image.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">{t("form.imageUrl")}</span>
                      <input
                        type="url"
                        value={image.imageUrl}
                        onChange={(event) =>
                          setImages((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, imageUrl: event.target.value } : item,
                            ),
                          )
                        }
                        className={inputClassName()}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">{t("form.altText")}</span>
                      <input
                        type="text"
                        value={image.altText}
                        onChange={(event) =>
                          setImages((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, altText: event.target.value } : item,
                            ),
                          )
                        }
                        className={inputClassName()}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                      {uploadingIndex === index ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}
                      {t("form.upload")}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void uploadImage(file, index);
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className={[
                        "inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                        image.isPrimary
                          ? "border-[#3a7ca5]/30 bg-[#3a7ca5]/10 text-[#3a7ca5]"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Star className="size-3.5" aria-hidden />
                      {t("form.primary")}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      {t("form.remove")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <a
          href={cancelHref}
          className="inline-flex cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
        >
          {t("form.cancel")}
        </a>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#3a7ca5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f6688] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? t("form.saving") : mode === "create" ? t("form.create") : t("form.save")}
        </button>
      </div>
    </form>
  );
}
