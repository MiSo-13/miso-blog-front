export type NotificationTone = "success" | "error" | "info" | "warning";

export type AppNotification = {
  id: string;
  tone: NotificationTone;
  title: string;
  message?: string;
  actionGuide?: string;
  createdAt: number;
  durationMs: number;
};

type NotificationInput = {
  tone: NotificationTone;
  title: string;
  message?: string;
  actionGuide?: string;
  durationMs?: number;
  dedupeKey?: string;
  dedupeMs?: number;
};

type Listener = () => void;

let nextId = 1;
let notifications: AppNotification[] = [];
const listeners = new Set<Listener>();
const recentByKey = new Map<string, number>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getNotifications() {
  return notifications;
}

export function subscribeNotifications(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify(input: NotificationInput) {
  const now = Date.now();
  const dedupeMs = input.dedupeMs ?? 4000;

  if (input.dedupeKey) {
    const lastShownAt = recentByKey.get(input.dedupeKey);
    if (lastShownAt && now - lastShownAt < dedupeMs) {
      return null;
    }
    recentByKey.set(input.dedupeKey, now);
  }

  const notification: AppNotification = {
    id: String(nextId++),
    tone: input.tone,
    title: input.title,
    message: input.message,
    actionGuide: input.actionGuide,
    createdAt: now,
    durationMs: input.durationMs ?? (input.tone === "error" ? 7000 : 4200),
  };

  notifications = [...notifications, notification].slice(-4);
  emitChange();
  return notification.id;
}

export function dismissNotification(id: string) {
  notifications = notifications.filter((notification) => notification.id !== id);
  emitChange();
}
