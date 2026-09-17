import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import crypto from "crypto";

/**
 * Readiness con gate tras HEALTH_CHECK_TOKEN.
 * - Sin token válido: {status:"ok", timestamp} genérico (no filtra missingVars ni checks detallados).
 * - Con token válido: detalle de checks (database, environment) sin exponer nombres de vars faltantes.
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

  if (!authorized) {
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const checks = {
      ready: true,
      timestamp: new Date().toISOString(),
      checks: { database: false, environment: false },
    };

    const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
    if (missingVars.length === 0) {
      checks.checks.environment = true;
    } else {
      checks.ready = false;
      checks.checks.environment = false;
      console.warn(`[ready] Missing ${missingVars.length} required env vars`);
    }

    const dbConnected = await checkDatabaseConnection();
    checks.checks.database = dbConnected;
    if (!dbConnected) checks.ready = false;

    const statusCode = checks.ready ? 200 : 503;
    return NextResponse.json(
      { ready: checks.ready, timestamp: checks.timestamp, checks: checks.checks },
      { status: statusCode, headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Readiness check failed:", error);
    return NextResponse.json(
      { ready: false, timestamp: new Date().toISOString() },
      { status: 503, headers: NO_CACHE_HEADERS }
    );
  }
}
