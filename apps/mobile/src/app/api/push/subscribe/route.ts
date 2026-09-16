import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().max(2048),
    keys: z.object({ p256dh: z.string().min(1).max(512), auth: z.string().min(1).max(512) }),
  }),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { subscription } = parsed.data;

  try {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
      select: { id: true, userId: true },
    });

    if (existing && existing.userId !== session.id) {
      return NextResponse.json({ error: "La suscripción push ya pertenece a otro usuario" }, { status: 409 });
    }

    const saved = existing
      ? await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            active: true,
          },
          select: { id: true, endpoint: true },
        })
      : await prisma.pushSubscription.create({
          data: {
            userId: session.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            active: true,
          },
          select: { id: true, endpoint: true },
        });

    return NextResponse.json({ success: true, subscriptionId: saved.id, endpoint: saved.endpoint });
  } catch (error) {
    console.error("[PUSH SUBSCRIBE]", error);
    return NextResponse.json({ error: "No se pudo guardar la suscripción" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: session.id, active: true },
    select: { id: true, endpoint: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, subscriptions });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const endpoint = new URL(request.url).searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "Endpoint requerido" }, { status: 400 });
  await prisma.pushSubscription.updateMany({ where: { endpoint, userId: session.id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
