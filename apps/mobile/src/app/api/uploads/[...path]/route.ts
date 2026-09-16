import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, resolve } from "path";
import { getSession, type JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertTrainerOwnsClient } from "@/lib/authorization";
import { isUploadType, getUploadDir } from "@/lib/security";

/**
 * Lectura autenticada de archivos subidos.
 * El acceso se comprueba contra la relación real del recurso antes de leer
 * el archivo físico. Ningún nombre de archivo por sí solo concede acceso.
 */

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const s = await getSession();
  if (!s) return new NextResponse("No autorizado", { status: 401 });

  const { path } = await params;
  const typeRaw = path[0];
  const filename = path.slice(1).join("/");

  if (!typeRaw || !filename) return new NextResponse("Solicitud inválida", { status: 400 });
  if (!isUploadType(typeRaw)) return new NextResponse("No encontrado", { status: 404 });
  const type = typeRaw;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Solicitud inválida", { status: 400 });
  }
  if (filename.replace(/[^a-zA-Z0-9._-]/g, "") !== filename) {
    return new NextResponse("Solicitud inválida", { status: 400 });
  }

  const requestedUrl = `/api/uploads/${type}/${filename}`;
  const allowed = await canAccess(s, type, requestedUrl);
  if (!allowed) return new NextResponse("No encontrado", { status: 404 });

  try {
    const uploadDir = getUploadDir(type);
    const baseResolved = resolve(uploadDir);
    const filepath = resolve(join(uploadDir, filename));
    if (!filepath.startsWith(baseResolved + "/") && filepath !== baseResolved) {
      return new NextResponse("Solicitud inválida", { status: 400 });
    }
    const buf = await readFile(filepath);
    const mime = MIME[extname(filename).toLowerCase()] || "application/octet-stream";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=0, no-store",
        "Content-Disposition": mime === "application/pdf" ? `attachment; filename="${filename}"` : "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
}

async function canAccess(s: JWTPayload, type: string, url: string): Promise<boolean> {
  const filename = url.split("/").pop() || "";

  if (type === "avatar") {
    const target = await prisma.user.findFirst({
      where: { OR: [{ avatar: url }, { avatar: { contains: filename } }] },
      select: { id: true, client: { select: { trainerId: true } } },
    });
    if (!target) return false;
    if (target.id === s.id) return true;
    if (s.role === "TRAINER" && target.client?.trainerId === s.id) return true;
    return false;
  }

  if (s.role === "TRAINER") {
    if (type === "progress") {
      const photo = await prisma.progressPhoto.findFirst({
        where: { OR: [{ url }, { url: { contains: filename } }] },
        select: { clientId: true },
      });
      if (!photo?.clientId) return false;
      return assertTrainerOwnsClient(s.id, photo.clientId);
    }
    if (type === "checkin") {
      const checkin = await prisma.checkIn.findFirst({
        where: { OR: [{ fotos: { contains: url } }, { fotos: { contains: filename } }] },
        select: { clientId: true },
      });
      if (!checkin?.clientId) return false;
      return assertTrainerOwnsClient(s.id, checkin.clientId);
    }
    if (type === "message") {
      const msg = await prisma.message.findFirst({
        where: { OR: [{ image: url }, { image: { contains: filename } }] },
        select: { senderId: true, receiverId: true },
      });
      if (!msg) return false;
      return msg.senderId === s.id || msg.receiverId === s.id;
    }
    return false;
  }

  const client = await prisma.client.findFirst({
    where: { OR: [{ userId: s.id }, { email: s.email }] },
    select: { id: true },
  });

  if (!client) {
    if (type === "message") {
      const msg = await prisma.message.findFirst({
        where: { image: { contains: filename }, OR: [{ senderId: s.id }, { receiverId: s.id }] },
        select: { id: true },
      });
      return !!msg;
    }
    return false;
  }

  if (type === "progress") {
    const photo = await prisma.progressPhoto.findFirst({ where: { OR: [{ url, }, { url: { contains: filename } }], clientId: client.id }, select: { id: true } });
    return !!photo;
  }
  if (type === "checkin") {
    const checkin = await prisma.checkIn.findFirst({ where: { OR: [{ fotos: { contains: url } }, { fotos: { contains: filename } }], clientId: client.id }, select: { id: true } });
    return !!checkin;
  }
  if (type === "message") {
    const msg = await prisma.message.findFirst({ where: { image: { contains: filename }, OR: [{ senderId: s.id }, { receiverId: s.id }] }, select: { id: true } });
    return !!msg;
  }
  return false;
}
