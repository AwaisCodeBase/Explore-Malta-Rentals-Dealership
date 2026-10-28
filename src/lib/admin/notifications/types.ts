import type { AdminNotificationType, Prisma } from "@/generated/prisma/index";

export type AdminNotificationDto = {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  bookingId: string | null;
  bookingReference: string | null;
  metadata: Prisma.JsonValue | null;
  isRead: boolean;
  readAt: string | null;
  createdByAdminId: string | null;
  createdAt: string;
};

export type CreateAdminNotificationInput = {
  type: AdminNotificationType;
  title: string;
  message: string;
  bookingId?: string | null;
  bookingReference?: string | null;
  metadata?: Prisma.InputJsonValue;
  createdByAdminId?: string | null;
};

export type AdminNotificationListResult = {
  items: AdminNotificationDto[];
  unreadCount: number;
};
