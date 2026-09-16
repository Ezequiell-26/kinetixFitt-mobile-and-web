import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

const MAX_BODY_BYTES = 64 * 1024;
const RATE_LIMIT = { max: 30, windowMs: 60_000 };

function safeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.slice(0, maxLength);
}

/**
 * Endpoint para reportes de Content Security Policy (CSP).
 * Es público por diseño porque los navegadores envían estos reportes sin sesión.
 */
export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Report too large" }, { status: 413 });
  }

  const limit = await checkRateLimit(
    getClientIp({ headers: req.headers, ip: (req as Request & { ip?: string }).ip }),
    "csp-report",
    RATE_LIMIT,
  );
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many reports" },
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
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Report too large" }, { status: 413 });
    }

    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid report" }, { status: 400 });
    }

    const report = (parsed as Record<string, unknown>)["csp-report"];
    if (!report || typeof report !== "object" || Array.isArray(report)) {
      return NextResponse.json({ error: "Invalid report" }, { status: 400 });
    }

    const csp = report as Record<string, unknown>;
    console.error("[CSP VIOLATION]", {
      blockedUri: safeText(csp["blocked-uri"], 2048),
      directive: safeText(csp["effective-directive"], 256),
      originalPolicy: safeText(csp["original-policy"], 8192),
      sourceFile: safeText(csp["source-file"], 2048),
      lineNumber: typeof csp["line-number"] === "number" ? csp["line-number"] : undefined,
      columnNumber: typeof csp["column-number"] === "number" ? csp["column-number"] : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[CSP] Error processing report:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 400 });
  }
}
