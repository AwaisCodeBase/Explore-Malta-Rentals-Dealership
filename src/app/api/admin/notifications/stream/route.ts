import {
  adminNotificationBus,
  listAdminNotifications,
  listAdminNotificationsSince,
  type AdminNotificationDto,
} from "@/lib/admin/notifications";
import { AdminUnauthorizedError, requireAdminApi } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Vercel Pro serverless max is 300s. Closing slightly earlier lets us send a
 * clean `reconnect` event instead of a hard "Task timed out after 300 seconds".
 */
export const maxDuration = 300;

const HEARTBEAT_MS = 15_000;
const DB_POLL_MS = 5_000;
/** Leave ~25s buffer before Vercel's hard kill so reconnect is graceful. */
const STREAM_MAX_MS = 275_000;

function encodeSse(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: Request) {
  try {
    await requireAdminApi();
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw error;
  }

  let lastSeenAt = new Date();
  let closed = false;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribe: (() => void) | null = null;
  const seenIds = new Set<string>();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encodeSse(event, data));
        } catch {
          cleanup();
        }
      };

      const pushNotification = (notification: AdminNotificationDto) => {
        if (seenIds.has(notification.id)) return;
        seenIds.add(notification.id);
        const createdAt = new Date(notification.createdAt);
        if (createdAt > lastSeenAt) {
          lastSeenAt = createdAt;
        }
        push("notification", notification);
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (pollTimer) clearInterval(pollTimer);
        if (maxTimer) clearTimeout(maxTimer);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const abort = () => {
        cleanup();
      };
      request.signal.addEventListener("abort", abort);

      try {
        const initial = await listAdminNotifications({ limit: 30 });
        for (const item of initial.items) {
          seenIds.add(item.id);
        }
        if (initial.items[0]) {
          lastSeenAt = new Date(initial.items[0].createdAt);
        }
        push("ready", {
          unreadCount: initial.unreadCount,
          items: initial.items,
        });
      } catch (error) {
        push("error", { message: "Failed to load notifications" });
        console.error("[admin-notifications/stream] initial load failed", error);
        cleanup();
        return;
      }

      unsubscribe = adminNotificationBus.subscribe((notification) => {
        pushNotification(notification);
      });

      heartbeatTimer = setInterval(() => {
        push("heartbeat", { at: new Date().toISOString() });
      }, HEARTBEAT_MS);

      // DB poll covers multi-instance Vercel: in-memory bus only reaches
      // subscribers on the same function instance.
      pollTimer = setInterval(() => {
        void (async () => {
          if (closed) return;
          try {
            const newer = await listAdminNotificationsSince(lastSeenAt);
            for (const item of newer) {
              pushNotification(item);
            }
          } catch (error) {
            console.error("[admin-notifications/stream] poll failed", error);
          }
        })();
      }, DB_POLL_MS);

      maxTimer = setTimeout(() => {
        push("reconnect", { reason: "max_duration" });
        cleanup();
      }, STREAM_MAX_MS);
    },
    cancel() {
      closed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (maxTimer) clearTimeout(maxTimer);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
