import { prisma } from "@/lib/prisma";
import { adminNotificationBus } from "@/lib/admin/notifications/notification-bus";
import { mapAdminNotification } from "@/lib/admin/notifications/map-admin-notification";
import type {
  AdminNotificationDto,
  CreateAdminNotificationInput,
} from "@/lib/admin/notifications/types";

export async function createAdminNotification(
  input: CreateAdminNotificationInput,
): Promise<AdminNotificationDto> {
  const row = await prisma.adminNotification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      bookingId: input.bookingId ?? null,
      bookingReference: input.bookingReference ?? null,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      createdByAdminId: input.createdByAdminId ?? null,
    },
  });

  const dto = mapAdminNotification(row);
  adminNotificationBus.publish(dto);
  return dto;
}

/** Never fails the parent booking mutation if notification persistence fails. */
export async function notifyAdminSafe(input: CreateAdminNotificationInput): Promise<void> {
  try {
    await createAdminNotification(input);
  } catch (error) {
    console.error("[admin-notifications] failed to create notification", {
      type: input.type,
      bookingId: input.bookingId ?? null,
      error,
    });
  }
}
