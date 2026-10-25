import { NextResponse } from "next/server";

import { bookingExtensionErrorMessage } from "@/lib/admin/bookings/booking-extension-error";
import { getBookingExtensionAvailability } from "@/lib/admin/bookings/extendBooking";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id } = await context.params;
    const result = await getBookingExtensionAvailability(id);
    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 409;
      return NextResponse.json(
        { success: false as const, message: bookingExtensionErrorMessage(result.reason) },
        { status },
      );
    }

    return NextResponse.json({ success: true as const, availability: result.availability });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
