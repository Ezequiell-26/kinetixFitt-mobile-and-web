/**
 * Security E2E: isolated fixtures per run. Requires a live app + PostgreSQL.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertTrainerOwnsClient, validateClientIdForTrainer } from "../src/lib/authorization";
import { sanitizePath, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from "../src/lib/security";

const BASE = process.env.BASE_URL || "http://localhost:3001";

if (!process.env.DATABASE_URL?.startsWith("postgresql")) {
  console.error("SKIPPED: security E2E requires DATABASE_URL=postgresql.");
  process.exit(2);
}
const prisma = new PrismaClient();
const TAG = `sectest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "SecTest!2026";
let passed = 0;
let failed = 0;
let trainerAId = "";
let trainerBId = "";
let clientAId = "";
let clientBId = "";
let checkinBId = "";

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`); }
  else { failed += 1; console.log(`  FAIL  ${name}`, detail ?? ""); }
}

async function login(email: string) {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) return null;
  const setCookie = response.headers.get("set-cookie") || "";
  const match = setCookie.match(/ec_token=([^;]+)/);
  return match ? `ec_token=${match[1]}` : null;
}

async function request(path: string, cookie?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("Cookie", cookie);
  return fetch(`${BASE}${path}`, { ...init, headers });
}

async function cleanup() {
  try {
    const users = await prisma.user.findMany({ where: { email: { startsWith: TAG } }, select: { id: true } });
    const ids = users.map((u) => u.id);
    if (ids.length) await prisma.user.deleteMany({ where: { id: { in: ids } } });
    if (clientAId || clientBId) await prisma.client.deleteMany({ where: { id: { in: [clientAId, clientBId].filter(Boolean) } } }).catch(() => {});
  } finally { await prisma.$disconnect(); }
}

async function main() {
  try {
    const health = await fetch(`${BASE}/api/health`);
    if (!health.ok && health.status !== 503) throw new Error(`health HTTP ${health.status}`);
  } catch {
    console.log(`\nABORTADO: no hay servidor en ${BASE}. Levantalo y reintentá.\n`);
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const trainerA = await prisma.user.create({ data: { name: "Security Trainer A", email: `${TAG}-trainer-a@test.invalid`, password: passwordHash, role: "TRAINER" } });
    const trainerB = await prisma.user.create({ data: { name: "Security Trainer B", email: `${TAG}-trainer-b@test.invalid`, password: passwordHash, role: "TRAINER" } });
    trainerAId = trainerA.id; trainerBId = trainerB.id;
    const clientAUser = await prisma.user.create({ data: { name: "Security Client A", email: `${TAG}-client-a@test.invalid`, password: passwordHash, role: "CLIENT" } });
    const clientBUser = await prisma.user.create({ data: { name: "Security Client B", email: `${TAG}-client-b@test.invalid`, password: passwordHash, role: "CLIENT" } });
    const clientA = await prisma.client.create({ data: { name: clientAUser.name, email: clientAUser.email, userId: clientAUser.id, trainerId: trainerAId } });
    const clientB = await prisma.client.create({ data: { name: clientBUser.name, email: clientBUser.email, userId: clientBUser.id, trainerId: trainerBId } });
    clientAId = clientA.id; clientBId = clientB.id;
    const checkin = await prisma.checkIn.create({ data: { userId: clientBUser.id, clientId: clientB.id, energia: 8, reviewed: false } });
    checkinBId = checkin.id;

    const cookieA = await login(trainerA.email);
    const cookieB = await login(trainerB.email);
    const cookieClientB = await login(clientBUser.email);
    check("login trainer A", !!cookieA);
    check("login trainer B", !!cookieB);
    check("login client B", !!cookieClientB);
    if (!cookieA || !cookieB || !cookieClientB) throw new Error("No se pudieron crear sesiones de prueba");

    const ownClient = await request(`/api/clients/${clientAId}`, cookieA);
    check("trainer A ve su propio cliente", ownClient.status === 200, ownClient.status);
    const crossClient = await request(`/api/clients/${clientBId}`, cookieA);
    check("trainer A no ve cliente de trainer B", crossClient.status === 404, crossClient.status);
    const crossClientPatch = await request(`/api/clients/${clientBId}`, cookieA, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin }, body: JSON.stringify({ notes: "cross-tenant" }) });
    check("trainer A no modifica cliente de trainer B", crossClientPatch.status === 404, crossClientPatch.status);
    const ownPatch = await request(`/api/clients/${clientAId}`, cookieA, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin }, body: JSON.stringify({ notes: "updated safely" }) });
    check("trainer A modifica su cliente", ownPatch.status === 200, ownPatch.status);

    const csrfAttempt = await request(`/api/clients/${clientAId}`, cookieA, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: "https://attacker.invalid" }, body: JSON.stringify({ notes: "csrf" }) });
    check("Origin externo bloqueado por CSRF", csrfAttempt.status === 403, csrfAttempt.status);

    const checkinPatch = await request("/api/checkins", cookieA, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: new URL(BASE).origin }, body: JSON.stringify({ id: checkinBId, trainerReply: "unauthorized" }) });
    check("trainer A no modifica check-in de trainer B", checkinPatch.status === 404, checkinPatch.status);
    const clientOwnCheckins = await request(`/api/checkins?clientId=${clientBId}`, cookieClientB);
    check("cliente B accede a su check-in", clientOwnCheckins.status === 200, clientOwnCheckins.status);

    const unsignedWebhook = await request("/api/payments/webhook", undefined, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "payment", data: { id: "fake" } }) });
    check("webhook de pago sin firma rechazado", unsignedWebhook.status === 401, unsignedWebhook.status);
    const unsignedPush = await request("/api/push/send", undefined, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userIds: [clientBId], title: "x", body: "x" }) });
    check("push interno sin credencial rechazado", unsignedPush.status === 401, unsignedPush.status);

    const form = new FormData();
    form.append("type", "../..");
    form.append("file", new Blob(["x"], { type: "image/jpeg" }), "p.jpg");
    const upload = await request("/api/uploads", cookieClientB, { method: "POST", body: form, headers: { Origin: new URL(BASE).origin } });
    check("upload traversal rechazado", upload.status === 400, upload.status);
    const anonymousUpload = await request("/api/uploads", undefined, { method: "POST", body: new FormData() });
    check("upload anónimo rechazado", anonymousUpload.status === 401, anonymousUpload.status);

    check("assertTrainerOwnsClient(A,A) true", await assertTrainerOwnsClient(trainerAId, clientAId) === true);
    check("assertTrainerOwnsClient(A,B) false", await assertTrainerOwnsClient(trainerAId, clientBId) === false);
    check("validateClientIdForTrainer inválido null", await validateClientIdForTrainer(trainerAId, "invalid-client-id") === null);
    check("sanitizePath traversal", sanitizePath("../../../etc/passwd") === "etc/passwd");
    check("sanitizePath backslashes", sanitizePath("..\\..\\windows\\system32") === "windows/system32");
    check("sanitizePath normal intacto", sanitizePath("normal/path/file.jpg") === "normal/path/file.jpg");
    check("extensiones peligrosas fuera de allowlist", ["exe", "bat", "sh", "php", "js", "html", "svg"].every((e) => !(ALLOWED_EXTENSIONS as readonly string[]).includes(e as never)));
    check("MIME peligrosos fuera de allowlist", ["application/x-executable", "text/html", "application/javascript"].every((m) => !(ALLOWED_MIME_TYPES as readonly string[]).includes(m as never)));

    console.log(`\nResultado: ${passed} pass, ${failed} fail\n`);
    await cleanup();
    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error("ERROR en security E2E:", error);
    await cleanup();
    process.exit(1);
  }
}

void main();
