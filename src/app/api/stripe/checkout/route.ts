import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/payment-service";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for a confirmed (but unpaid) booking.
 * Body: { bookingReference: string; locale?: string }
 * Returns: { ok: true; checkoutUrl: string } | { ok: false; error: string }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("bookingReference" in body) ||
    typeof (body as Record<string, unknown>).bookingReference !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "bookingReference is required" }, { status: 400 });
  }

  const bookingReference = (body as Record<string, unknown>).bookingReference as string;
  const locale = typeof (body as Record<string, unknown>).locale === "string"
    ? ((body as Record<string, unknown>).locale as string)
    : "en";

  // Look up the booking
  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    select: {
      id: true,
      bookingReference: true,
      customerEmail: true,
      customerFullName: true,
      vehicleNameSnapshot: true,
      pickupDateTime: true,
      returnDateTime: true,
      totalDueOnline: true,
      paymentStatus: true,
      status: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json(
      { ok: false, error: "This booking was cancelled because payment was not completed in time" },
      { status: 409 },
    );
  }

  if (booking.status !== "PENDING_PAYMENT" && booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { ok: false, error: "This booking cannot accept online payment" },
      { status: 409 },
    );
  }

  if (booking.paymentStatus === "PAID") {
    return NextResponse.json({ ok: false, error: "This booking has already been paid" }, { status: 409 });
  }

  if (booking.paymentStatus === "REFUNDED") {
    return NextResponse.json({ ok: false, error: "This booking has been refunded" }, { status: 409 });
  }

  const amountEur = booking.totalDueOnline.toNumber();

  if (amountEur <= 0) {
    return NextResponse.json(
      { ok: false, error: "No online payment is due for this booking" },
      { status: 422 },
    );
  }

  const result = await createCheckoutSession({
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    customerEmail: booking.customerEmail,
    customerName: booking.customerFullName,
    vehicleName: booking.vehicleNameSnapshot ?? "Vehicle",
    pickupDate: format(booking.pickupDateTime, "dd MMM yyyy"),
    returnDate: format(booking.returnDateTime, "dd MMM yyyy"),
    amountEur,
    locale,
  });

  if (!result.ok) {
    console.error("[api/stripe/checkout] Failed to create session", { bookingReference, error: result.error });
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkoutUrl: result.checkoutUrl });
}
