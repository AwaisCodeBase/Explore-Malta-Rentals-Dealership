import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminVehicleForm } from "@/features/admin/components/admin-vehicle-form";

export const dynamic = "force-dynamic";

type AdminNewVehiclePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function AdminNewVehiclePage({ params }: AdminNewVehiclePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Admin.vehicles" });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">{t("createTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("createDescription")}</p>
      </section>
      <AdminVehicleForm locale={locale} mode="create" />
    </div>
  );
}
