"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, Fragment } from "react";

import { AdminRowActionsMenu } from "@/features/admin/components/admin-row-actions-menu";
import { AdminVehicleTableUnitsExpand } from "@/features/admin/components/admin-vehicle-table-units-expand";
import { AdminVehicleDeleteDialog } from "@/features/admin/components/admin-vehicle-delete-dialog";
import type { AdminVehicleListItem } from "@/lib/admin/vehicles/types";

type AdminVehicleTableProps = Readonly<{
  locale: string;
  vehicles: AdminVehicleListItem[];
}>;

type DialogMode = "activate" | "deactivate" | "delete";

type DialogTarget = {
  vehicle: AdminVehicleListItem;
  mode: DialogMode;
};

function statusBadgeClass(status: string, isActive: boolean): string {
  if (!isActive || status === "INACTIVE") {
    return "bg-slate-100 text-slate-600";
  }
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";
    case "BOOKED":
      return "bg-blue-50 text-blue-700";
    case "UNDER_PROCESS":
      return "bg-amber-50 text-amber-700";
    case "SOLD":
      return "bg-violet-50 text-violet-700";
    case "MAINTENANCE":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function AdminVehicleTable({ locale, vehicles }: AdminVehicleTableProps) {
  const t = useTranslations("Admin.vehicles");
  const router = useRouter();
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);
  const [actionVehicleId, setActionVehicleId] = useState<string | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function toggleUnitsExpand(vehicleId: string) {
    setExpandedVehicleId((current) => (current === vehicleId ? null : vehicleId));
  }

  async function handleDialogConfirm() {
    if (!dialogTarget) {
      return;
    }

    const { vehicle, mode } = dialogTarget;

    if (mode === "delete" && !vehicle.canDelete) {
      return;
    }

    setActionVehicleId(vehicle.id);
    setFeedback(null);

    try {
      const response =
        mode === "activate"
          ? await fetch(`/api/admin/vehicles/${vehicle.id}/activate`, {
              method: "POST",
              credentials: "same-origin",
            })
          : mode === "deactivate"
            ? await fetch(`/api/admin/vehicles/${vehicle.id}/deactivate`, {
                method: "POST",
                credentials: "same-origin",
              })
            : await fetch(`/api/admin/vehicles/${vehicle.id}`, {
                method: "DELETE",
                credentials: "same-origin",
              });

      const payload = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !payload.success) {
        setFeedback({
          type: "error",
          message:
            payload.message ??
            (mode === "activate"
              ? t("activateError")
              : mode === "deactivate"
                ? t("deactivateError")
                : t("deleteError")),
        });
        return;
      }

      setFeedback({
        type: "success",
        message:
          mode === "activate"
            ? t("activateSuccess", { name: vehicle.name })
            : mode === "deactivate"
              ? t("deactivateSuccess", { name: vehicle.name })
              : t("deleteSuccess", { name: vehicle.name }),
      });
      setDialogTarget(null);
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        message:
          mode === "activate"
            ? t("activateError")
            : mode === "deactivate"
              ? t("deactivateError")
              : t("deleteError"),
      });
    } finally {
      setActionVehicleId(null);
    }
  }

  return (
    <>
      {feedback ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm font-medium",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800",
          ].join(" ")}
          role="status"
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">{t("table.no")}</th>
                <th className="px-4 py-3 font-semibold">{t("table.vehicle")}</th>
                <th className="px-4 py-3 font-semibold">{t("table.type")}</th>
                <th className="px-4 py-3 font-semibold">{t("table.baseDailyRate")}</th>
                <th className="px-4 py-3 font-semibold">{t("table.totalUnits")}</th>
                <th className="px-4 py-3 font-semibold">{t("table.availableUnits")}</th>
                <th className="px-4 py-3 font-semibold">{t("table.status")}</th>
                <th className="px-4 py-3 font-semibold">{t("table.visibility")}</th>
                <th className="px-4 py-3 font-semibold">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                    {t("table.empty")}
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle, index) => {
                  const isUnitsExpanded = expandedVehicleId === vehicle.id;

                  return (
                  <Fragment key={vehicle.id}>
                  <tr className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-500">{String(index + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[14rem] items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {vehicle.mainImageUrl ? (
                            <Image
                              src={vehicle.mainImageUrl}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[10px] font-semibold text-slate-400">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{vehicle.name}</p>
                          <p className="truncate text-xs text-slate-500">{vehicle.slug}</p>
                          {(vehicle.brand || vehicle.model || vehicle.color) ? (
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                              {vehicle.color ? ` · ${vehicle.color}` : ""}
                            </p>
                          ) : null}
                          {vehicle.bookingCount > 0 ? (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {t("table.bookingCount", { count: vehicle.bookingCount })}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {t(`vehicleTypes.${vehicle.vehicleType}`)}
                      {vehicle.engineCc === 50 || vehicle.engineCc === 125
                        ? ` · ${vehicle.engineCc}cc`
                        : null}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">€{vehicle.baseDailyRate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-700">{vehicle.totalUnits}</td>
                    <td className="px-4 py-3 text-slate-700">{vehicle.availableUnits}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          statusBadgeClass(vehicle.catalogStatus, vehicle.isActive),
                        ].join(" ")}
                      >
                        {t(`catalogStatus.${vehicle.catalogStatus}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          vehicle.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                        ].join(" ")}
                      >
                        {vehicle.isActive ? t("table.visible") : t("table.hidden")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[9rem] items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleUnitsExpand(vehicle.id)}
                          aria-expanded={isUnitsExpanded}
                          aria-label={
                            isUnitsExpanded
                              ? t("table.collapseUnits", { name: vehicle.name })
                              : t("table.expandUnits", { name: vehicle.name })
                          }
                          className={[
                            "inline-flex cursor-pointer items-center justify-center rounded-lg border p-1.5 transition",
                            isUnitsExpanded
                              ? "border-[#3a7ca5]/40 bg-[#3a7ca5]/10 text-[#2f6688]"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {isUnitsExpanded ? (
                            <ChevronUp className="size-4" aria-hidden />
                          ) : (
                            <ChevronDown className="size-4" aria-hidden />
                          )}
                        </button>
                        <a
                          href={`/${locale}/admin/vehicles/${vehicle.id}#vehicle-units`}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#3a7ca5]/25 bg-[#3a7ca5]/5 px-3 py-1.5 text-xs font-semibold text-[#2f6688] transition hover:border-[#3a7ca5]/40 hover:bg-[#3a7ca5]/10"
                        >
                          <Plus className="size-3.5" aria-hidden />
                          {t("table.addUnit")}
                        </a>
                        <AdminRowActionsMenu
                          ariaLabel={t("table.actionsMenu", { name: vehicle.name })}
                          isBusy={actionVehicleId === vehicle.id}
                          items={[
                            vehicle.isActive
                              ? {
                                  key: "deactivate",
                                  label: t("table.deactivate"),
                                  disabled: actionVehicleId === vehicle.id,
                                  tone: "warning",
                                  onClick: () => setDialogTarget({ vehicle, mode: "deactivate" }),
                                }
                              : {
                                  key: "activate",
                                  label: t("table.activate"),
                                  disabled: actionVehicleId === vehicle.id,
                                  tone: "success",
                                  onClick: () => setDialogTarget({ vehicle, mode: "activate" }),
                                },
                            {
                              key: "delete",
                              label: t("table.delete"),
                              disabled: actionVehicleId === vehicle.id,
                              tone: "danger",
                              onClick: () => setDialogTarget({ vehicle, mode: "delete" }),
                            },
                            {
                              key: "edit",
                              label: t("table.edit"),
                              href: `/${locale}/admin/vehicles/${vehicle.id}/edit`,
                            },
                            {
                              key: "details",
                              label: t("table.details"),
                              href: `/${locale}/admin/vehicles/${vehicle.id}`,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                  {isUnitsExpanded ? (
                    <tr className="border-b border-slate-50 last:border-0">
                      <td colSpan={9} className="p-0">
                        <AdminVehicleTableUnitsExpand
                          vehicleId={vehicle.id}
                          locale={locale}
                          isOpen={isUnitsExpanded}
                        />
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminVehicleDeleteDialog
        open={dialogTarget !== null}
        mode={dialogTarget?.mode ?? "deactivate"}
        vehicleName={dialogTarget?.vehicle.name ?? ""}
        bookingCount={dialogTarget?.vehicle.bookingCount ?? 0}
        reservationHoldCount={dialogTarget?.vehicle.reservationHoldCount ?? 0}
        availabilityBlockCount={dialogTarget?.vehicle.availabilityBlockCount ?? 0}
        canDelete={dialogTarget?.vehicle.canDelete ?? true}
        deleteBlockedReasons={dialogTarget?.vehicle.deleteBlockedReasons ?? []}
        isSubmitting={actionVehicleId !== null}
        onCancel={() => setDialogTarget(null)}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}
