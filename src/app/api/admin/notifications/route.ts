import { NextResponse } from "next/server";

import { listAdminNotifications } from "@/lib/admin/notifications";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireAdminApi();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const result = await listAdminNotifications({
      unreadOnly,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({
      success: true as const,
      items: result.items,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
