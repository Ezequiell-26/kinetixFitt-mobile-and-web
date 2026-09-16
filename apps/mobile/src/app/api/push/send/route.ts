import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canReceivePush } from "@/lib/push-server";
import type { PushPreferenceSnapshot } from "@/lib/push-server";

const notificationTypeSchema = z.enum([
  "workout_reminder",
  "meal_reminder",
  "checkin_reminder",
  "achievement",
  "coach_message",
  "program_update",
  "payment_reminder",
]);

const sendNotificationSchema = z.object({
  userIds: z.array(z.string().min(1).max(64)).max(500).optional(),
  userRole: z.enum(["TRAINER", "CLIENT"]).optional(),
  type: notificationTypeSchema.optional(),
  title: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(500),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
  url: z.string().url().optional(),
  data: z.record(z.unknown()).optional(),
  ttl: z.number().int().min(60).max(604800).optional().default(86400),
}).superRefine((value, ctx) => {
  if ((!value.userIds || value.userIds.length === 0) && !value.userRole) {
    ctx.addIssue({ code: "custom", path: ["userIds"], message: "Debe indicar userIds o userRole" });
  }
});

function safeSecretEqual(received: string, expected: string) {
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function isAuthorizedInternalRequest(request: NextRequest) {
  const configured = process.env.KINETIX_INTERNAL_API_SECRET;
  if (!configured) return false;
  const auth = request.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") && safeSecretEqual(auth.slice(7), configured);
}

const defaultPreferences: PushPreferenceSnapshot = {
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

export async function POST(request: NextRequest) {
  if (!isAuthorizedInternalRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "Push no configurado" }, { status: 503 });
  }

  try {
    const parsed = sendNotificationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const { userIds, userRole, type, title, body: messageBody, icon, badge, url, data, ttl } = parsed.data;
    const where = {
      active: true,
      ...(userIds?.length ? { userId: { in: userIds } } : {}),
      ...(userRole ? { user: { role: userRole } } : {}),
    };

    const subscriptions = await prisma.pushSubscription.findMany({
      where,
      select: { endpoint: true, p256dh: true, auth: true, userId: true },
      take: 500,
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0, skipped: 0 });
    }

    const userIdsToCheck = [...new Set(subscriptions.map((subscription) => subscription.userId))];
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: { in: userIdsToCheck } },
      select: {
        userId: true,
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
    });
    const preferenceMap = new Map(preferences.map((prefs) => [prefs.userId, prefs]));
    const now = new Date();
    const eligible = subscriptions.filter((subscription) => {
      const prefs = preferenceMap.get(subscription.userId) ?? defaultPreferences;
      return canReceivePush(type, prefs, now);
    });

    if (eligible.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, total: subscriptions.length, skipped: subscriptions.length });
    }

    const webPush = await import("web-push");
    webPush.setVapidDetails("mailto:noreply@kinetixfitt.com", vapidPublicKey, vapidPrivateKey);

    const notificationPayload = {
      title,
      body: messageBody,
      icon: icon || "/icons/icon-192.png",
      badge: badge || "/icons/icon-192.png",
      url: url || "/client/dashboard",
      data: { ...(data || {}), ...(type ? { type } : {}) },
      timestamp: Date.now(),
    };

    const results = await Promise.allSettled(
      eligible.map(async (subscription) => {
        try {
          if (!subscription.p256dh || !subscription.auth) throw new Error("Subscription keys missing");
          await webPush.sendNotification(
            { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
            JSON.stringify(notificationPayload),
            { TTL: ttl },
          );
          return { success: true };
        } catch (error: unknown) {
          const statusCode = typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : 0;
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription.updateMany({ where: { endpoint: subscription.endpoint }, data: { active: false } }).catch(() => undefined);
          }
          console.error("[PUSH] subscription delivery failed", { statusCode });
          return { success: false };
        }
      }),
    );

    const sent = results.filter((result) => result.status === "fulfilled" && result.value.success).length;
    const failed = results.length - sent;
    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: eligible.length,
      skipped: subscriptions.length - eligible.length,
    });
  } catch (error) {
    console.error("[PUSH] Error enviando notificación", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
