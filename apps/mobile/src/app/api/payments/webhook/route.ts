import { NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || process.env.MERCADO_PAGO_WEBHOOK_SECRET;

type Provider = "stripe" | "mercadopago";
type SettlementStatus = "PAGADO" | "PENDIENTE" | "VENCIDO";

function constantTimeHexEqual(a: string, b: string) {
  const aa = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function verifyMpSignature(req: Request, dataId: string | null, secret: string) {
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signature || !secret) return false;
  const parts = Object.fromEntries(signature.split(",").map((part) => {
    const index = part.indexOf("=");
    return index >= 0 ? [part.slice(0, index).trim(), part.slice(index + 1).trim()] : [part.trim(), ""];
  }));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!v1 || !ts) return false;
  const manifest = `${dataId ? `id:${dataId};` : ""}${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
  const digest = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return constantTimeHexEqual(digest, v1);
}

async function claimEvent(provider: Provider, eventId: string) {
  const claimed = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    INSERT INTO "PaymentWebhookEvent" ("id", "provider", "eventId")
    VALUES (${crypto.randomUUID()}, ${provider}, ${eventId})
    ON CONFLICT ("provider", "eventId") DO NOTHING
    RETURNING "id"
  `);
  return claimed.length > 0;
}

async function settlePayment(input: {
  paymentId: string;
  status: SettlementStatus;
  method: string;
  externalDescription: string;
  amount?: number | null;
  currency?: string | null;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    select: { id: true, clientId: true, amount: true, currency: true, status: true },
  });
  if (!payment) return { updated: false, reason: "payment_not_found" as const };

  if (input.amount != null) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { updated: false, reason: "invalid_provider_amount" as const };
    }
    if (Math.abs(Number(payment.amount) - input.amount) > 0.01) {
      console.error("[WEBHOOK] payment amount mismatch", {
        paymentId: payment.id,
        expected: Number(payment.amount),
        received: input.amount,
      });
      return { updated: false, reason: "amount_mismatch" as const };
    }
  }

  if (input.currency && payment.currency.toUpperCase() !== input.currency.toUpperCase()) {
    console.error("[WEBHOOK] payment currency mismatch", {
      paymentId: payment.id,
      expected: payment.currency,
      received: input.currency,
    });
    return { updated: false, reason: "currency_mismatch" as const };
  }

  const updated = await prisma.payment.updateMany({
    where: { id: payment.id, status: { not: "PAGADO" } },
    data: {
      status: input.status,
      method: input.method,
      description: input.externalDescription.slice(0, 500),
    },
  });

  if (updated.count > 0 && input.status === "PAGADO" && payment.clientId) {
    const subscription = await prisma.subscription.findUnique({ where: { clientId: payment.clientId } });
    if (subscription) {
      const nextPayment = new Date();
      nextPayment.setDate(nextPayment.getDate() + 30);
      await prisma.subscription.update({
        where: { clientId: payment.clientId },
        data: {
          status: "ACTIVA",
          nextPayment,
          ...(input.amount != null ? { price: input.amount } : {}),
        },
      });
    }
  }

  return { updated: updated.count > 0, reason: updated.count > 0 ? "updated" : "already_settled" as const };
}

function subscriptionStatus(status: string) {
  if (status === "active" || status === "trialing") return "ACTIVA" as const;
  if (status === "canceled") return "CANCELADA" as const;
  if (status === "past_due" || status === "unpaid" || status === "incomplete_expired") return "VENCIDA" as const;
  return "PENDIENTE" as const;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const url = new URL(req.url);
    const stripeSignature = req.headers.get("stripe-signature");
    const mpSignature = req.headers.get("x-signature");

    if (stripeSignature) {
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 });
      }
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      let event: import("stripe").default.Event;
      try {
        event = stripe.webhooks.constructEvent(body, stripeSignature, process.env.STRIPE_WEBHOOK_SECRET);
      } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }

      if (!(await claimEvent("stripe", event.id))) return NextResponse.json({ received: true, duplicate: true });
      try {
        const payload = event.data.object as unknown as Record<string, unknown>;
        const metadata = payload.metadata && typeof payload.metadata === "object" ? payload.metadata as Record<string, unknown> : {};
        const paymentId = typeof metadata.paymentId === "string" ? metadata.paymentId : null;

        switch (event.type) {
          case "checkout.session.completed":
          case "checkout.session.async_payment_succeeded":
            if (paymentId) {
              await settlePayment({
                paymentId,
                status: "PAGADO",
                method: "STRIPE",
                externalDescription: `Pago vía Stripe · ${event.id}`,
                amount: typeof payload.amount_total === "number" ? payload.amount_total / 100 : null,
                currency: typeof payload.currency === "string" ? payload.currency : null,
              });
            }
            break;
          case "payment_intent.succeeded":
            if (paymentId) {
              await settlePayment({
                paymentId,
                status: "PAGADO",
                method: "STRIPE",
                externalDescription: `PaymentIntent · ${event.id}`,
                amount: typeof payload.amount_received === "number" ? payload.amount_received / 100 : null,
                currency: typeof payload.currency === "string" ? payload.currency : null,
              });
            }
            break;
          case "payment_intent.payment_failed":
            if (paymentId) {
              await settlePayment({
                paymentId,
                status: "VENCIDO",
                method: "STRIPE",
                externalDescription: `Pago rechazado · ${event.id}`,
              });
            }
            break;
          case "customer.subscription.updated":
          case "customer.subscription.deleted": {
            const clientId = typeof metadata.clientId === "string" ? metadata.clientId : null;
            if (clientId) {
              await prisma.subscription.updateMany({
                where: { clientId },
                data: {
                  status: subscriptionStatus(String(payload.status || (event.type.endsWith("deleted") ? "canceled" : "unknown"))),
                  ...(typeof payload.current_period_end === "number" ? { nextPayment: new Date(payload.current_period_end * 1000) } : {}),
                },
              });
            }
            break;
          }
          default:
            break;
        }
      } catch (processingError) {
        await prisma.$executeRaw(Prisma.sql`DELETE FROM "PaymentWebhookEvent" WHERE "provider" = ${"stripe"} AND "eventId" = ${event.id}`);
        throw processingError;
      }
      return NextResponse.json({ received: true });
    }

    if (mpSignature) {
      if (!MP_WEBHOOK_SECRET || !MP_ACCESS_TOKEN) return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 500 });
      const dataId = url.searchParams.get("data.id") || url.searchParams.get("data_id");
      if (!verifyMpSignature(req, dataId, MP_WEBHOOK_SECRET)) return NextResponse.json({ error: "Invalid MP signature" }, { status: 401 });
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(body) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      const eventId = data.id != null ? String(data.id) : `${data.type || "unknown"}:${dataId || "unknown"}:${data.action || "unknown"}`;
      if (!(await claimEvent("mercadopago", eventId))) return NextResponse.json({ received: true, duplicate: true });
      try {
        if (data.type === "payment" && dataId) {
          const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
            cache: "no-store",
          });
          if (!response.ok) throw new Error("Mercado Pago payment lookup failed");
          const payment = await response.json() as Record<string, unknown>;
          const externalReference = typeof payment.external_reference === "string" ? payment.external_reference : null;
          if (!externalReference) throw new Error("Mercado Pago payment missing external reference");
          const status = payment.status === "approved" ? "PAGADO" : payment.status === "pending" || payment.status === "in_process" ? "PENDIENTE" : "VENCIDO";
          await settlePayment({
            paymentId: externalReference,
            status,
            method: "MERCADOPAGO",
            externalDescription: `Mercado Pago · ${dataId}`,
            amount: typeof payment.transaction_amount === "number" ? payment.transaction_amount : null,
            currency: typeof payment.currency_id === "string" ? payment.currency_id : null,
          });
        }
      } catch (processingError) {
        await prisma.$executeRaw(Prisma.sql`DELETE FROM "PaymentWebhookEvent" WHERE "provider" = ${"mercadopago"} AND "eventId" = ${eventId}`);
        throw processingError;
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
  } catch (error) {
    console.error("[WEBHOOK] processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
