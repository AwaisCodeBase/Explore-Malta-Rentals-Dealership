import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminVehicleForm } from "@/features/admin/components/admin-vehicle-form";
import { getAdminVehicleById } from "@/lib/admin/vehicles";

export const dynamic = "force-dynamic";

type AdminEditVehiclePageProps = Readonly<{
  params: Promise<{ locale: string; id: string }>;
}>;

export default async function AdminEditVehiclePage({ params }: AdminEditVehiclePageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Admin.vehicles" });
  const vehicle = await getAdminVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">{t("editTitle", { name: vehicle.name })}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("editDescription")}</p>
      </section>
      <AdminVehicleForm locale={locale} mode="edit" vehicle={vehicle} />
    </div>
  );
}
