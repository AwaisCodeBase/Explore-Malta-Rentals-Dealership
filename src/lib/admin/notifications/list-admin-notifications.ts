import { prisma } from "@/lib/prisma";
import { mapAdminNotification } from "@/lib/admin/notifications/map-admin-notification";
import type { AdminNotificationListResult } from "@/lib/admin/notifications/types";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export async function listAdminNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<AdminNotificationListResult> {
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const where = options?.unreadOnly ? { isRead: false } : undefined;

  const [items, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.adminNotification.count({ where: { isRead: false } }),
  ]);

  return {
    items: items.map(mapAdminNotification),
    unreadCount,
  };
}

export async function listAdminNotificationsSince(
  since: Date,
  limit = 50,
): Promise<AdminNotificationListResult["items"]> {
  const items = await prisma.adminNotification.findMany({
    where: { createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), MAX_LIMIT),
  });
  return items.map(mapAdminNotification);
}
