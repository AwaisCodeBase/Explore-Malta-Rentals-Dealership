import { NextResponse } from "next/server";

import { bookingExtensionErrorMessage } from "@/lib/admin/bookings/booking-extension-error";
import { previewBookingExtensionSchema } from "@/lib/admin/bookings/extend-booking-schema";
import { previewBookingExtension } from "@/lib/admin/bookings/extendBooking";
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
    await requireAdminApi();
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false as const, message: "Invalid request body" }, { status: 400 });
    }

    const parsed = previewBookingExtensionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await previewBookingExtension(id, parsed.data.newReturnDateTime);
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false as const,
          message: bookingExtensionErrorMessage(result.reason, result.conflict),
        },
        { status: statusForReason(result.reason) },
      );
    }

    return NextResponse.json({
      success: true as const,
      preview: result.preview,
      message: result.preview.available
        ? null
        : bookingExtensionErrorMessage("unit_conflict", result.preview.conflict),
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
