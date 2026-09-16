import { prisma } from "@/lib/db";

export type PushNotificationType =
  | "workout_reminder"
  | "meal_reminder"
  | "checkin_reminder"
  | "achievement"
  | "coach_message"
  | "program_update"
  | "payment_reminder";

type PreferenceRow = {
  enabled: boolean;
  pushEnabled: boolean;
  workoutReminders: boolean;
  nutritionTips: boolean;
  progressUpdates: boolean;
  checkinReminders: boolean;
  messageNotifications: boolean;
  paymentReminders: boolean;
  timezone: string;
  quietStart: string | null;
  quietEnd: string | null;
};

function preferenceAllows(type: PushNotificationType | undefined, prefs: PreferenceRow) {
  if (!prefs.enabled || !prefs.pushEnabled) return false;
  if (!type) return true;
  switch (type) {
    case "workout_reminder": return prefs.workoutReminders;
    case "meal_reminder": return prefs.nutritionTips;
    case "checkin_reminder": return prefs.checkinReminders;
    case "achievement":
    case "program_update": return prefs.progressUpdates;
    case "coach_message": return prefs.messageNotifications;
    case "payment_reminder": return prefs.paymentReminders;
  }
}

function hourMinuteInTimeZone(timeZone: string, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    return null;
  }
}

function isQuietHours(prefs: PreferenceRow, date = new Date()) {
  if (!prefs.quietStart || !prefs.quietEnd) return false;
  const start = parseTime(prefs.quietStart);
  const end = parseTime(prefs.quietEnd);
  const now = hourMinuteInTimeZone(prefs.timezone || "UTC", date);
  if (start === null || end === null || now === null) return false;
  if (start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export async function sendPushToUser(input: {
  userId: string;
  type?: PushNotificationType;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
  ttl?: number;
}) {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return { sent: 0, failed: 0, skipped: 1, reason: "not_configured" as const };

  const [subscriptions, prefs] = await Promise.all([
    prisma.pushSubscription.findMany({
      where: { userId: input.userId, active: true },
      select: { endpoint: true, p256dh: true, auth: true },
      take: 20,
    }),
    prisma.notificationPreference.findUnique({
      where: { userId: input.userId },
      select: {
        enabled: true,
        pushEnabled: true,
        workoutReminders: true,
        nutritionTips: true,
        progressUpdates: true,
        checkinReminders: true,
        messageNotifications: true,
        paymentReminders: true,
        timezone: true,
        quietStart: true,
        quietEnd: true,
      },
    }),
  ]);

  const effectivePrefs: PreferenceRow = prefs ?? {
    enabled: true,
    pushEnabled: true,
    workoutReminders: true,
    nutritionTips: true,
    progressUpdates: true,
    checkinReminders: true,
    messageNotifications: true,
    paymentReminders: true,
    timezone: "UTC",
    quietStart: null,
    quietEnd: null,
  };

  if (!preferenceAllows(input.type, effectivePrefs) || isQuietHours(effectivePrefs)) {
    return { sent: 0, failed: 0, skipped: subscriptions.length, reason: "preferences" as const };
  }

  if (subscriptions.length === 0) return { sent: 0, failed: 0, skipped: 0, reason: "no_subscription" as const };

  const webPush = await import("web-push");
  webPush.setVapidDetails("mailto:noreply@kinetixfitt.com", publicKey, privateKey);
  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url: input.url || "/client/dashboard",
    data: { ...(input.data || {}), ...(input.type ? { type: input.type } : {}) },
    timestamp: Date.now(),
  });

  const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload,
        { TTL: Math.min(Math.max(input.ttl ?? 86400, 60), 604800) },
      );
      return true;
    } catch (error: unknown) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode?: unknown }).statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.updateMany({ where: { endpoint: subscription.endpoint }, data: { active: false } }).catch(() => undefined);
      }
      console.error("[PUSH] delivery failed", { userId: input.userId, statusCode });
      return false;
    }
  }));

  const sent = results.filter((result) => result.status === "fulfilled" && result.value).length;
  return { sent, failed: results.length - sent, skipped: 0, reason: "delivered" as const };
}
