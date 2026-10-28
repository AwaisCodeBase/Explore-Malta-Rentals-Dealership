import { NextResponse } from "next/server";

import {
  replaceBookingVehicleErrorMessage,
  replaceBookingVehicleStatusCode,
} from "@/lib/admin/bookings/replace-booking-vehicle-error";
import { listReplaceBookingVehicleOptions } from "@/lib/admin/bookings/replaceBookingVehicle";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id } = await context.params;
    const result = await listReplaceBookingVehicleOptions(id);
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false as const,
          message: replaceBookingVehicleErrorMessage(result.reason, result.returnDateTime),
        },
        { status: replaceBookingVehicleStatusCode(result.reason) },
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
