import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertTrainerOwnsClient } from "@/lib/authorization";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" } as const;

const progressPhotoSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  note: z.string().trim().max(500).nullable().optional(),
  isPrivate: z.boolean().optional().default(true),
  clientId: z.string().cuid().optional(),
});

export async function GET(req: Request){
  const s = await getSession();
  if(!s) return NextResponse.json({error:"No auth"},{status:401, headers: PRIVATE_HEADERS});
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");

  if(s.role==="CLIENT"){
    const client = await prisma.client.findFirst({where:{OR:[{userId:s.id},{email:s.email}]}, select:{id:true}});
    if(!client) return NextResponse.json([], { headers: PRIVATE_HEADERS });
    const photos = await prisma.progressPhoto.findMany({
      where:{ OR: [{ clientId: client.id }, { userId: s.id }] },
      orderBy:{date:"desc"},
      take:50
    });
    return NextResponse.json(photos, { headers: PRIVATE_HEADERS });
  }

  if (s.role !== "TRAINER") return NextResponse.json({error:"No autorizado"},{status:403, headers: PRIVATE_HEADERS});

  if(clientId){
    const ownsClient = await assertTrainerOwnsClient(s.id, clientId);
    if(!ownsClient){
      return NextResponse.json({error:"Cliente no encontrado"}, {status:404, headers: PRIVATE_HEADERS});
    }
    const photos = await prisma.progressPhoto.findMany({where:{clientId}, orderBy:{date:"desc"}, take:50});
    return NextResponse.json(photos, { headers: PRIVATE_HEADERS });
  }

  const photos = await prisma.progressPhoto.findMany({
    where: { client: { trainerId: s.id } },
    orderBy: { date: "desc" },
    take: 50,
  });
  return NextResponse.json(photos, { headers: PRIVATE_HEADERS });
}

export async function POST(req: Request){
  const s = await getSession();
  if(!s) return NextResponse.json({error:"No auth"},{status:401, headers: PRIVATE_HEADERS});

  const parsed = progressPhotoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de foto inválidos" }, { status: 400, headers: PRIVATE_HEADERS });
  const body = parsed.data;

  let targetClientId: string | null = null;
  if(s.role === "CLIENT"){
    const client = await prisma.client.findFirst({where:{OR:[{userId:s.id},{email:s.email}]}, select:{id:true}});
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404, headers: PRIVATE_HEADERS });
    targetClientId = client.id;
  } else if (s.role === "TRAINER") {
    if (!body.clientId) return NextResponse.json({ error: "Falta clientId" }, { status: 400, headers: PRIVATE_HEADERS });
    if (!(await assertTrainerOwnsClient(s.id, body.clientId))) {
      return NextResponse.json({error:"Cliente no encontrado"},{status:404, headers: PRIVATE_HEADERS});
    }
    targetClientId = body.clientId;
  } else {
    return NextResponse.json({ error: "No autorizado" }, { status: 403, headers: PRIVATE_HEADERS });
  }

  const photo = await prisma.progressPhoto.create({
    data: {
      userId: s.id,
      clientId: targetClientId,
      url: body.url,
      note: body.note || null,
      isPrivate: body.isPrivate,
    }
  });

  return NextResponse.json(photo, { headers: PRIVATE_HEADERS });
}
