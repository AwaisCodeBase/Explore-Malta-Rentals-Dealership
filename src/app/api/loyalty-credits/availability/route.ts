import { NextResponse } from "next/server";

import { findAvailableLoyaltyCreditOffer } from "@/lib/loyalty/loyalty-credit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Tells the booking form whether the email has one €5 credit available.
 * The response has no customer name, booking, or credit identifier.
 * The booking transaction decides redemption. This response is not proof of ownership.
 */
export async function POST(request: Request) {
  let email = "";
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "email" in body && typeof body.email === "string") {
      email = body.email;
    }
  } catch {
    email = "";
  }

  const offer = await findAvailableLoyaltyCreditOffer(prisma, email);
  return NextResponse.json(offer);
}
