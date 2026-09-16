/**
 * Upload de archivos con validación de seguridad.
 *
 * Hardening:
 * - allowlist estricta de tipos/MIME/extensiones
 * - magic bytes reales
 * - filenames generados por servidor
 * - almacenamiento fuera de public
 * - rate limit por usuario/IP
 * - persistencia vinculada al propietario cuando corresponde
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  ALLOWED_MIME_TYPES,
  isUploadType,
  sanitizeExtension,
  buildSafeFilename,
  getUploadDir,
  type UploadType,
} from "@/lib/security";
import { verifyFileSignature } from "@/lib/file-signature";
import { checkRateLimit, getClientIp, RATE_LIMIT_PROFILES } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const limit = await checkRateLimit(getClientIp(req), `uploads:${s.id}`, RATE_LIMIT_PROFILES.upload);
  if (!limit.success) {
    return NextResponse.json({ error: "Demasiadas subidas, intentá de nuevo más tarde" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
    });
  }

  try {
    const form = await req.formData();
    const fileValue = form.get("file");
    const file = fileValue instanceof File ? fileValue : null;
    const typeValue = form.get("type");
    const rawType = typeof typeValue === "string" ? typeValue : "progress";

    if (!isUploadType(rawType)) {
      return NextResponse.json({ error: "Tipo no permitido" }, { status: 400 });
    }
    const type: UploadType = rawType;
    if (!file) return NextResponse.json({ error: "Falta archivo" }, { status: 400 });

    if (file.size > 5 * 1024 * 1024 || file.size <= 0) {
      return NextResponse.json({ error: "Archivo fuera de límite" }, { status: 400 });
    }

    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json({ error: "Tipo no permitido" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!verifyFileSignature(buffer, file.type)) {
      console.warn(`[UPLOAD] Magic bytes no coinciden para ${file.type}`);
      return NextResponse.json({ error: "Archivo inválido o corrupto" }, { status: 400 });
    }

    const ext = sanitizeExtension(file.name, file.type);
    const filename = buildSafeFilename(type, randomUUID(), ext);
    const uploadDir = getUploadDir(type);
    await mkdir(uploadDir, { recursive: true });
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer, { flag: "wx" });

    const url = `/api/uploads/${type}/${filename}`;

    if (type === "progress") {
      const client = await prisma.client.findFirst({
        where: { OR: [{ userId: s.id }, { email: s.email }] },
        select: { id: true },
      });
      await prisma.progressPhoto.create({
        data: {
          userId: s.id,
          clientId: client?.id || null,
          url,
          note: (() => {
            const note = form.get("note");
            return typeof note === "string" ? note.trim().slice(0, 500) || null : null;
          })(),
          isPrivate: true,
        },
      });
    }

    return NextResponse.json({ url, filename, size: file.size, type: file.type });
  } catch (error) {
    console.error("[UPLOAD] Error:", error);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
