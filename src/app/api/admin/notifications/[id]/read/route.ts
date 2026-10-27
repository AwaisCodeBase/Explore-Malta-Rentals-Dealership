import { NextResponse } from "next/server";

import { markAdminNotificationRead } from "@/lib/admin/notifications";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdminApi();
    const { id } = await context.params;

    const result = await markAdminNotificationRead(id);
    if (!result.ok) {
      return NextResponse.json(
        { success: false as const, message: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true as const,
      notification: result.notification,
    });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ success: false as const, message: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
