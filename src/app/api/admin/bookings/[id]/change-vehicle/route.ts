import { NextResponse } from "next/server";

import {
  changeBookingVehicleErrorMessage,
  changeBookingVehicleStatusCode,
} from "@/lib/admin/bookings/change-booking-vehicle-error";
import { changeBookingVehicleSchema } from "@/lib/admin/bookings/change-booking-vehicle-schema";
import { changeBookingVehicle } from "@/lib/admin/bookings/changeBookingVehicle";
import { formatZodError } from "@/lib/admin/bookings/format-zod-error";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false as const, message: "Invalid request body" }, { status: 400 });
    }

    const parsed = changeBookingVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await changeBookingVehicle(
      id,
      parsed.data.vehicleId,
      parsed.data.color,
      parsed.data.priceMode,
      session.id,
      parsed.data.expectedUpdatedAt,
    );
    if (!result.ok) {
      return NextResponse.json(
        { success: false as const, message: changeBookingVehicleErrorMessage(result.reason, result.status) },
        { status: changeBookingVehicleStatusCode(result.reason) },
      );
    }

    return NextResponse.json({ success: true as const, booking: result.booking });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
