import { NextResponse } from "next/server";

import { bookingExtensionErrorMessage } from "@/lib/admin/bookings/booking-extension-error";
import { extendBookingSchema } from "@/lib/admin/bookings/extend-booking-schema";
import { extendBooking } from "@/lib/admin/bookings/extendBooking";
import { formatZodError } from "@/lib/admin/bookings/format-zod-error";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function statusForReason(reason: string): number {
  if (reason === "not_found") return 404;
  if (reason === "invalid_return" || reason === "exceeds_max_days" || reason === "invalid_pricing") {
    return 400;
  }
  return 409;
}

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

    const parsed = extendBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await extendBooking(
      id,
      parsed.data.newReturnDateTime,
      session.id,
      parsed.data.expectedUpdatedAt,
    );
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false as const,
          message: bookingExtensionErrorMessage(result.reason, result.conflict),
        },
        { status: statusForReason(result.reason) },
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
