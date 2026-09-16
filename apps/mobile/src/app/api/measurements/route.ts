import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertTrainerOwnsClient } from "@/lib/authorization";

const measurementSchema = z.object({
  clientId: z.string().cuid().optional(),
  weight: z.coerce.number().finite().min(20).max(500).nullable().optional(),
  chest: z.coerce.number().finite().min(20).max(300).nullable().optional(),
  waist: z.coerce.number().finite().min(20).max(300).nullable().optional(),
  arm: z.coerce.number().finite().min(5).max(100).nullable().optional(),
  leg: z.coerce.number().finite().min(10).max(150).nullable().optional(),
  bodyFat: z.coerce.number().finite().min(1).max(80).nullable().optional(),
  date: z.string().datetime().optional(),
}).strict();

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return jsonError("No auth", 401);

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");

  if (s.role === "CLIENT") {
    const client = await prisma.client.findFirst({
      where: { OR: [{ userId: s.id }, { email: s.email }] },
      select: { id: true },
    });

    const measurements = await prisma.progressMeasurement.findMany({
      where: {
        OR: [
          { userId: s.id },
          ...(client?.id ? [{ clientId: client.id }] : []),
        ],
      },
      orderBy: { date: "desc" },
      take: 50,
    });
    return NextResponse.json(measurements);
  }

  if (clientId) {
    if (!(await assertTrainerOwnsClient(s.id, clientId))) {
      return jsonError("Cliente no encontrado", 404);
    }

    const measurements = await prisma.progressMeasurement.findMany({
      where: { clientId },
      orderBy: { date: "desc" },
      take: 50,
    });
    return NextResponse.json(measurements);
  }

  const measurements = await prisma.progressMeasurement.findMany({
    where: { client: { trainerId: s.id } },
    orderBy: { date: "desc" },
    take: 50,
  });
  return NextResponse.json(measurements);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return jsonError("No auth", 401);

  const parsed = measurementSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Datos de medición inválidos", 400);

  const body = parsed.data;
  let clientId: string | null = null;

  if (s.role === "CLIENT") {
    const client = await prisma.client.findFirst({
      where: { OR: [{ userId: s.id }, { email: s.email }] },
      select: { id: true },
    });
    if (!client) return jsonError("Cliente no encontrado", 404);
    clientId = client.id;
  } else {
    if (!body.clientId) return jsonError("Falta clientId", 400);
    if (!(await assertTrainerOwnsClient(s.id, body.clientId))) {
      return jsonError("Cliente no encontrado", 404);
    }
    clientId = body.clientId;
  }

  const measurement = await prisma.progressMeasurement.create({
    data: {
      userId: s.id,
      clientId,
      weight: body.weight ?? null,
      chest: body.chest ?? null,
      waist: body.waist ?? null,
      arm: body.arm ?? null,
      leg: body.leg ?? null,
      bodyFat: body.bodyFat ?? null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  if (body.weight != null) {
    await prisma.client.update({
      where: { id: clientId },
      data: { weight: body.weight },
    });
  }

  return NextResponse.json(measurement, { status: 201 });
}
