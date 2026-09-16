import { NextResponse } from "next/server";
import { backupService } from "@/lib/backups";
import { getCurrentUser } from "@/lib/auth";
import { join, resolve } from "path";

function isBackupAdmin(userId: string) {
  const configured = process.env.BACKUP_ADMIN_USER_IDS || "";
  const ids = configured.split(",").map((id) => id.trim()).filter(Boolean);
  return ids.length > 0 && ids.includes(userId);
}

/**
 * DELETE /api/backups/[id] - Elimina un backup específico.
 * Requiere la misma identidad administrativa usada para listar/crear backups.
 * Path traversal se bloquea mediante nombre permitido y ruta resuelta.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!isBackupAdmin(user.id)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    let filename: string;
    try {
      filename = decodeURIComponent(id);
    } catch {
      return NextResponse.json({ error: "Nombre de backup inválido" }, { status: 400 });
    }

    if (!/^backup-[a-zA-Z0-9._-]+\.sql\.gz$/.test(filename)) {
      return NextResponse.json({ error: "Nombre de backup inválido" }, { status: 400 });
    }

    const fs = await import("fs/promises");
    const os = await import("os");
    const backupDir = process.env.BACKUP_DIR || join(os.tmpdir(), "kinetix-backups");
    const backupResolved = resolve(backupDir);
    const filePath = resolve(join(backupResolved, filename));

    if (!filePath.startsWith(`${backupResolved}/`) && filePath !== backupResolved) {
      return NextResponse.json({ error: "Nombre de backup inválido" }, { status: 400 });
    }

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "Backup no encontrado" }, { status: 404 });
    }

    await fs.unlink(filePath);

    return NextResponse.json({
      success: true,
      message: "Backup eliminado exitosamente",
      filename,
    });
  } catch (error) {
    console.error("[BACKUP API] Error deleting backup:", error);
    return NextResponse.json({ error: "Error al eliminar backup" }, { status: 500 });
  }
}
