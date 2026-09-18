import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notificationMutationSchema } from "@/lib/notification-validation";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(){
  const s = await getSession();
  if(!s) return NextResponse.json({error:"No auth"},{status:401, headers: NO_STORE});
  const notifs = await prisma.notification.findMany({where:{userId: s.id}, orderBy:{createdAt:"desc"}, take:20});
  return NextResponse.json(notifs, { headers: NO_STORE });
}

export async function POST(req: Request){
  const s = await getSession();
  if(!s) return NextResponse.json({error:"No auth"},{status:401, headers: NO_STORE});

  const parsed = notificationMutationSchema.safeParse(await req.json().catch(() => null));
  if(!parsed.success){
    return NextResponse.json({error:"Cuerpo inválido"},{status:400, headers: NO_STORE});
  }

  const { id } = parsed.data;
  if(id){
    // Solo las propias: marcar la ajena como leída sería IDOR.
    const own = await prisma.notification.findFirst({ where: { id, userId: s.id } });
    if(!own) return NextResponse.json({error:"No encontrada"},{status:404, headers: NO_STORE});
    await prisma.notification.update({where:{id}, data:{read:true}});
  } else {
    await prisma.notification.updateMany({where:{userId: s.id, read:false}, data:{read:true}});
  }
  return NextResponse.json({ok:true}, { headers: NO_STORE });
}
