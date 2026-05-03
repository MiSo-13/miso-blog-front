import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { dismissNotification, getNotifications, subscribeNotifications } from "../lib/notifications";
import type { AppNotification, NotificationTone } from "../lib/notifications";
import { cn } from "../lib/cn";

const toneClass: Record<NotificationTone, { icon: typeof CheckCircle2; wrap: string; iconClass: string }> = {
  success: {
    icon: CheckCircle2,
    wrap: "border-emerald-200 bg-white text-gray-900 shadow-emerald-900/10 dark:border-emerald-500/25 dark:bg-zinc-900 dark:text-zinc-50",
    iconClass: "text-emerald-600 dark:text-emerald-300",
  },
  error: {
    icon: AlertTriangle,
    wrap: "border-red-200 bg-white text-gray-900 shadow-red-900/10 dark:border-red-500/25 dark:bg-zinc-900 dark:text-zinc-50",
    iconClass: "text-red-600 dark:text-red-300",
  },
  warning: {
    icon: AlertTriangle,
    wrap: "border-amber-200 bg-white text-gray-900 shadow-amber-900/10 dark:border-amber-500/25 dark:bg-zinc-900 dark:text-zinc-50",
    iconClass: "text-amber-600 dark:text-amber-300",
  },
  info: {
    icon: Info,
    wrap: "border-blue-200 bg-white text-gray-900 shadow-blue-900/10 dark:border-blue-500/25 dark:bg-zinc-900 dark:text-zinc-50",
    iconClass: "text-blue-600 dark:text-blue-300",
  },
};

function useNotifications() {
  return useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications);
}

export default function ToastViewport() {
  const notifications = useNotifications();

  useEffect(() => {
    const timers = notifications.map((notification) => {
      const elapsedMs = Date.now() - notification.createdAt;
      const remainingMs = Math.max(notification.durationMs - elapsedMs, 500);
      return window.setTimeout(() => dismissNotification(notification.id), remainingMs);
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6">
      {notifications.map((notification) => (
        <ToastItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

function ToastItem({ notification }: { notification: AppNotification }) {
  const classes = toneClass[notification.tone];
  const Icon = classes.icon;

  return (
    <section
      className={cn(
        "rounded-lg border p-4 shadow-xl backdrop-blur-md transition",
        classes.wrap,
      )}
      role={notification.tone === "error" ? "alert" : "status"}
    >
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 shrink-0", classes.iconClass)} size={20} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold">{notification.title}</h2>
          {notification.message ? (
            <p className="mt-1 text-sm leading-5 text-gray-600 dark:text-zinc-300">{notification.message}</p>
          ) : null}
          {notification.actionGuide ? (
            <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600 dark:bg-zinc-950 dark:text-zinc-300">
              {notification.actionGuide}
            </p>
          ) : null}
        </div>
        <button
          className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="알림 닫기"
          title="알림 닫기"
          type="button"
          onClick={() => dismissNotification(notification.id)}
        >
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
