"use client";

import {
  Bell,
  CalendarPlus,
  Car,
  Check,
  CheckCheck,
  CreditCard,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { AdminNotificationDto } from "@/lib/admin/notifications";

type AdminNotificationsBellProps = Readonly<{
  locale: string;
}>;

type ReadyPayload = {
  unreadCount: number;
  items: AdminNotificationDto[];
};

function typeIcon(type: AdminNotificationDto["type"]) {
  switch (type) {
    case "BOOKING_CREATED":
      return CalendarPlus;
    case "BOOKING_CANCELLED":
      return XCircle;
    case "PAYMENT_RECEIVED":
      return CreditCard;
    case "BOOKING_EXTENDED":
      return CalendarPlus;
    case "VEHICLE_CHANGED":
      return RefreshCw;
    case "VEHICLE_HANDED_OVER":
      return Car;
    case "VEHICLE_REPLACED":
      return RefreshCw;
    case "VEHICLE_RETURNED":
      return RotateCcw;
    default:
      return Bell;
  }
}

function formatRelativeTime(
  iso: string,
  labels: {
    justNow: string;
    minutesAgo: (count: number) => string;
    hoursAgo: (count: number) => string;
    daysAgo: (count: number) => string;
  },
): string {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - created) / 1000));
  if (diffSec < 60) return labels.justNow;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return labels.minutesAgo(diffMin);
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return labels.hoursAgo(diffHr);
  const diffDay = Math.round(diffHr / 24);
  return labels.daysAgo(diffDay);
}

export function AdminNotificationsBell({ locale }: AdminNotificationsBellProps) {
  const t = useTranslations("Admin");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const mergeIncoming = useCallback((incoming: AdminNotificationDto[]) => {
    setItems((prev) => {
      const byId = new Map(prev.map((item) => [item.id, item]));
      for (const item of incoming) {
        byId.set(item.id, item);
        seenIdsRef.current.add(item.id);
      }
      return [...byId.values()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 40);
    });
  }, []);

  const applyNotification = useCallback(
    (notification: AdminNotificationDto) => {
      if (seenIdsRef.current.has(notification.id)) {
        setItems((prev) =>
          prev.map((item) => (item.id === notification.id ? notification : item)),
        );
        return;
      }
      seenIdsRef.current.add(notification.id);
      mergeIncoming([notification]);
      if (!notification.isRead) {
        setUnreadCount((count) => count + 1);
      }
    },
    [mergeIncoming],
  );

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      source?.close();
      source = new EventSource("/api/admin/notifications/stream");

      source.addEventListener("ready", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as ReadyPayload;
          if (cancelled) return;
          seenIdsRef.current = new Set(payload.items.map((item) => item.id));
          setItems(payload.items);
          setUnreadCount(payload.unreadCount);
          setLoading(false);
        } catch {
          setLoading(false);
        }
      });

      source.addEventListener("notification", (event) => {
        try {
          const notification = JSON.parse(
            (event as MessageEvent).data,
          ) as AdminNotificationDto;
          if (!cancelled) {
            applyNotification(notification);
          }
        } catch {
          /* ignore malformed */
        }
      });

      // Server closes cleanly before Vercel maxDuration; reconnect immediately.
      source.addEventListener("reconnect", () => {
        source?.close();
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 250);
        }
      });

      source.onerror = () => {
        source?.close();
        if (!cancelled) {
          setLoading(false);
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [applyNotification]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function markRead(notification: AdminNotificationDto) {
    if (notification.isRead || markingId) return;
    setMarkingId(notification.id);
    try {
      const response = await fetch(`/api/admin/notifications/${notification.id}/read`, {
        method: "POST",
      });
      if (!response.ok) return;
      const body = (await response.json()) as {
        success: boolean;
        notification?: AdminNotificationDto;
      };
      if (!body.success || !body.notification) return;
      setItems((prev) =>
        prev.map((item) => (item.id === body.notification!.id ? body.notification! : item)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } finally {
      setMarkingId(null);
    }
  }

  async function markAllRead() {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const response = await fetch("/api/admin/notifications/read-all", { method: "POST" });
      if (!response.ok) return;
      setItems((prev) =>
        prev.map((item) =>
          item.isRead ? item : { ...item, isRead: true, readAt: new Date().toISOString() },
        ),
      );
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  const relativeLabels = {
    justNow: t("notifications.justNow"),
    minutesAgo: (count: number) => t("notifications.minutesAgo", { count }),
    hoursAgo: (count: number) => t("notifications.hoursAgo", { count }),
    daysAgo: (count: number) => t("notifications.daysAgo", { count }),
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={[
          "relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full border bg-white text-slate-500 shadow-sm transition duration-200 hover:border-[#3a7ca5]/25 hover:bg-slate-50 hover:text-[#3a7ca5] hover:shadow-md active:scale-95",
          open ? "border-[#3a7ca5]/40 text-[#3a7ca5] shadow-md" : "border-slate-200",
        ].join(" ")}
        aria-label={t("notificationsLabel")}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="size-[18px]" aria-hidden />
        {badgeLabel ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[#c45c26] px-1 text-[10px] font-bold leading-4 text-white">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("notificationsLabel")}
          className="absolute right-0 mt-2 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("notificationsLabel")}</p>
              <p className="text-xs text-slate-500">
                {t("notifications.unreadCount", { count: unreadCount })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#3a7ca5] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {markingAll ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <CheckCheck className="size-3.5" aria-hidden />
              )}
              {t("notifications.markAllRead")}
            </button>
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("notifications.loading")}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                {t("notifications.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const Icon = typeIcon(item.type);
                  const href = item.bookingId
                    ? `/${locale}/admin/bookings/${item.bookingId}`
                    : null;
                  const content = (
                    <>
                      <span
                        className={[
                          "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                          item.isRead
                            ? "bg-slate-100 text-slate-500"
                            : "bg-[#3a7ca5]/12 text-[#3a7ca5]",
                        ].join(" ")}
                      >
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={[
                              "truncate text-sm",
                              item.isRead
                                ? "font-medium text-slate-700"
                                : "font-semibold text-slate-950",
                            ].join(" ")}
                          >
                            {item.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {formatRelativeTime(item.createdAt, relativeLabels)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                          {item.message}
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <li
                      key={item.id}
                      className={item.isRead ? "bg-white" : "bg-[rgba(58,124,165,0.04)]"}
                    >
                      <div className="flex items-stretch">
                        {href ? (
                          <Link
                            href={href}
                            onClick={() => {
                              setOpen(false);
                              void markRead(item);
                            }}
                            className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void markRead(item)}
                            className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            {content}
                          </button>
                        )}
                        {!item.isRead ? (
                          <button
                            type="button"
                            title={t("notifications.markRead")}
                            aria-label={t("notifications.markRead")}
                            disabled={markingId === item.id}
                            onClick={() => void markRead(item)}
                            className="inline-flex shrink-0 cursor-pointer items-center px-3 text-slate-400 transition hover:bg-slate-50 hover:text-[#3a7ca5] disabled:opacity-50"
                          >
                            {markingId === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Check className="size-3.5" aria-hidden />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
