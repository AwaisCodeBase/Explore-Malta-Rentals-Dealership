import { NextResponse } from "next/server";

import {
  changeBookingVehicleErrorMessage,
  changeBookingVehicleStatusCode,
} from "@/lib/admin/bookings/change-booking-vehicle-error";
import { listChangeBookingVehicleOptions } from "@/lib/admin/bookings/changeBookingVehicle";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id } = await context.params;
    const result = await listChangeBookingVehicleOptions(id);
    if (!result.ok) {
      return NextResponse.json(
        { success: false as const, message: changeBookingVehicleErrorMessage(result.reason, result.status) },
        { status: changeBookingVehicleStatusCode(result.reason) },
      );
    }

    return NextResponse.json({ success: true as const, options: result.options });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
