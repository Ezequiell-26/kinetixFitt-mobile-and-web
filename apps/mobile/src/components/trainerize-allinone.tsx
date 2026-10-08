"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Dumbbell, CreditCard, MessageSquare, Plus, AlertCircle } from "lucide-react";

type Client = {
  id: string;
  name: string;
  plan?: string | null;
  status?: string | null;
  assignedProgram?: { name?: string | null } | null;
  subscription?: { status?: string | null; price?: number | null; nextPayment?: string | null } | null;
};

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

export function TrainerizeAllInOne() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/clients?limit=100", { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(body?.error || "No se pudieron cargar los clientes.");
        }
        return response.json() as Promise<{ items?: Client[] }>;
      })
      .then((payload) => setClients(Array.isArray(payload.items) ? payload.items : []))
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "No se pudieron cargar los clientes.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const recurringRevenue = clients.reduce((sum, client) => {
    const price = client.subscription?.price;
    return sum + (typeof price === "number" && Number.isFinite(price) ? price : 0);
  }, 0);

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutDashboard size={18} className="text-primary" />
              Vista de cartera
            </CardTitle>
            <p className="mt-1 text-xs text-zinc-500">Resumen operativo conectado a los clientes reales del trainer.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="muted"><Users size={11} className="mr-1" /> {clients.length} clientes</Badge>
            <Badge variant="muted"><CreditCard size={11} className="mr-1" /> {formatMoney(recurringRevenue)} / ciclo</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-500">
            Cargando cartera…
          </div>
        )}
        {!loading && error && (
          <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}
        {!loading && !error && clients.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center">
            <Users size={22} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm font-semibold">Todavía no tenés clientes cargados.</p>
            <p className="mt-1 text-xs text-zinc-500">Creá el primero para empezar a operar la cartera.</p>
            <Link href="/trainer/clients/new" className="mt-4 inline-flex">
              <Button variant="accent"><Plus size={14} /> Crear cliente</Button>
            </Link>
          </div>
        )}
        {!loading && !error && clients.length > 0 && (
          <div className="grid gap-2 md:grid-cols-2">
            {clients.slice(0, 12).map((client) => (
              <div key={client.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{client.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                      <Dumbbell size={12} /> {client.assignedProgram?.name || "Sin programa asignado"}
                    </p>
                  </div>
                  <Badge variant={client.status === "ACTIVO" ? "success" : "muted"}>{client.status || "Sin estado"}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-zinc-500"><CreditCard size={12} /> {client.subscription?.status || "Sin suscripción"}</span>
                  <span className="font-bold">{formatMoney(client.subscription?.price)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/trainer/clients/${client.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full"><Users size={12} /> Ver cliente</Button>
                  </Link>
                  <Link href={`/trainer/messages?clientId=${client.id}`}>
                    <Button size="sm" variant="ghost" aria-label={`Abrir mensajes de ${client.name}`}>
                      <MessageSquare size={13} />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && clients.length > 12 && (
          <div className="flex justify-center pt-1">
            <Link href="/trainer/clients">
              <Button variant="outline"><Users size={14} /> Ver toda la cartera</Button>
            </Link>
          </div>
        )}
        <div className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-[11px] text-zinc-500">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          Las métricas avanzadas aparecen solo cuando existen datos reales de sesiones, check-ins, pagos y progreso.
        </div>
      </CardContent>
    </Card>
  );
}
