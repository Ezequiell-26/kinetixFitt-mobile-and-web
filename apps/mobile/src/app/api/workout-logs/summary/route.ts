import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertTrainerOwnsClient } from "@/lib/authorization";
import { computeStreak, countPRs, computeAdherence, weeklyAnalytics } from "@/lib/stats";
import type { Prisma } from "@prisma/client";

type LogWithSets = {
  date: Date;
  sets: Array<{
    exerciseName: string;
    weight: number | null;
    reps: number | null;
    completed: boolean;
  }>;
};

function calendarStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return start;
}

function calendarStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isOnOrAfter(date: Date, start: Date): boolean {
  return date.getTime() >= start.getTime();
}

function sumVolume(logs: LogWithSets[]): number {
  return logs.reduce(
    (total, log) =>
      total +
      log.sets.reduce((sum, set) => {
        if (!set.completed) return sum;
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        return sum + Math.max(0, weight) * Math.max(0, reps);
      }, 0),
    0,
  );
}

function maxLift(logs: LogWithSets[], matches: RegExp): number {
  let max = 0;
  for (const log of logs) {
    for (const set of log.sets) {
      if (!set.completed || !matches.test(set.exerciseName)) continue;
      max = Math.max(max, Number(set.weight) || 0);
    }
  }
  return max;
}

function countNewPersonalRecords(logs: LogWithSets[], start: Date): number {
  const ordered = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const best = new Map<string, number>();
  let count = 0;

  for (const log of ordered) {
    for (const set of log.sets) {
      if (!set.completed) continue;
      const weight = Number(set.weight);
      if (!Number.isFinite(weight) || weight <= 0) continue;

      const key = set.exerciseName.trim().toLowerCase();
      const previous = best.get(key) ?? 0;
      if (weight > previous && previous > 0 && isOnOrAfter(log.date, start)) {
        count += 1;
      }
      if (weight > previous) best.set(key, weight);
    }
  }

  return count;
}

/** Agregados exactos de entrenamiento dentro del alcance autorizado. */
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const url = new URL(req.url);
  const targetClientId = url.searchParams.get("clientId");
  let scope: Prisma.WorkoutLogWhereInput;
  let measurementScope: Prisma.ProgressMeasurementWhereInput;
  let checkinScope: Prisma.CheckInWhereInput;
  let frequency = 4;

  if (s.role === "CLIENT") {
    const client = await prisma.client.findFirst({
      where: { OR: [{ userId: s.id }, { email: s.email }] },
      select: { id: true, assignedProgramId: true },
    });
    scope = { OR: [{ userId: s.id }, ...(client?.id ? [{ clientId: client.id }] : [])] };
    measurementScope = { OR: [{ userId: s.id }, ...(client?.id ? [{ clientId: client.id }] : [])] };
    checkinScope = { OR: [{ userId: s.id }, ...(client?.id ? [{ clientId: client.id }] : [])] };
    frequency = await frequencyFor(client?.assignedProgramId ?? null);
  } else if (targetClientId) {
    if (!(await assertTrainerOwnsClient(s.id, targetClientId))) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    scope = { clientId: targetClientId };
    measurementScope = { clientId: targetClientId };
    checkinScope = { clientId: targetClientId };
    const client = await prisma.client.findUnique({ where: { id: targetClientId }, select: { assignedProgramId: true } });
    frequency = await frequencyFor(client?.assignedProgramId ?? null);
  } else {
    // Trainer global: únicamente clientes pertenecientes a este trainer.
    scope = { client: { trainerId: s.id } };
    measurementScope = { client: { trainerId: s.id } };
    checkinScope = { client: { trainerId: s.id } };
  }

  const [logs, measurements, checkins] = await Promise.all([
    prisma.workoutLog.findMany({ where: scope, include: { sets: true }, orderBy: { date: "asc" } }),
    prisma.progressMeasurement.findMany({ where: measurementScope, select: { date: true, weight: true }, orderBy: { date: "asc" } }),
    prisma.checkIn.findMany({ where: checkinScope, select: { date: true }, orderBy: { date: "asc" } }),
  ]);

  const dates = logs.map((log) => log.date);
  const sets = logs.flatMap((log) => log.sets.map((set) => ({ exerciseName: set.exerciseName, weight: set.weight, date: log.date })));

  const now = new Date();
  const weekStart = calendarStartOfWeek(now);
  const monthStart = calendarStartOfMonth(now);
  const weeklyLogs = logs.filter((log) => isOnOrAfter(log.date, weekStart));
  const monthlyLogs = logs.filter((log) => isOnOrAfter(log.date, monthStart));
  const weeklyCheckins = checkins.filter((checkin) => isOnOrAfter(checkin.date, weekStart));
  const monthlyCheckins = checkins.filter((checkin) => isOnOrAfter(checkin.date, monthStart));
  const activeDays = new Set(logs.map((log) => log.date.toISOString().slice(0, 10))).size;
  const latestWeight = measurements.at(-1)?.weight ?? 0;

  const totalVolume = sumVolume(logs);
  const weeklyVolume = sumVolume(weeklyLogs);
  const monthlyVolume = sumVolume(monthlyLogs);
  const maxBench = maxLift(logs, /(bench|press\s*de\s*banca)/i);
  const maxSquat = maxLift(logs, /(squat|sentadilla)/i);
  const maxDeadlift = maxLift(logs, /(deadlift|peso\s*muerto)/i);

  return NextResponse.json({
    totalWorkouts: logs.length,
    streak: computeStreak(dates),
    prs: countPRs(sets),
    adherence: computeAdherence(dates, frequency),
    frequency,
    weekly: weeklyAnalytics(logs, measurements, frequency),
    gamification: {
      workouts_completed: logs.length,
      streak_days: computeStreak(dates),
      max_bench: maxBench,
      max_squat: maxSquat,
      max_deadlift: maxDeadlift,
      bench_bodyweight_ratio: latestWeight > 0 ? maxBench / latestWeight : 0,
      total_volume_kg: Math.round(totalVolume),
      checkins_sent: checkins.length,
      referrals: 0,
      days_active: activeDays,
      weight_goal_reached: 0,
      weekly_volume_kg: Math.round(weeklyVolume),
      weekly_sessions: weeklyLogs.length,
      weekly_prs: countNewPersonalRecords(logs, weekStart),
      monthly_workouts: monthlyLogs.length,
      monthly_volume_kg: Math.round(monthlyVolume),
      monthly_checkins: monthlyCheckins.length,
    },
  });
}

async function frequencyFor(programId: string | null): Promise<number> {
  if (!programId) return 4;
  const program = await prisma.program.findUnique({ where: { id: programId }, select: { frequency: true } });
  return program?.frequency || 4;
}
