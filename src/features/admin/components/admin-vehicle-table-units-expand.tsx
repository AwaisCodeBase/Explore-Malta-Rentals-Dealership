"use client";

import { Eye, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminVehicleUnitDetailDialog } from "@/features/admin/components/admin-vehicle-unit-detail-dialog";
import type { AdminVehicleUnitDto } from "@/lib/admin/vehicle-units/types";
import type { VehicleUnitStatus } from "@/generated/prisma/client";

type UnitsFetchState = {
  units: AdminVehicleUnitDto[];
  loading: boolean;
  error: string | null;
};

type AdminVehicleTableUnitsExpandProps = Readonly<{
  vehicleId: string;
  locale: string;
  isOpen: boolean;
}>;

function unitStatusBadgeClass(status: VehicleUnitStatus, isActive: boolean): string {
  if (!isActive || status === "NOT_AVAILABLE") {
    return "bg-slate-100 text-slate-600";
  }
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";
    case "RESERVED":
      return "bg-blue-50 text-blue-700";
    case "OUT_WITH_CUSTOMER":
      return "bg-violet-50 text-violet-700";
    case "MAINTENANCE":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminVehicleTableUnitsExpand({
  vehicleId,
  locale,
  isOpen,
}: AdminVehicleTableUnitsExpandProps) {
  const t = useTranslations("Admin.vehicles");
  const tUnits = useTranslations("Admin.vehicles.units");
  const [state, setState] = useState<UnitsFetchState>({
    units: [],
    loading: false,
    error: null,
  });
  const [detailUnitId, setDetailUnitId] = useState<string | null>(null);

  const loadUnits = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}/units`, {
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        units?: AdminVehicleUnitDto[];
        message?: string;
      };

      if (!response.ok || !payload.success || !Array.isArray(payload.units)) {
        setState({
          units: [],
          loading: false,
          error: payload.message ?? t("table.unitsLoadError"),
        });
        return;
      }

      const sorted = [...payload.units].sort((a, b) => a.licensePlate.localeCompare(b.licensePlate));
      setState({ units: sorted, loading: false, error: null });
    } catch {
      setState({ units: [], loading: false, error: t("table.unitsLoadError") });
    }
  }, [t, vehicleId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void loadUnits();
  }, [isOpen, loadUnits]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("table.unitsPanelTitle")}
        </p>
        <a
          href={`/${locale}/admin/vehicles/${vehicleId}#vehicle-units`}
          className="text-xs font-semibold text-[#2f6688] underline-offset-2 hover:underline"
        >
          {t("table.manageUnits")}
        </a>
      </div>

      {state.loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-600">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("table.unitsLoading")}
        </div>
      ) : state.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p>{state.error}</p>
          <button
            type="button"
            onClick={() => {
              void loadUnits();
            }}
            className="mt-2 text-xs font-semibold underline underline-offset-2"
          >
            {t("table.unitsRetry")}
          </button>
        </div>
      ) : state.units.length === 0 ? (
        <p className="py-4 text-sm text-slate-600">{tUnits("table.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-semibold">{tUnits("table.licensePlate")}</th>
                <th className="px-3 py-2.5 font-semibold">{tUnits("table.color")}</th>
                <th className="px-3 py-2.5 font-semibold">{tUnits("table.status")}</th>
                <th className="px-3 py-2.5 font-semibold">{tUnits("table.active")}</th>
                <th className="px-3 py-2.5 font-semibold">{tUnits("table.notes")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("table.unitUpdated")}</th>
                <th className="px-3 py-2.5 font-semibold">{tUnits("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {state.units.map((unit) => (
                <tr key={unit.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{unit.licensePlate}</td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {unit.color ?? (
                      <span className="text-xs font-semibold text-amber-700">{tUnits("colorMissing")}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        unitStatusBadgeClass(unit.status, unit.isActive),
                      ].join(" ")}
                    >
                      {tUnits(`statuses.${unit.status}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {unit.isActive ? tUnits("table.yes") : tUnits("table.no")}
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2.5 text-slate-600" title={unit.notes ?? undefined}>
                    {unit.notes?.trim() ? unit.notes : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                    {formatUpdatedAt(unit.updatedAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setDetailUnitId(unit.id)}
                      aria-label={t("table.unitViewAria", { plate: unit.licensePlate })}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#3a7ca5]/30 hover:text-[#3a7ca5]"
                    >
                      <Eye className="size-3.5" aria-hidden />
                      {t("table.unitView")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    <AdminVehicleUnitDetailDialog
      open={detailUnitId !== null}
      vehicleId={vehicleId}
      unitId={detailUnitId}
      locale={locale}
      onClose={() => setDetailUnitId(null)}
    />
    </>
  );
}
