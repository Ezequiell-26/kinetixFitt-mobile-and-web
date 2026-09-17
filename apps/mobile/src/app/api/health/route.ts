import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import crypto from "crypto";

/**
 * Health check con gate tras HEALTH_CHECK_TOKEN.
 * - Sin token válido: respuesta pública mínima {status:"ok", timestamp} (no filtra environment, uptime, version, DB).
 * - Con token válido (x-health-token / x-health-check-token / Authorization Bearer): detalles completos.
 * - Errores nunca exponen error.message al cliente.
 */
function isAuthorized(req: Request): boolean {
  const expected = process.env.HEALTH_CHECK_TOKEN;
  if (!expected) return false;
  const headerToken =
    req.headers.get("x-health-token") ||
    req.headers.get("x-health-check-token") ||
    (() => {
      const auth = req.headers.get("authorization");
      if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
      return null;
    })();
  if (!headerToken) return false;
  if (headerToken.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(expected));
  } catch {
    return false;
  }
}

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function GET(req: Request) {
  const authorized = isAuthorized(req);

  // Vista pública mínima: no filtrar environment/uptime/version/DB
  if (!authorized) {
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  }

  // Vista detallada solo con token válido
  try {
    const dbConnected = await checkDatabaseConnection();
    const isHealthy = dbConnected;
    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        database: dbConnected ? "connected" : "disconnected",
        uptime: process.uptime(),
      },
      {
        status: isHealthy ? 200 : 503,
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "unhealthy", timestamp: new Date().toISOString() },
      { status: 503, headers: NO_CACHE_HEADERS }
    );
  }
}
