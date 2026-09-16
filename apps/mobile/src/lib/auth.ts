import * as jose from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getJwtSecret } from "./secret";
import { createSession, revokeSession, revokeAllUserSessions, validateSession } from "./session-store";
import { prisma } from "./db";

const SECRET = getJwtSecret();
const COOKIE_NAME = "ec_token";
const MAX_AGE = 60 * 60 * 24 * 7;

export type JWTPayload = {
  id: string;
  email: string;
  role: "TRAINER" | "CLIENT";
  name: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: JWTPayload) {
  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET);
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "TRAINER" && payload.role !== "CLIENT") ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

/**
 * Crea el JWT y registra la sesión en DB para permitir revocación server-side.
 */
export async function createAuthSession(
  payload: JWTPayload,
  userAgent?: string,
  ipAddress?: string,
): Promise<string> {
  const jwt = await createToken(payload);
  await createSession(payload.id, jwt, userAgent, ipAddress);
  return jwt;
}

export async function setAuthCookie(token: string) {
  const c = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getSession(): Promise<JWTPayload | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const userId = await validateSession(token);
  if (!userId || userId !== payload.id) return null;

  // The DB remains the source of truth for identity and authorization.
  // This prevents stale role/email/name claims from surviving an account change.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
}

export async function requireRole(roles: ("TRAINER" | "CLIENT")[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) return null;
  return session;
}

export async function logoutCurrentSession() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (token) await revokeSession(token);
}

export async function logoutAllSessions(userId: string) {
  return revokeAllUserSessions(userId);
}

export async function getCurrentUser() {
  return getSession();
}
