import { NextResponse } from "next/server";

import {
  changeBookingVehicleErrorMessage,
  changeBookingVehicleStatusCode,
} from "@/lib/admin/bookings/change-booking-vehicle-error";
import { previewChangeBookingVehicleSchema } from "@/lib/admin/bookings/change-booking-vehicle-schema";
import { previewChangeBookingVehicle } from "@/lib/admin/bookings/changeBookingVehicle";
import { formatZodError } from "@/lib/admin/bookings/format-zod-error";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false as const, message: "Invalid request body" }, { status: 400 });
    }

    const parsed = previewChangeBookingVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await previewChangeBookingVehicle(
      id,
      parsed.data.vehicleId,
      parsed.data.color,
      parsed.data.priceMode,
    );
    if (!result.ok) {
      return NextResponse.json(
        { success: false as const, message: changeBookingVehicleErrorMessage(result.reason, result.status) },
        { status: changeBookingVehicleStatusCode(result.reason) },
      );
    }

    return NextResponse.json({ success: true as const, preview: result.preview });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
