"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: string;
  plan: string;
  price: number | null;
  status: string;
  nextPayment: Date | null;
  client?: { name: string | null } | null;
}

interface Payment {
  id: string;
  email: string;
  method: string;
  amount: number;
  status: string;
}

export default function TrainerPaymentsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/payments", { credentials: "include" });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        setSubs(data.subscriptions ?? []);
        setPays(data.payments ?? []);
      } catch {
        // The dashboard remains usable when payments are temporarily unavailable.
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const mrr = subs
    .filter((sub) => sub.status === "ACTIVE")
    .reduce((sum, sub) => sum + (sub.price ?? 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        <p className="text-sm text-zinc-500">Suscripciones y cobros de tus clientes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ingresos recurrentes</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">${mrr.toLocaleString("es-AR")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Suscripciones</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{subs.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Pagos registrados</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{pays.length}</p></CardContent>
        </Card>
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
                  <p className="text-xs text-zinc-500 mt-1">
                    {sub.nextPayment
                      ? `Vence ${sub.nextPayment.toLocaleDateString("es-AR")}`
                      : "Sin fecha de vencimiento"}
                  </p>
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
        </CardContent>
      </Card>
    </div>
  );
}
