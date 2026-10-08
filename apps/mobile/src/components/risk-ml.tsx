"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, CheckCircle2 } from "lucide-react";

type RiskItem = {
  id: string;
  name: string;
  inactiveDays: number;
  reasons: string[];
  priority: "high" | "medium" | "low";
};

export function RiskMl() {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/automation/risk", { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(body?.error || "No se pudo calcular el riesgo.");
        }
        return response.json() as Promise<{ risks?: RiskItem[] }>;
      })
      .then((payload) => setRisks(Array.isArray(payload.risks) ? payload.risks : []))
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "No se pudo calcular el riesgo.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <Card className="border-red-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain size={16} className="text-red-400" /> Risk ML
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Señales de inactividad y check-ins pendientes de tu cartera.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
            Analizando cartera…
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && risks.length === 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            No hay señales de riesgo en la cartera actual.
          </div>
        )}

        {!loading && !error && risks.slice(0, 10).map((risk) => (
          <div
            key={risk.id}
            className={
              `p-3 rounded-xl border flex gap-3 items-start ${risk.priority === "high"
                ? "bg-red-500/10 border-red-500/20"
                : risk.priority === "medium"
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-zinc-900 border-zinc-800"}`
            }
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/30 text-xs font-black text-white">
              <AlertTriangle size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{risk.name}</p>
              <p className="text-xs text-zinc-500">
                {risk.inactiveDays} días desde la última actividad relevante.
              </p>
              <p className="mt-1 text-xs text-zinc-400">{risk.reasons.join(" · ")}</p>
            </div>
            <Badge variant={risk.priority === "high" ? "danger" : risk.priority === "medium" ? "warn" : "muted"}>
              {risk.priority}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
