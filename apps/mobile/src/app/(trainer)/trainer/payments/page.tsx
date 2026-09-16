import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsPro } from "@/components/payments-pro";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/constants/branding";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { TrainerPaymentsTracker } from "@/components/posthog-tracker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    redirect(`/login?next=${encodeURIComponent("/trainer/payments")}`);
  }

  const [subs, pays, activeSubs] = await Promise.all([
    prisma.subscription.findMany({
      where: { client: { trainerId: session.id } },
      select: {
        id: true,
        client: { select: { name: true } },
        plan: true,
        status: true,
        price: true,
        nextPayment: true,
      },
      orderBy: { nextPayment: "asc" },
    }).catch(() => []),
    prisma.payment.findMany({
      where: { client: { trainerId: session.id } },
      orderBy: { date: "desc" },
      take: 20,
      select: { id: true, email: true, amount: true, status: true, method: true, date: true },
    }).catch(() => []),
    prisma.subscription.findMany({
      where: { status: "ACTIVA", client: { trainerId: session.id } },
      select: { price: true },
    }).catch(() => []),
  ]);

  const mrr = activeSubs.reduce((sum, sub) => sum + (sub.price ?? 0), 0);

  return (
    <div className="space-y-4">
      <TrainerPaymentsTracker mrr={mrr} totalPayments={pays.length} />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold">Pagos y suscripciones</h1>
          <p className="text-sm text-zinc-500">Preparado para Stripe / Mercado Pago — tracking MRR en PostHog</p>
        </div>
        {subs.length === 0 && pays.length === 0 && (
          <Badge variant="warn">Sin datos de pagos</Badge>
        )}
      </div>
      <PaymentsPro />
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { plan: "BÁSICO", price: 12000, desc: "Seguimiento básico" },
          { plan: "PERSONALIZADO", price: 18000, desc: "Programa a medida", featured: true },
          { plan: "PREMIUM", price: 25000, desc: "Coaching 1:1 + ajustes semanales" },
        ].map((p) => (
          <Card key={p.plan} className={p.featured ? "border-primary/30" : ""} style={p.featured ? { borderColor: BRAND.colors.lime, backgroundColor: `${BRAND.colors.lime}0A` } : undefined}>
            <CardHeader>
              <CardTitle className="text-sm">{p.plan}</CardTitle>
              <p className="text-2xl font-black">${p.price.toLocaleString("es-AR")} ARS</p>
              <p className="text-xs text-zinc-500">{p.desc}</p>
            </CardHeader>
            <CardContent>
              <Button variant={p.featured ? "accent" : "outline"} size="sm" className="w-full">Gestionar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Suscripciones activas {mrr > 0 && <Badge variant="success">MRR ${mrr.toLocaleString("es-AR")}</Badge>}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {subs.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">No hay suscripciones registradas todavía.</p>
          ) : (
            subs.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="font-semibold text-sm">{sub.client?.name}</p>
                  <p className="text-xs text-zinc-500">{sub.plan} • ${sub.price?.toLocaleString("es-AR")}</p>
                </div>
                <div className="text-right">
                  <Badge variant="success">{sub.status}</Badge>
                  <p className="text-xs text-zinc-500 mt-1">{sub.nextPayment ? `Vence ${sub.nextPayment.toLocaleDateString("es-AR")}` : "Sin fecha de vencimiento"}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Historial de pagos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {pays.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">No hay pagos registrados todavía.</p>
          ) : (
            pays.map((p) => (
              <div key={p.id} className="flex justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm">
                <span>{p.email} • {p.method}</span>
                <span className="font-bold">${p.amount.toLocaleString("es-AR")}</span>
                <Badge variant="success">{p.status}</Badge>
              </div>
            ))
          )}
          <p className="text-xs text-zinc-500 text-center pt-2"><Lock size={11} className="inline mr-1 -mt-0.5" />No se almacenan datos de tarjeta. Integración vía backend seguro.</p>
        </CardContent>
      </Card>
    </div>
  );
}
