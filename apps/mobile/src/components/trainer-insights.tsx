"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

type RiskItem = {
  id: string;
  name: string;
  inactiveDays: number;
  reasons: string[];
  priority: "high" | "medium" | "low";
};

export function TrainerInsights() {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/automation/risk", { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(body?.error || "No se pudieron calcular los insights.");
        }
        return response.json() as Promise<{ risks?: RiskItem[] }>;
      })
      .then((payload) => setRisks(Array.isArray(payload.risks) ? payload.risks : []))
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "No se pudieron calcular los insights.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-zinc-900 to-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-400" /> Insights de cartera
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Señales calculadas a partir de actividad y check-ins reales.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
            Analizando actividad…
          </div>
        )}
        {!loading && error && (
          <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}
        {!loading && !error && risks.length === 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            No hay señales pendientes en la cartera actual.
          </div>
        )}
        {!loading && !error && risks.slice(0, 8).map((risk) => (
          <div
            key={risk.id}
            className={
              `flex items-start gap-2 rounded-xl border p-3 ${risk.priority === "high"
                ? "border-red-500/20 bg-red-500/10"
                : risk.priority === "medium"
                  ? "border-amber-500/20 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-950"}`
            }
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{risk.name}</p>
                <Badge variant={risk.priority === "high" ? "danger" : risk.priority === "medium" ? "warn" : "muted"}>
                  {risk.priority}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{risk.reasons.join(" · ")}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
