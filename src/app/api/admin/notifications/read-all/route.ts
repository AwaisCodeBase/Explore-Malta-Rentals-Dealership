import { NextResponse } from "next/server";

import { markAllAdminNotificationsRead } from "@/lib/admin/notifications";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

export async function POST() {
  try {
    await requireAdminApi();
    const result = await markAllAdminNotificationsRead();
    return NextResponse.json({
      success: true as const,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
