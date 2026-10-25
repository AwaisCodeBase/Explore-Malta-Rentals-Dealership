import { NextResponse } from "next/server";

import { formatZodError } from "@/lib/admin/bookings/format-zod-error";
import {
  replaceBookingVehicleErrorMessage,
  replaceBookingVehicleStatusCode,
} from "@/lib/admin/bookings/replace-booking-vehicle-error";
import { replaceBookingVehicleSchema } from "@/lib/admin/bookings/replace-booking-vehicle-schema";
import { replaceBookingVehicle } from "@/lib/admin/bookings/replaceBookingVehicle";
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

    const parsed = replaceBookingVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await replaceBookingVehicle(id, parsed.data, session.id);
    if (!result.ok) {
      return NextResponse.json(
        { success: false as const, message: replaceBookingVehicleErrorMessage(result.reason) },
        { status: replaceBookingVehicleStatusCode(result.reason) },
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
