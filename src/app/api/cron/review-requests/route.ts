import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/reviews/cron-auth";
import { processDueReviewRequests } from "@/lib/reviews/process-due-review-requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (!secret) {
    console.error("[review-request] CRON_SECRET is not configured");
    return NextResponse.json(
      { success: false as const, message: "Review request processor is not configured" },
      { status: 503 },
    );
  }

  if (!isAuthorizedCronRequest(request, secret)) {
    return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueReviewRequests();
  return NextResponse.json({ success: true as const, ...result });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handle(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handle(request);
}
