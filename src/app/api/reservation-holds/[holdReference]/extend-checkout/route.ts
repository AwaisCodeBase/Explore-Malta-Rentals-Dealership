import { NextResponse } from "next/server";

import { extendReservationHoldForCheckout, ReservationHoldStateError } from "@/lib/reservation-holds";

type RouteContext = {
  params: Promise<{
    holdReference?: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { holdReference: holdReferenceRaw } = await context.params;
  const holdReference = holdReferenceRaw?.trim();

  if (!holdReference) {
    return NextResponse.json(
      {
        success: false as const,
        message: "Hold reference is required",
      },
      { status: 400 },
    );
  }

  try {
    const hold = await extendReservationHoldForCheckout(holdReference);
    return NextResponse.json({
      success: true as const,
      holdReference: hold.holdReference,
      status: hold.status,
      expiresAt: hold.expiresAt,
      message: "Reservation hold extended for checkout",
    });
  } catch (error) {
    if (error instanceof ReservationHoldStateError) {
      return NextResponse.json(
        {
          success: false as const,
          status: error.holdStatus,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error("[reservation-holds] Failed checkout extension", { holdReference, error });
    return NextResponse.json(
      {
        success: false as const,
        message: "Unable to extend reservation hold right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
