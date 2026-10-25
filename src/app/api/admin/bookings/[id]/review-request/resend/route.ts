import { NextResponse } from "next/server";

import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";
import { resendBookingReviewRequest } from "@/lib/reviews/resend-review-request";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireAdminApi();
    const { id } = await context.params;
    const result = await resendBookingReviewRequest(id, session.id);

    if (!result.ok) {
      const status =
        result.reason === "not_found"
          ? 404
          : result.reason === "invalid_email"
            ? 422
            : result.reason === "send_failed"
              ? 502
              : 409;
      return NextResponse.json({ success: false as const, message: result.message }, { status });
    }

    return NextResponse.json({
      success: true as const,
      message: "Review request email sent.",
      deliveryMode: result.deliveryMode,
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
