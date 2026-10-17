import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/payment-service";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

/**
 * GET /api/stripe/checkout-redirect?ref=EMR-xxx&locale=en
 * Creates a new Stripe Checkout Session and immediately redirects to it.
 * Used by the payment cancel page "Retry Payment" button.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingReference = searchParams.get("ref");
  const locale = searchParams.get("locale") ?? "en";

  if (!bookingReference) {
    return NextResponse.redirect(new URL(`/${locale}/booking`, request.url));
  }

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

  if (
    !booking ||
    booking.paymentStatus === "PAID" ||
    booking.status === "CANCELLED" ||
    (booking.status !== "PENDING_PAYMENT" && booking.status !== "CONFIRMED")
  ) {
    return NextResponse.redirect(
      new URL(`/${locale}/booking/payment/cancel?ref=${encodeURIComponent(bookingReference)}`, request.url),
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
    amountEur: booking.totalDueOnline.toNumber(),
    locale,
  });

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/${locale}/booking/payment/cancel?ref=${encodeURIComponent(bookingReference)}`, request.url),
    );
  }

  return NextResponse.redirect(result.checkoutUrl);
}
