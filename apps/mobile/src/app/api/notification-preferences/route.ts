import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const typeSchema = z.enum([
  "workout_reminder",
  "meal_reminder",
  "checkin_reminder",
  "achievement",
  "coach_message",
  "program_update",
  "payment_reminder",
]);

const preferencesSchema = z.object({
  enabled: z.boolean().optional(),
  types: z.array(typeSchema).optional(),
  schedule: z.object({
    startHour: z.number().int().min(0).max(23).optional(),
    endHour: z.number().int().min(0).max(23).optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
  }).optional(),
  channels: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
  }).optional(),
});

const DEFAULTS = {
  enabled: true,
  types: typeSchema.options,
  schedule: { startHour: 8, endHour: 21, timezone: "America/Argentina/Buenos_Aires" },
  channels: { email: true, push: true, sms: false, whatsapp: false },
};

type PreferenceRecord = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  workoutReminders: boolean;
  nutritionTips: boolean;
  progressUpdates: boolean;
  checkinReminders: boolean;
  messageNotifications: boolean;
  paymentReminders: boolean;
  timezone: string;
  quietStart: string;
  quietEnd: string;
};

function preferencesPayload(prefs: PreferenceRecord) {
  return {
    enabled: prefs.emailEnabled || prefs.pushEnabled || prefs.smsEnabled || prefs.whatsappEnabled,
    types: [
      prefs.workoutReminders && "workout_reminder",
      prefs.nutritionTips && "meal_reminder",
      prefs.checkinReminders && "checkin_reminder",
      prefs.progressUpdates && "achievement",
      prefs.messageNotifications && "coach_message",
      prefs.paymentReminders && "payment_reminder",
    ].filter(Boolean),
    schedule: {
      startHour: Number.parseInt(prefs.quietEnd.split(":")[0] || "8", 10),
      endHour: Number.parseInt(prefs.quietStart.split(":")[0] || "22", 10),
      timezone: prefs.timezone,
    },
    channels: {
      email: prefs.emailEnabled,
      push: prefs.pushEnabled,
      sms: prefs.smsEnabled,
      whatsapp: prefs.whatsappEnabled,
    },
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: session.id },
    create: { userId: session.id },
    update: {},
  });

  return NextResponse.json(preferencesPayload(prefs));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const types = data.types;
  const channels = data.channels;
  const schedule = data.schedule;
  const enabled = data.enabled ?? DEFAULTS.enabled;
  const pushEnabled = (channels?.push ?? DEFAULTS.channels.push) && enabled;

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: session.id },
    create: {
      userId: session.id,
      emailEnabled: (channels?.email ?? DEFAULTS.channels.email) && enabled,
      pushEnabled,
      smsEnabled: (channels?.sms ?? DEFAULTS.channels.sms) && enabled,
      whatsappEnabled: (channels?.whatsapp ?? DEFAULTS.channels.whatsapp) && enabled,
      workoutReminders: types ? types.includes("workout_reminder") : true,
      nutritionTips: types ? types.includes("meal_reminder") : true,
      checkinReminders: types ? types.includes("checkin_reminder") : true,
      progressUpdates: types ? types.includes("achievement") || types.includes("program_update") : true,
      messageNotifications: types ? types.includes("coach_message") : true,
      paymentReminders: types ? types.includes("payment_reminder") : true,
      timezone: schedule?.timezone || DEFAULTS.schedule.timezone,
      quietStart: schedule?.endHour !== undefined ? `${String(schedule.endHour).padStart(2, "0")}:00` : "22:00",
      quietEnd: schedule?.startHour !== undefined ? `${String(schedule.startHour).padStart(2, "0")}:00` : "08:00",
    },
    update: {
      emailEnabled: channels?.email !== undefined ? channels.email && enabled : undefined,
      pushEnabled: channels?.push !== undefined ? channels.push && enabled : undefined,
      smsEnabled: channels?.sms !== undefined ? channels.sms && enabled : undefined,
      whatsappEnabled: channels?.whatsapp !== undefined ? channels.whatsapp && enabled : undefined,
      workoutReminders: types ? types.includes("workout_reminder") : undefined,
      nutritionTips: types ? types.includes("meal_reminder") : undefined,
      checkinReminders: types ? types.includes("checkin_reminder") : undefined,
      progressUpdates: types ? types.includes("achievement") || types.includes("program_update") : undefined,
      messageNotifications: types ? types.includes("coach_message") : undefined,
      paymentReminders: types ? types.includes("payment_reminder") : undefined,
      timezone: schedule?.timezone,
      quietStart: schedule?.endHour !== undefined ? `${String(schedule.endHour).padStart(2, "0")}:00` : undefined,
      quietEnd: schedule?.startHour !== undefined ? `${String(schedule.startHour).padStart(2, "0")}:00` : undefined,
    },
  });

  if (!pushEnabled) {
    await prisma.pushSubscription.updateMany({ where: { userId: session.id }, data: { active: false } });
  }

  return NextResponse.json({ success: true, data: preferencesPayload(prefs) });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.notificationPreference.deleteMany({ where: { userId: session.id } });
  await prisma.pushSubscription.updateMany({ where: { userId: session.id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
