import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertTrainerOwnsClient } from "@/lib/authorization";
import { sendPushToUser } from "@/lib/push-server";

const userSummarySelect = { id: true, name: true, email: true, avatar: true, role: true } as const;
const clientSummarySelect = { id: true, name: true, email: true, avatar: true, trainerId: true, userId: true, goal: true, status: true, plan: true } as const;
const score = z.coerce.number().int().min(1).max(10).nullable().optional();

const checkinSchema = z.object({
  clientId: z.string().cuid().optional(),
  energia: score,
  sueno: score,
  estres: score,
  entrenos: score,
  rendimiento: score,
  progreso: score,
  molestias: z.string().trim().max(1000).nullable().optional(),
  alimentacion: z.string().trim().max(1000).nullable().optional(),
  comentario: z.string().trim().max(2000).nullable().optional(),
  fotos: z.string().trim().max(5000).nullable().optional(),
});

const checkinPatchSchema = z.object({
  id: z.string().cuid(),
  trainerReply: z.string().trim().max(2000).nullable().optional(),
  reviewed: z.boolean().optional(),
});

const selectCheckin = {
  id: true,
  userId: true,
  clientId: true,
  date: true,
  energia: true,
  sueno: true,
  estres: true,
  entrenos: true,
  rendimiento: true,
  molestias: true,
  alimentacion: true,
  progreso: true,
  comentario: true,
  fotos: true,
  trainerReply: true,
  reviewed: true,
  client: { select: clientSummarySelect },
  user: { select: userSummarySelect },
} as const;

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No auth" }, { status: 401 });
  const clientId = new URL(req.url).searchParams.get("clientId");

  if (s.role === "CLIENT") {
    const client = await prisma.client.findFirst({ where: { OR: [{ userId: s.id }, { email: s.email }] }, select: { id: true } });
    const checkins = await prisma.checkIn.findMany({
      where: { OR: [{ userId: s.id }, ...(client?.id ? [{ clientId: client.id }] : [])] },
      orderBy: { date: "desc" },
      take: 50,
      select: selectCheckin,
    });
    return NextResponse.json(checkins);
  }

  if (s.role !== "TRAINER") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (clientId) {
    if (!(await assertTrainerOwnsClient(s.id, clientId))) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    const checkins = await prisma.checkIn.findMany({ where: { clientId }, select: selectCheckin, orderBy: { date: "desc" }, take: 100 });
    return NextResponse.json(checkins);
  }

  const checkins = await prisma.checkIn.findMany({ where: { client: { trainerId: s.id } }, select: selectCheckin, orderBy: { date: "desc" }, take: 50 });
  return NextResponse.json(checkins);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No auth" }, { status: 401 });
  const parsed = checkinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de check-in inválidos" }, { status: 400 });
  const body = parsed.data;

  let clientId: string | null = null;
  if (s.role === "CLIENT") {
    const client = await prisma.client.findFirst({ where: { OR: [{ userId: s.id }, { email: s.email }] }, select: { id: true } });
    clientId = client?.id || null;
  } else {
    if (!body.clientId) return NextResponse.json({ error: "Falta clientId" }, { status: 400 });
    if (!(await assertTrainerOwnsClient(s.id, body.clientId))) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    clientId = body.clientId;
  }

  const checkin = await prisma.checkIn.create({
    data: {
      userId: s.id,
      clientId,
      energia: body.energia ?? null,
      sueno: body.sueno ?? null,
      estres: body.estres ?? null,
      entrenos: body.entrenos ?? null,
      rendimiento: body.rendimiento ?? null,
      progreso: body.progreso ?? null,
      molestias: body.molestias || null,
      alimentacion: body.alimentacion || null,
      comentario: body.comentario || null,
      fotos: body.fotos || null,
      reviewed: false,
    },
    select: selectCheckin,
  });

  if (clientId) {
    const owner = await prisma.client.findUnique({ where: { id: clientId }, select: { trainerId: true } });
    if (owner?.trainerId) {
      await prisma.notification.create({ data: { userId: owner.trainerId, title: `Nuevo check-in: ${s.name}`, body: body.comentario?.slice(0, 80) || "Check-in semanal recibido", type: "checkin", link: "/trainer/checkins" } }).catch(() => {});
      void sendPushToUser({
        userId: owner.trainerId,
        type: "checkin_reminder",
        title: `Nuevo check-in: ${s.name}`,
        body: body.comentario?.slice(0, 100) || "Check-in semanal recibido",
        url: "/trainer/checkins",
        data: { checkinId: checkin.id, clientId },
      }).catch((error) => console.error("[checkins] push trigger failed", error));
    }
  }
  return NextResponse.json(checkin, { status: 201 });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "TRAINER") return NextResponse.json({ error: "Solo trainer" }, { status: 403 });
  try {
    const parsed = checkinPatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Datos de revisión inválidos" }, { status: 400 });
    const { id, trainerReply, reviewed } = parsed.data;

    const existing = await prisma.checkIn.findUnique({ where: { id }, select: { clientId: true, userId: true } });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (existing.clientId) {
      if (!(await assertTrainerOwnsClient(s.id, existing.clientId))) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    } else if (existing.userId !== s.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const updated = await prisma.checkIn.update({
      where: { id },
      data: {
        ...(trainerReply !== undefined ? { trainerReply: trainerReply || null } : {}),
        ...(reviewed !== undefined ? { reviewed } : { reviewed: true }),
      },
      select: selectCheckin,
    });

    const clientUserId = updated.client?.userId || null;
    if (clientUserId && trainerReply) {
      await prisma.notification.create({ data: { userId: clientUserId, title: "Tu coach respondió tu check-in", body: trainerReply.slice(0, 80), type: "checkin_reply", link: "/client/checkins" } }).catch(() => {});
      void sendPushToUser({
        userId: clientUserId,
        type: "coach_message",
        title: "Tu coach respondió tu check-in",
        body: trainerReply.slice(0, 100),
        url: "/client/checkins",
        data: { checkinId: updated.id },
      }).catch((error) => console.error("[checkins] reply push trigger failed", error));
    }
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("[checkins PATCH] failed", error);
    return NextResponse.json({ error: "No se pudo actualizar el check-in" }, { status: 500 });
  }
}
