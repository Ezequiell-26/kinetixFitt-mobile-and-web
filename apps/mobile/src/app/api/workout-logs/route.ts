import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertTrainerOwnsClient } from "@/lib/authorization";

const IMPORT_SOURCES = new Set(["hevy", "strong"]);
const clientSummarySelect = { id: true, name: true, email: true, avatar: true, goal: true, status: true, plan: true } as const;

const setSchema = z.object({
  exerciseName: z.string().trim().min(1).max(200),
  setNumber: z.coerce.number().int().min(1).max(100),
  weight: z.coerce.number().nonnegative().max(1000).nullable().optional(),
  reps: z.coerce.number().int().min(0).max(500).nullable().optional(),
  rir: z.coerce.number().int().min(0).max(10).nullable().optional(),
  rpe: z.coerce.number().min(0).max(10).nullable().optional(),
  completed: z.boolean().optional(),
});

const workoutLogSchema = z.object({
  clientId: z.string().cuid().optional(),
  workoutId: z.string().cuid().optional(),
  importSource: z.string().trim().toLowerCase().optional(),
  workoutName: z.string().trim().min(1).max(200).optional(),
  date: z.string().datetime().optional(),
  durationMin: z.coerce.number().int().min(0).max(24 * 60).nullable().optional(),
  comment: z.string().trim().max(1000).nullable().optional(),
  completed: z.boolean().optional(),
  sets: z.array(setSchema).max(200).optional(),
});

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No auth" }, { status: 401 });
  const parsed = workoutLogSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de entrenamiento inválidos" }, { status: 400 });
  const body = parsed.data;

  let clientId: string | null = null;
  let assignedProgramId: string | null = null;
  if (s.role === "CLIENT") {
    const client = await prisma.client.findFirst({ where: { OR: [{ userId: s.id }, { email: s.email }] }, select: { id: true, assignedProgramId: true } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    clientId = client.id;
    assignedProgramId = client.assignedProgramId;
  } else {
    if (!body.clientId) return NextResponse.json({ error: "Falta clientId" }, { status: 400 });
    if (!(await assertTrainerOwnsClient(s.id, body.clientId))) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    clientId = body.clientId;
  }

  const importSource = body.importSource && IMPORT_SOURCES.has(body.importSource) ? body.importSource : null;
  const workoutId = body.workoutId || null;
  let workout: {
    id: string;
    name: string;
    week: { programId: string; program: { trainerId: string | null } };
  } | null = null;
  if (workoutId) {
    workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: { week: { select: { programId: true, program: { select: { trainerId: true } } } } },
    });
    if (!workout) return NextResponse.json({ error: "El entrenamiento no existe" }, { status: 404 });
    if (s.role === "CLIENT" && workout.week.programId !== assignedProgramId) {
      return NextResponse.json({ error: "Ese entrenamiento no pertenece a tu programa asignado" }, { status: 403 });
    }
    if (s.role === "TRAINER" && workout.week.program.trainerId !== s.id) {
      return NextResponse.json({ error: "Ese entrenamiento no pertenece a tu cartera" }, { status: 403 });
    }
  } else if (!importSource) {
    return NextResponse.json({ error: "Falta el ID del entrenamiento" }, { status: 400 });
  }

  const setsData = (body.sets || []).map((st) => ({
    exerciseName: st.exerciseName,
    setNumber: st.setNumber,
    weight: st.weight ?? null,
    reps: st.reps ?? null,
    rir: st.rir ?? null,
    rpe: st.rpe ?? null,
    completed: st.completed ?? true,
  }));
  const date = body.date ? new Date(body.date) : new Date();
  const workoutName = workout?.name || body.workoutName || `Importado desde ${importSource}`;

  if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "La fecha del entrenamiento no puede ser futura" }, { status: 400 });
  }

  const log = await prisma.workoutLog.create({
    data: {
      userId: s.id,
      clientId,
      workoutId,
      workoutName,
      date,
      durationMin: body.durationMin ?? null,
      comment: body.comment || null,
      completed: body.completed ?? true,
      sets: setsData.length ? { create: setsData } : undefined,
    },
    include: { sets: true, workout: { select: { id: true, name: true, weekId: true } } },
  });

  if (s.role === "CLIENT" && clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { trainerId: true } });
    if (client?.trainerId) {
      await prisma.notification.create({ data: { userId: client.trainerId, title: `${s.name} completó un entrenamiento`, body: `${workoutName} (${log.durationMin || 0} min)`, type: "workout", link: `/trainer/clients/${clientId}` } }).catch(() => {});
    }
  }

  return NextResponse.json(log, { status: 201 });
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No auth" }, { status: 401 });
  const url = new URL(req.url);
  const targetClientId = url.searchParams.get("clientId");
  const parsedLimit = Number.parseInt(url.searchParams.get("limit") || "50", 10);
  const take = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 50;

  if (s.role === "CLIENT") {
    const client = await prisma.client.findFirst({ where: { OR: [{ userId: s.id }, { email: s.email }] }, select: { id: true } });
    const logs = await prisma.workoutLog.findMany({
      where: { OR: [{ userId: s.id }, ...(client?.id ? [{ clientId: client.id }] : [])] },
      include: { sets: true, workout: { select: { id: true, name: true, weekId: true } } },
      orderBy: { date: "desc" },
      take,
    });
    return NextResponse.json(logs);
  }

  if (s.role !== "TRAINER") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (targetClientId) {
    if (!(await assertTrainerOwnsClient(s.id, targetClientId))) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    const logs = await prisma.workoutLog.findMany({
      where: { clientId: targetClientId },
      include: { sets: true, workout: { select: { id: true, name: true, weekId: true } } },
      orderBy: { date: "desc" },
      take,
    });
    return NextResponse.json(logs);
  }

  const logs = await prisma.workoutLog.findMany({
    where: { client: { trainerId: s.id } },
    include: { sets: true, workout: { select: { id: true, name: true, weekId: true } }, client: { select: clientSummarySelect } },
    orderBy: { date: "desc" },
    take,
  });
  return NextResponse.json(logs);
}
