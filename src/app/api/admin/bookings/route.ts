import { NextResponse } from "next/server";

import { adminBookingListQuerySchema, listAdminBookings } from "@/lib/admin/bookings";
import type { BookingStatus } from "@/generated/prisma/client";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

function formatZodError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const fieldErrors = error.flatten().fieldErrors;
  const firstKey = Object.keys(fieldErrors)[0];
  const firstMessage = firstKey ? fieldErrors[firstKey]?.[0] : undefined;
  return firstMessage ?? "Invalid request";
}

export async function GET(request: Request) {
  try {
    await requireAdminApi();

    const { searchParams } = new URL(request.url);
    const parsed = adminBookingListQuerySchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      vehicleId: searchParams.get("vehicleId") ?? undefined,
      hotelPartnerId: searchParams.get("hotelPartnerId") ?? undefined,
      hotelCode: searchParams.get("hotelCode") ?? undefined,
      month: searchParams.get("month") ?? undefined,
      year: searchParams.get("year") ?? undefined,
      pickupFrom: searchParams.get("pickupFrom") ?? undefined,
      pickupTo: searchParams.get("pickupTo") ?? undefined,
      returnDate: searchParams.get("returnDate") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await listAdminBookings({
      search: parsed.data.search,
      status: parsed.data.status as BookingStatus | undefined,
      vehicleId: parsed.data.vehicleId,
      hotelPartnerId: parsed.data.hotelPartnerId,
      hotelCode: parsed.data.hotelCode,
      month: parsed.data.month,
      year: parsed.data.year,
      pickupFrom: parsed.data.pickupFrom,
      pickupTo: parsed.data.pickupTo,
      returnDate: parsed.data.returnDate,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    return NextResponse.json({ success: true as const, ...result });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
