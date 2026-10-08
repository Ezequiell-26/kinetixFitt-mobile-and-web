import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";
import { getJwtSecret } from "@/lib/secret";
import { checkRateLimit, RATE_LIMIT_PROFILES, getClientIp } from "@/lib/rate-limiter";

const SECRET = getJwtSecret();
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const WEBHOOK_PATHS = new Set(["/api/payments/webhook"]);

function generateNonce(): string {
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("Secure randomness is unavailable; refusing to create a CSP nonce without cryptographic randomness.");
  }
  const arr = new Uint8Array(16);
  c.getRandomValues(arr);
  let binary = "";
  arr.forEach((b) => { binary += String.fromCharCode(b); });
  return typeof btoa === "function" ? btoa(binary) : Buffer.from(arr).toString("base64");
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const scriptSrc = [
    // Next 15.5.x has a framework bug where some App Router boundary chunks
    // (loading/template/error) are emitted without the request nonce.
    // Enabling strict-dynamic here would block those parser-inserted same-origin chunks.
    // Nonces still protect inline scripts; self allows only same-origin files.
    "'self'",
    `'nonce-${nonce}'`,
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://us.i.posthog.com",
    "https://us-assets.i.posthog.com",
    "https://eu.i.posthog.com",
    "https://app.posthog.com",
    isDev ? "'unsafe-eval'" : null,
  ].filter(Boolean).join(" ");
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://fonts.gstatic.com https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.sentry.io https://www.google-analytics.com https://us.i.posthog.com https://us.posthog.com https://eu.i.posthog.com https://app.posthog.com https://*.posthog.com https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applyCsp(response: NextResponse, nonce: string, csp = buildCsp(nonce)): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  response.headers.set("x-csp-nonce", nonce);
  return response;
}

function rateLimitResponse(resetMs: number) {
  const retryAfter = Math.max(1, Math.ceil(resetMs / 1000));
  return new NextResponse(JSON.stringify({ error: "Too many requests", retryAfterSeconds: retryAfter }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter), "X-RateLimit-Remaining": "0" },
  });
}

function getTrustedOrigins(req: NextRequest): Set<string> {
  const origins = new Set<string>();
  for (const candidate of [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_WEB_URL, process.env.WEB_URL]) {
    if (!candidate) continue;
    try { origins.add(new URL(candidate).origin); } catch { /* invalid optional config */ }
  }
  origins.add(req.nextUrl.origin);
  return origins;
}

function csrfCheck(req: NextRequest): NextResponse | null {
  if (!req.nextUrl.pathname.startsWith("/api/")) return null;
  if (!MUTATING_METHODS.has(req.method)) return null;
  if (WEBHOOK_PATHS.has(req.nextUrl.pathname)) return null;

  const origin = req.headers.get("origin");
  if (!origin) return null; // Native clients / same-process calls may omit Origin.
  if (!getTrustedOrigins(req).has(origin)) {
    return new NextResponse(JSON.stringify({ error: "Origin no permitido" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let nonce: string;
  try {
    nonce = generateNonce();
  } catch (error) {
    console.error("[CSP] secure nonce generation failed", error);
    return new NextResponse("Security configuration error", { status: 500 });
  }
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  // Next.js needs the CSP on the request headers as well as the response
  // so it can propagate the nonce to framework hydration scripts.
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-csp-nonce", nonce);
  const ip = getClientIp(req);

  const csrfResponse = csrfCheck(req);
  if (csrfResponse) return applyCsp(csrfResponse, nonce, csp);

  if (path.startsWith("/api/auth/login")) {
    const r = await checkRateLimit(ip, "auth", RATE_LIMIT_PROFILES.auth); if (!r.success) return applyCsp(rateLimitResponse(r.resetMs), nonce, csp);
  } else if (path.startsWith("/api/auth/register")) {
    const r = await checkRateLimit(ip, "register", RATE_LIMIT_PROFILES.register); if (!r.success) return applyCsp(rateLimitResponse(r.resetMs), nonce, csp);
  } else if (path.startsWith("/api/auth/forgot-password")) {
    const r = await checkRateLimit(ip, "auth", RATE_LIMIT_PROFILES.auth); if (!r.success) return applyCsp(rateLimitResponse(r.resetMs), nonce, csp);
  } else if (path.startsWith("/api/auth/reset-password")) {
    const r = await checkRateLimit(ip, "auth", RATE_LIMIT_PROFILES.auth); if (!r.success) return applyCsp(rateLimitResponse(r.resetMs), nonce, csp);
  } else if (path.startsWith("/api/uploads")) {
    const r = await checkRateLimit(ip, "upload", RATE_LIMIT_PROFILES.upload); if (!r.success) return applyCsp(rateLimitResponse(r.resetMs), nonce, csp);
  } else if (path.startsWith("/api/messages")) {
    const r = await checkRateLimit(ip, "messages", RATE_LIMIT_PROFILES.messages); if (!r.success) return applyCsp(rateLimitResponse(r.resetMs), nonce, csp);
  } else if (path.startsWith("/api/")) {
    const r = await checkRateLimit(ip, "api", RATE_LIMIT_PROFILES.api); if (!r.success) return applyCsp(rateLimitResponse(r.resetMs), nonce, csp);
  }

  if (path === "/") {
    const token = req.cookies.get("ec_token")?.value;
    if (token) {
      try {
        const { payload } = await jose.jwtVerify(token, SECRET);
        const role = (payload as unknown as { role: string }).role;
        if (role === "TRAINER") return applyCsp(NextResponse.redirect(new URL("/trainer/dashboard", req.url)), nonce, csp);
        if (role === "CLIENT") return applyCsp(NextResponse.redirect(new URL("/client/dashboard", req.url)), nonce, csp);
      } catch {}
    }
    return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }), nonce, csp);
  }

  if (path === "/login" || path === "/register") {
    const token = req.cookies.get("ec_token")?.value;
    if (token) {
      try {
        const { payload } = await jose.jwtVerify(token, SECRET);
        const role = (payload as unknown as { role: string }).role;
        return applyCsp(NextResponse.redirect(new URL(role === "TRAINER" ? "/trainer/dashboard" : "/client/dashboard", req.url)), nonce, csp);
      } catch {}
    }
    return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }), nonce, csp);
  }

  const isTrainer = path.startsWith("/trainer");
  const isClient = path.startsWith("/client");
  if (!isTrainer && !isClient) return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }), nonce, csp);
  const token = req.cookies.get("ec_token")?.value;
  if (!token) return applyCsp(NextResponse.redirect(new URL("/login", req.url)), nonce, csp);
  try {
    const { payload } = await jose.jwtVerify(token, SECRET);
    const role = (payload as unknown as { role: string }).role;
    if (isTrainer && role !== "TRAINER") return applyCsp(NextResponse.redirect(new URL("/client/dashboard", req.url)), nonce, csp);
    if (isClient && role !== "CLIENT") return applyCsp(NextResponse.redirect(new URL("/trainer/dashboard", req.url)), nonce, csp);
    return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }), nonce, csp);
  } catch {
    return applyCsp(NextResponse.redirect(new URL("/login", req.url)), nonce, csp);
  }
}

export const config = { matcher: ["/", "/login", "/register", "/trainer/:path*", "/client/:path*", "/api/:path*"] };
