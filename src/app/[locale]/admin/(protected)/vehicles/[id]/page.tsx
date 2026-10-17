import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { AdminVehicleDetailView } from "@/features/admin/components/admin-vehicle-detail";
import { getAdminVehicleById, getAdminVehicleBookingsForCalendar } from "@/lib/admin/vehicles";

export const dynamic = "force-dynamic";

type AdminVehicleDetailPageProps = Readonly<{
  params: Promise<{ locale: string; id: string }>;
}>;

export default async function AdminVehicleDetailPage({ params }: AdminVehicleDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [vehicle, bookings] = await Promise.all([
    getAdminVehicleById(id),
    getAdminVehicleBookingsForCalendar(id),
  ]);

  if (!vehicle) {
    notFound();
  }

  return <AdminVehicleDetailView locale={locale} vehicle={vehicle} bookings={bookings} />;
}
