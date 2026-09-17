import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createAuthSession, setAuthCookie } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limiter";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Honeypot: si el campo trampa viene lleno, responder éxito falso sin crear nada.
    if (typeof body.company === "string" && body.company.trim() !== "") {
      return NextResponse.json({ ok: true, role: "CLIENT" });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de registro inválidos",
          fields: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const normalizedEmail = data.email.toLowerCase().trim();
    const hashed = await hashPassword(data.password);

    // User + Profile + Client deben crearse/reconciliarse como una sola unidad.
    // Evita cuentas parciales si una FK, constraint o write posterior falla.
    const user = await prisma.$transaction(async (tx) => {
      const exists = await tx.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      if (exists) throw new Error("REGISTER_EMAIL_EXISTS");

      // Registro público SIEMPRE como CLIENTE.
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashed,
          name: data.name.trim(),
          role: "CLIENT",
        },
      });
      await tx.profile.create({ data: { userId: createdUser.id } });

      const existingClient = await tx.client.findUnique({ where: { email: normalizedEmail } });
      if (existingClient) {
        await tx.client.update({
          where: { id: existingClient.id },
          data: { userId: createdUser.id, name: data.name.trim() || existingClient.name },
        });
      } else {
        await tx.client.create({
          data: {
            name: data.name.trim(),
            email: normalizedEmail,
            userId: createdUser.id,
            goal: "HIPERTROFIA",
            status: "ACTIVO",
            plan: "PERSONALIZADO",
          },
        });
      }

      return createdUser;
    });

    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = getClientIp({ headers: req.headers });
    const token = await createAuthSession(
      {
        id: user.id,
        email: user.email,
        role: user.role as "TRAINER" | "CLIENT",
        name: user.name,
      },
      userAgent,
      ipAddress,
    );
    await setAuthCookie(token);
    return NextResponse.json({ ok: true, role: user.role });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "REGISTER_EMAIL_EXISTS") {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 400 });
    }

    // Nunca devolver mensajes internos de Prisma/infraestructura al cliente.
    console.error("[auth/register] request failed", error);
    return NextResponse.json({ error: "No se pudo completar el registro" }, { status: 500 });
  }
}
