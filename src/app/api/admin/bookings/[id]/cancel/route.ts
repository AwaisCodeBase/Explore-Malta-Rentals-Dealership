import { NextResponse } from "next/server";

import { formatZodError } from "@/lib/admin/bookings/format-zod-error";
import { cancelBooking, cancelBookingSchema } from "@/lib/admin/bookings/lifecycle";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";
import { sendBookingCancellation } from "@/lib/email/sendBookingCancellation";

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

    const parsed = cancelBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, message: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const result = await cancelBooking(id, parsed.data, session.id);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ success: false as const, message: "Booking not found" }, { status: 404 });
      }
      return NextResponse.json(
        { success: false as const, message: "This action is not allowed for the current booking status." },
        { status: 409 },
      );
    }

    const emailResult = await sendBookingCancellation({
      to: result.booking.customerEmail,
      subject: parsed.data.emailSubject,
      body: parsed.data.emailBody,
      bookingReference: result.booking.bookingReference,
    });

    return NextResponse.json({
      success: true as const,
      booking: result.booking,
      emailSent: emailResult.success,
      message: emailResult.success
        ? undefined
        : "The booking was cancelled, but the customer email could not be sent. Please contact the customer directly.",
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
