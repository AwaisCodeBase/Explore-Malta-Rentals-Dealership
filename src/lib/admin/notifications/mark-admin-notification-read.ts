import { prisma } from "@/lib/prisma";
import { mapAdminNotification } from "@/lib/admin/notifications/map-admin-notification";
import type { AdminNotificationDto } from "@/lib/admin/notifications/types";

export type MarkNotificationReadResult =
  | { ok: true; notification: AdminNotificationDto }
  | { ok: false; reason: "not_found" };

export async function markAdminNotificationRead(
  notificationId: string,
): Promise<MarkNotificationReadResult> {
  const existing = await prisma.adminNotification.findUnique({
    where: { id: notificationId },
    select: { id: true, isRead: true },
  });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  if (existing.isRead) {
    const row = await prisma.adminNotification.findUniqueOrThrow({
      where: { id: notificationId },
    });
    return { ok: true, notification: mapAdminNotification(row) };
  }

  const row = await prisma.adminNotification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return { ok: true, notification: mapAdminNotification(row) };
}

export async function markAllAdminNotificationsRead(): Promise<{ updatedCount: number }> {
  const result = await prisma.adminNotification.updateMany({
    where: { isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updatedCount: result.count };
}
