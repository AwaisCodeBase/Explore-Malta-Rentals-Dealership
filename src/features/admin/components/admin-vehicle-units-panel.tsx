"use client";

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminRowActionsMenu } from "@/features/admin/components/admin-row-actions-menu";
import { VehicleColorSelect } from "@/features/admin/components/vehicle-color-select";
import type { AdminVehicleUnitDto } from "@/lib/admin/vehicle-units/types";
import { VEHICLE_UNIT_STATUSES } from "@/lib/admin/vehicle-units/vehicle-unit-schema";
import type { VehicleUnitStatus } from "@/generated/prisma/client";

type AdminVehicleUnitsPanelProps = Readonly<{
  vehicleId: string;
  initialUnits: AdminVehicleUnitDto[];
}>;

type UnitFormState = {
  licensePlate: string;
  color: string;
  status: VehicleUnitStatus;
  isActive: boolean;
  notes: string;
};

const emptyForm = (): UnitFormState => ({
  licensePlate: "",
  color: "",
  status: "AVAILABLE",
  isActive: true,
  notes: "",
});

function statusBadgeClass(status: VehicleUnitStatus, isActive: boolean): string {
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

function inputClassName(): string {
  return "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3a7ca5]/40 focus:bg-white focus:ring-2 focus:ring-[#3a7ca5]/15";
}

export function AdminVehicleUnitsPanel({ vehicleId, initialUnits }: AdminVehicleUnitsPanelProps) {
  const t = useTranslations("Admin.vehicles.units");
  const router = useRouter();
  const [units, setUnits] = useState(initialUnits);
  const [form, setForm] = useState<UnitFormState>(emptyForm);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = editingUnitId !== null;
  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.licensePlate.localeCompare(b.licensePlate)),
    [units],
  );

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#vehicle-units") {
      return;
    }
    const section = document.getElementById("vehicle-units");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function resetForm() {
    setForm(emptyForm());
    setEditingUnitId(null);
    setError(null);
  }

  function startEdit(unit: AdminVehicleUnitDto) {
    setEditingUnitId(unit.id);
    setForm({
      licensePlate: unit.licensePlate,
      color: unit.color ?? "",
      status: unit.status,
      isActive: unit.isActive,
      notes: unit.notes ?? "",
    });
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      licensePlate: form.licensePlate.trim().toUpperCase(),
      color: form.color.trim() || null,
      status: form.status,
      isActive: form.isActive,
      notes: form.notes.trim() || null,
    };

    try {
      const response = await fetch(
        isEditing
          ? `/api/admin/vehicles/${vehicleId}/units/${editingUnitId}`
          : `/api/admin/vehicles/${vehicleId}/units`,
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        unit?: AdminVehicleUnitDto;
      };

      if (!response.ok || !data.success || !data.unit) {
        setError(data.message ?? t("saveError"));
        return;
      }

      setUnits((current) => {
        if (isEditing) {
          return current.map((unit) => (unit.id === data.unit!.id ? data.unit! : unit));
        }
        return [...current, data.unit!];
      });
      setSuccess(isEditing ? t("updateSuccess") : t("createSuccess"));
      resetForm();
      router.refresh();
    } catch {
      setError(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(unitId: string) {
    if (!window.confirm(t("deleteConfirm"))) {
      return;
    }

    setDeletingUnitId(unitId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}/units/${unitId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !data.success) {
        setError(data.message ?? t("deleteError"));
        return;
      }

      setUnits((current) => current.filter((unit) => unit.id !== unitId));
      if (editingUnitId === unitId) {
        resetForm();
      }
      setSuccess(t("deleteSuccess"));
      router.refresh();
    } catch {
      setError(t("deleteError"));
    } finally {
      setDeletingUnitId(null);
    }
  }

  return (
    <section id="vehicle-units" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-950">{t("title")}</h3>
          <p className="mt-1 text-sm text-slate-600">{t("subtitle")}</p>
        </div>
        <p className="text-sm font-semibold text-slate-700">
          {t("counts", {
            total: sortedUnits.length,
            available: sortedUnits.filter((unit) => unit.isActive && unit.status === "AVAILABLE").length,
          })}
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {success}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <p className="text-sm font-semibold text-slate-900">
          {isEditing ? t("editUnit") : t("addUnit")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("licensePlate")}</span>
            <input
              type="text"
              required
              value={form.licensePlate}
              onChange={(event) => setForm((current) => ({ ...current, licensePlate: event.target.value }))}
              placeholder={t("licensePlatePlaceholder")}
              className={inputClassName()}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("color")}</span>
            <VehicleColorSelect
              value={form.color}
              onChange={(color) => setForm((current) => ({ ...current, color }))}
              allowEmpty={isEditing}
              emptyLabel={t("colorNone")}
              customColorLabel={t("colorCustom")}
              customColorPlaceholder={t("colorCustomPlaceholder")}
              applyCustomLabel={t("colorCustomApply")}
              required={!isEditing}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("status")}</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as VehicleUnitStatus }))
              }
              className={inputClassName()}
            >
              {VEHICLE_UNIT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`statuses.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2.5">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="size-4 rounded border-slate-300"
            />
            <span className="text-sm font-semibold text-slate-700">{t("isActive")}</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t("notes")}</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className={inputClassName()}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#3a7ca5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f6688] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            {isSubmitting ? t("saving") : isEditing ? t("saveUnit") : t("addUnitButton")}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              {t("cancelEdit")}
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-semibold">{t("table.licensePlate")}</th>
              <th className="px-3 py-2 font-semibold">{t("table.color")}</th>
              <th className="px-3 py-2 font-semibold">{t("table.status")}</th>
              <th className="px-3 py-2 font-semibold">{t("table.active")}</th>
              <th className="px-3 py-2 font-semibold">{t("table.notes")}</th>
              <th className="px-3 py-2 font-semibold">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedUnits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              sortedUnits.map((unit) => (
                <tr key={unit.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-3 font-mono font-semibold text-slate-900">{unit.licensePlate}</td>
                  <td className="px-3 py-3 text-slate-700">
                    {unit.color ? (
                      unit.color
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {t("colorMissing")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        statusBadgeClass(unit.status, unit.isActive),
                      ].join(" ")}
                    >
                      {t(`statuses.${unit.status}`)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {unit.isActive ? t("table.yes") : t("table.no")}
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-3 text-slate-600">{unit.notes ?? "—"}</td>
                  <td className="px-3 py-3">
                    <AdminRowActionsMenu
                      ariaLabel={t("table.actionsMenu", { plate: unit.licensePlate })}
                      isBusy={deletingUnitId === unit.id}
                      items={[
                        {
                          key: "edit",
                          label: t("table.edit"),
                          onClick: () => startEdit(unit),
                        },
                        {
                          key: "delete",
                          label: t("table.delete"),
                          tone: "danger",
                          disabled: deletingUnitId === unit.id,
                          onClick: () => handleDelete(unit.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
