"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { CreditCard, Check, ExternalLink, Loader2 } from "lucide-react";
import { capture, trackCheckoutStarted } from "@/lib/posthog";

const PLANS = [
  { id: "basico", name: "Plan Básico", price: 25000, features: ["Rutina 3d", "Check-in mensual", "Chat"] },
  { id: "personalizado", name: "Personalizado", price: 45000, features: ["Rutina 5d", "Check-in semanal", "Chat + video", "Nutrición"] },
  { id: "premium", name: "Premium", price: 75000, features: ["Todo Personalizado", "1:1 semanal", "Plan nutrición", "Prioridad"] },
] as const;

type Client = { id: string; name: string; email?: string | null; plan?: string | null };

export function PaymentsPro({ onSelect }: { onSelect?: (plan: string) => void }) {
  const [selected, setSelected] = useState("personalizado");
  const [email, setEmail] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<"stripe" | "mp" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    capture("trainer_payments_viewed", { source: "payments_pro_component", selected_plan: selected });
    void fetch("/api/clients?limit=200")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setClients(items);
        if (items[0]?.id) {
          setClientId(items[0].id);
          setEmail(items[0].email || "");
        }
      })
      .catch(() => setError("No se pudieron cargar los clientes."));
  }, [selected]);

  const selectedClient = clients.find((client) => client.id === clientId);
  const plan = PLANS.find((item) => item.id === selected) ?? PLANS[1];

  function handleClientChange(value: string) {
    setClientId(value);
    const client = clients.find((item) => item.id === value);
    setEmail(client?.email || "");
    setError(null);
  }

  async function checkout(provider: "stripe" | "mp") {
    if (!clientId) {
      setError("Seleccioná un cliente antes de iniciar el checkout.");
      return;
    }

    setError(null);
    setLoading(provider);
    trackCheckoutStarted({
      plan: selected,
      provider,
      price: plan.price,
      currency: "ARS",
      email: email || selectedClient?.email || undefined,
    });
    capture("payment_checkout_requested", {
      plan: selected,
      provider,
      amount: plan.price,
      currency: "ARS",
      clientId,
    });

    try {
      const idempotencyKey = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `checkout-${Date.now()}`;

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          clientId,
          amount: plan.price,
          provider: provider === "mp" ? "mercadopago" : provider,
          description: `${plan.name} · KinetixFitt`,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "No se pudo iniciar el checkout.");
      }

      onSelect?.(selected);
      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "No se pudo iniciar el checkout.");
      setLoading(null);
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard size={18} className="text-primary" />
          Pagos PRO
          <Badge variant="accent">Stripe + MP</Badge>
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Checkout real conectado a /api/payments/checkout. Las credenciales del proveedor se validan en servidor.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Cliente</Label>
          <select
            value={clientId}
            onChange={(event) => handleClientChange(event.target.value)}
            disabled={loading !== null || clients.length === 0}
            className="mt-1 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            {clients.length === 0 ? (
              <option value="">Cargando clientes…</option>
            ) : (
              clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}{client.email ? ` · ${client.email}` : ""}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid gap-2">
          {PLANS.map((item) => {
            const isSelected = selected === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                disabled={loading !== null}
                className={`text-left p-3 rounded-xl border flex justify-between items-center ${
                  isSelected
                    ? "bg-primary text-black border-primary"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div>
                  <p className={`font-bold text-sm ${isSelected ? "text-black" : "text-white"}`}>
                    {item.name} {isSelected && <Check size={12} className="inline ml-1" />}
                  </p>
                  <p className={`text-xs ${isSelected ? "text-black/70" : "text-zinc-500"}`}>
                    {item.features.join(" • ")}
                  </p>
                </div>
                <span className={`font-black ${isSelected ? "text-black" : "text-white"}`}>
                  ${item.price.toLocaleString("es-AR")} <span className="text-[10px] font-normal opacity-60">/mes</span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <Label>Email para checkout</Label>
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="cliente@email.com"
            type="email"
            autoComplete="email"
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="accent" className="h-11 font-black" onClick={() => void checkout("stripe")} disabled={!!loading || !clientId}>
            {loading === "stripe" ? <><Loader2 size={15} className="mr-2 animate-spin" /> Redirigiendo…</> : "Pagar con Stripe →"}
          </Button>
          <Button variant="outline" className="h-11 font-black" onClick={() => void checkout("mp")} disabled={!!loading || !clientId}>
            {loading === "mp" ? <><Loader2 size={15} className="mr-2 animate-spin" /> Redirigiendo…</> : "Mercado Pago →"}
          </Button>
        </div>

        <p className="text-[11px] text-zinc-600 text-center">
          El pago se crea en el backend y luego se redirige al checkout del proveedor.
          <a href="https://stripe.com/docs/payments/checkout" target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 underline">
            Docs <ExternalLink size={10} />
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
