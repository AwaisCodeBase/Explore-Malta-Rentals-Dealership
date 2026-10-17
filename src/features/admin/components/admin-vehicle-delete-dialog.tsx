"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { VehicleDeleteBlockedReason } from "@/lib/admin/vehicles/vehicle-delete-errors";

type AdminVehicleDeleteDialogProps = Readonly<{
  open: boolean;
  mode: "activate" | "deactivate" | "delete";
  vehicleName: string;
  bookingCount: number;
  reservationHoldCount: number;
  availabilityBlockCount: number;
  canDelete: boolean;
  deleteBlockedReasons: VehicleDeleteBlockedReason[];
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>;

function blockedReasonCount(
  reason: VehicleDeleteBlockedReason,
  counts: { bookingCount: number; reservationHoldCount: number; availabilityBlockCount: number },
): number {
  switch (reason) {
    case "HAS_BOOKINGS":
      return counts.bookingCount;
    case "HAS_RESERVATION_HOLDS":
      return counts.reservationHoldCount;
    case "HAS_AVAILABILITY_BLOCKS":
      return counts.availabilityBlockCount;
  }
}

export function AdminVehicleDeleteDialog({
  open,
  mode,
  vehicleName,
  bookingCount,
  reservationHoldCount,
  availabilityBlockCount,
  canDelete,
  deleteBlockedReasons,
  isSubmitting,
  onCancel,
  onConfirm,
}: AdminVehicleDeleteDialogProps) {
  const t = useTranslations("Admin.vehicles");

  if (!open) {
    return null;
  }

  const isActivate = mode === "activate";
  const isDeactivate = mode === "deactivate";
  const isPermanentDelete = mode === "delete";
  const counts = { bookingCount, reservationHoldCount, availabilityBlockCount };
  const confirmDisabled = isSubmitting || (isPermanentDelete && !canDelete);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40"
        aria-label={t("deleteDialog.cancel")}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-vehicle-delete-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div
          className={[
            "mb-4 inline-flex size-11 items-center justify-center rounded-full",
            isActivate ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
          ].join(" ")}
        >
          <AlertTriangle className="size-5" aria-hidden />
        </div>
        <h2 id="admin-vehicle-delete-title" className="text-lg font-bold text-slate-950">
          {isActivate
            ? t("activateDialog.title")
            : isDeactivate
              ? t("deleteDialog.title")
              : t("permanentDeleteDialog.title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {isActivate
            ? t("activateDialog.description", { name: vehicleName })
            : isDeactivate
              ? t("deleteDialog.description", { name: vehicleName })
              : t("permanentDeleteDialog.description")}
        </p>
        {isDeactivate && bookingCount > 0 ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            {t("deleteDialog.bookingWarning", { count: bookingCount })}
          </p>
        ) : null}
        {isPermanentDelete && !canDelete ? (
          <div className="mt-3 space-y-2">
            {deleteBlockedReasons.map((reason) => (
              <p
                key={reason}
                className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
              >
                {t(`permanentDeleteDialog.blockedReasons.${reason}`, {
                  count: blockedReasonCount(reason, counts),
                })}
              </p>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {t("deleteDialog.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={[
              "cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
              isActivate
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700",
            ].join(" ")}
          >
            {isSubmitting
              ? isActivate
                ? t("activateDialog.activating")
                : isDeactivate
                  ? t("deleteDialog.deactivating")
                  : t("permanentDeleteDialog.deleting")
              : isActivate
                ? t("activateDialog.confirm")
                : isDeactivate
                  ? t("deleteDialog.confirm")
                  : t("permanentDeleteDialog.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
