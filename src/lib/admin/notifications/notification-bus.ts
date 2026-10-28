import { EventEmitter } from "node:events";

import type { AdminNotificationDto } from "@/lib/admin/notifications/types";

const EVENT_NAME = "admin-notification";

type AdminNotificationBus = EventEmitter & {
  publish(notification: AdminNotificationDto): void;
  subscribe(listener: (notification: AdminNotificationDto) => void): () => void;
};

const globalForBus = globalThis as unknown as {
  adminNotificationBus?: AdminNotificationBus;
};

function createBus(): AdminNotificationBus {
  const emitter = new EventEmitter() as AdminNotificationBus;
  emitter.setMaxListeners(100);

  emitter.publish = (notification: AdminNotificationDto) => {
    emitter.emit(EVENT_NAME, notification);
  };

  emitter.subscribe = (listener: (notification: AdminNotificationDto) => void) => {
    emitter.on(EVENT_NAME, listener);
    return () => {
      emitter.off(EVENT_NAME, listener);
    };
  };

  return emitter;
}

export const adminNotificationBus =
  globalForBus.adminNotificationBus ?? createBus();

if (process.env.NODE_ENV !== "production") {
  globalForBus.adminNotificationBus = adminNotificationBus;
}
