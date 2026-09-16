import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

const ALLOWED_TYPES = new Set(["workouts", "progress", "measurements", "checkins", "all"]);
const ALLOWED_FORMATS = new Set(["json", "csv"]);
const MAX_ROWS = 5000;
const EXPORT_RATE_LIMIT = { max: 5, windowMs: 60 * 60_000 };

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [
    keys.map(csvEscape).join(","),
    ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(",")),
  ].join("\n");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "CLIENT") return NextResponse.json({ error: "La exportación personal está disponible para atletas" }, { status: 403 });

  const limit = await checkRateLimit(
    getClientIp({ headers: request.headers, ip: (request as Request & { ip?: string }).ip }),
    `export:${session.id}`,
    EXPORT_RATE_LIMIT,
  );
  if (!limit.success) {
    return NextResponse.json(
      { error: "Demasiadas exportaciones. Intentá nuevamente más tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil(limit.resetMs / 1000))),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as { type?: unknown; format?: unknown } | null;
    const type = typeof body?.type === "string" && ALLOWED_TYPES.has(body.type) ? body.type : "all";
    const format = typeof body?.format === "string" && ALLOWED_FORMATS.has(body.format) ? body.format : "json";

    const client = await prisma.client.findFirst({
      where: { OR: [{ userId: session.id }, { email: session.email }] },
      select: { id: true, name: true, email: true },
    });

    if (!client) return NextResponse.json({ error: "Perfil de atleta no encontrado" }, { status: 404 });

    const [profile, workouts, measurements, checkins] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: session.id } }),
      type === "measurements" || type === "checkins" ? Promise.resolve([]) : prisma.workoutLog.findMany({
        where: { OR: [{ userId: session.id }, { clientId: client.id }] },
        orderBy: { date: "desc" },
        take: MAX_ROWS,
        include: { sets: true, workout: { select: { id: true, name: true } } },
      }),
      type === "workouts" || type === "checkins" ? Promise.resolve([]) : prisma.progressMeasurement.findMany({
        where: { OR: [{ userId: session.id }, { clientId: client.id }] },
        orderBy: { date: "desc" },
        take: MAX_ROWS,
      }),
      type === "workouts" || type === "measurements" ? Promise.resolve([]) : prisma.checkIn.findMany({
        where: { OR: [{ userId: session.id }, { clientId: client.id }] },
        orderBy: { date: "desc" },
        take: MAX_ROWS,
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      account: { id: session.id, name: client.name, email: client.email },
      profile,
      ...(type === "workouts" || type === "all" ? { workouts } : {}),
      ...(type === "progress" || type === "all" ? { progress: measurements } : {}),
      ...(type === "measurements" || type === "all" ? { measurements } : {}),
      ...(type === "checkins" || type === "all" ? { checkins } : {}),
    };

    const filenameBase = `kinetixfitt-${type}-${new Date().toISOString().slice(0, 10)}`;
    if (format === "csv") {
      const rows: Array<Record<string, unknown>> = [];
      if (type === "workouts" || type === "all") {
        for (const log of workouts) {
          rows.push({
            dataset: "workout",
            id: log.id,
            date: log.date.toISOString(),
            workout: log.workout?.name || log.workoutName || "",
            durationMin: log.durationMin,
            completed: log.completed,
            comment: log.comment,
            sets: log.sets.map((set) => ({ exercise: set.exerciseName, set: set.setNumber, weight: set.weight, reps: set.reps, rir: set.rir, rpe: set.rpe, completed: set.completed })),
          });
        }
      }
      if (type === "progress" || type === "measurements" || type === "all") {
        for (const measurement of measurements) rows.push({ dataset: "measurement", ...measurement });
      }
      if (type === "checkins" || type === "all") {
        for (const checkin of checkins) rows.push({ dataset: "checkin", ...checkin });
      }
      return new NextResponse(csv(rows), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.json"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[EXPORT] failed", error);
    return NextResponse.json({ error: "No se pudieron exportar tus datos" }, { status: 500 });
  }
}
