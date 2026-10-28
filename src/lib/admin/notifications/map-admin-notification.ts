import type { AdminNotification, Prisma } from "@/generated/prisma/index";

import type { AdminNotificationDto } from "@/lib/admin/notifications/types";

type NotificationRow = Pick<
  AdminNotification,
  | "id"
  | "type"
  | "title"
  | "message"
  | "bookingId"
  | "bookingReference"
  | "metadata"
  | "isRead"
  | "readAt"
  | "createdByAdminId"
  | "createdAt"
>;

export function mapAdminNotification(row: NotificationRow): AdminNotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    bookingId: row.bookingId,
    bookingReference: row.bookingReference,
    metadata: (row.metadata ?? null) as Prisma.JsonValue | null,
    isRead: row.isRead,
    readAt: row.readAt?.toISOString() ?? null,
    createdByAdminId: row.createdByAdminId,
    createdAt: row.createdAt.toISOString(),
  };
}
