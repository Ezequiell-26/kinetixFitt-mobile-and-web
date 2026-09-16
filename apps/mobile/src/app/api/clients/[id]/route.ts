import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertTrainerOwnsClient } from "@/lib/authorization";
import { prisma } from "@/lib/db";

function numberOrNull(value: unknown, min: number, max: number) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

const ALLOWED_GOALS = ["PERDIDA_GRASA", "HIPERTROFIA", "FUERZA", "RECOMPOSICION", "OTRO"] as const;
const ALLOWED_STATUS = ["ACTIVO", "PAUSADO", "PENDIENTE", "FINALIZADO"] as const;
const ALLOWED_PLANS = ["BASICO", "PERSONALIZADO", "PREMIUM"] as const;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No auth" }, { status: 401 });
  const { id } = await params;

  if (s.role === "CLIENT") {
    const own = await prisma.client.findFirst({ where: { OR: [{ userId: s.id }, { email: s.email }] }, select: { id: true } });
    if (!own || own.id !== id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  } else if (s.role === "TRAINER") {
    if (!(await assertTrainerOwnsClient(s.id, id))) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  } else {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      assignedProgram: { include: { weeks: { orderBy: { weekNumber: "asc" }, include: { workouts: { orderBy: { dayNumber: "asc" }, include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } } } } } } },
      checkIns: { orderBy: { date: "desc" }, take: 20 },
      workoutLogs: { orderBy: { date: "desc" }, take: 20, include: { sets: true, workout: true } },
      progressMeasurements: { orderBy: { date: "desc" }, take: 20 },
      progressPhotos: { orderBy: { date: "desc" }, take: 20 },
      subscription: true,
    },
  });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  if (s.role === "CLIENT") {
    const { trainerNotes: _trainerNotes, ...safeClient } = client;
    return NextResponse.json(safeClient);
  }
  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No auth" }, { status: 401 });
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  if (s.role === "CLIENT" && client.userId !== s.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (s.role !== "CLIENT" && s.role !== "TRAINER") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (s.role === "TRAINER" && !(await assertTrainerOwnsClient(s.id, id))) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || Array.isArray(body)) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      const name = body.name.trim().slice(0, 120);
      if (name.length < 2) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
      data.name = name;
    }
    if (body.notes !== undefined) {
      if (body.notes !== null && typeof body.notes !== "string") return NextResponse.json({ error: "Notas inválidas" }, { status: 400 });
      data.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : null;
    }

    for (const [field, min, max] of [["weight", 20, 300], ["height", 100, 250], ["age", 14, 100], ["availability", 1, 7]] as const) {
      if (body[field] !== undefined) {
        const value = numberOrNull(body[field], min, max);
        if (value === undefined) return NextResponse.json({ error: `${field} inválido` }, { status: 400 });
        data[field] = value;
      }
    }
    if (body.equipment !== undefined) {
      if (body.equipment !== null && typeof body.equipment !== "string") return NextResponse.json({ error: "Equipamiento inválido" }, { status: 400 });
      data.equipment = typeof body.equipment === "string" ? body.equipment.trim().slice(0, 500) : null;
    }
    if (body.experience !== undefined) {
      if (body.experience !== null && typeof body.experience !== "string") return NextResponse.json({ error: "Experiencia inválida" }, { status: 400 });
      data.experience = typeof body.experience === "string" ? body.experience.trim().slice(0, 120) : null;
    }
    if (body.goal !== undefined) {
      if (!ALLOWED_GOALS.includes(body.goal as (typeof ALLOWED_GOALS)[number])) return NextResponse.json({ error: "Objetivo inválido" }, { status: 400 });
      data.goal = body.goal;
    }

    if (s.role === "TRAINER") {
      if (body.status !== undefined) {
        if (!ALLOWED_STATUS.includes(body.status as (typeof ALLOWED_STATUS)[number])) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
        data.status = body.status;
      }
      if (body.plan !== undefined) {
        if (!ALLOWED_PLANS.includes(body.plan as (typeof ALLOWED_PLANS)[number])) return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
        data.plan = body.plan;
      }
      if (body.trainerNotes !== undefined) {
        if (body.trainerNotes !== null && typeof body.trainerNotes !== "string") return NextResponse.json({ error: "Notas del coach inválidas" }, { status: 400 });
        data.trainerNotes = typeof body.trainerNotes === "string" ? body.trainerNotes.trim().slice(0, 1500) : null;
      }
      if (body.assignedProgramId !== undefined) {
        const programId = body.assignedProgramId || null;
        if (programId) {
          if (typeof programId !== "string" || programId.length > 64) return NextResponse.json({ error: "Programa inválido" }, { status: 400 });
          const program = await prisma.program.findUnique({ where: { id: programId }, select: { id: true, trainerId: true } });
          if (!program) return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 });
          if (program.trainerId && program.trainerId !== s.id) return NextResponse.json({ error: "No podés asignar un programa de otro coach" }, { status: 403 });
        }
        data.assignedProgramId = programId;
      }
    }

    if (Object.keys(data).length === 0) return NextResponse.json({ error: "No hay cambios válidos" }, { status: 400 });
    const updated = await prisma.client.update({ where: { id }, data, include: { assignedProgram: true, subscription: true } });
    if (s.role === "TRAINER" && body.assignedProgramId && updated.userId) {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          title: "Nuevo programa asignado",
          body: `Tu coach te asignó el programa ${updated.assignedProgram?.name || "seleccionado"}`,
          type: "program",
          link: "/client/workout",
        },
      }).catch(() => {});
    }

    if (s.role === "CLIENT") {
      const { trainerNotes: _trainerNotes, ...safeUpdated } = updated;
      return NextResponse.json(safeUpdated);
    }
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("[CLIENT PATCH]", error);
    return NextResponse.json({ error: "No se pudo actualizar el cliente" }, { status: 500 });
  }
}
