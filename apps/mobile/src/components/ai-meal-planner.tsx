"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AlertCircle, Sparkles, Utensils } from "lucide-react";

type AiResponse = {
  configured?: boolean;
  provider?: string;
  model?: string;
  answer?: string;
  error?: string;
};

const GOALS = {
  perdida_grasa: "pérdida de grasa",
  hipertrofia: "hipertrofia",
  mantenimiento: "mantenimiento",
} as const;

export function AiMealPlanner() {
  const [goal, setGoal] = useState<keyof typeof GOALS>("hipertrofia");
  const [kcal, setKcal] = useState("2800");
  const [plan, setPlan] = useState<string | null>(null);
  const [source, setSource] = useState<Pick<AiResponse, "provider" | "model">>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    const targetKcal = Number(kcal);
    if (!Number.isFinite(targetKcal) || targetKcal < 500 || targetKcal > 10000) {
      setError("Ingresá un objetivo de kcal válido entre 500 y 10.000.");
      return;
    }

    setGenerating(true);
    setError(null);
    setPlan(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generá una propuesta de alimentación de un día para un atleta con objetivo de ${GOALS[goal]} y un objetivo aproximado de ${targetKcal} kcal. No inventes datos clínicos. Organizá la respuesta en Desayuno, Almuerzo, Cena y Snack. Indicá cantidades aproximadas solo cuando sean razonables y aclará que es una propuesta general, no una indicación médica.`,
        },
      });
      const payload = (await response.json().catch(() => null)) as AiResponse | null;

      if (!response.ok) {
        throw new Error(payload?.error || "La IA no pudo generar el plan.");
      }
      if (payload?.configured === false) {
        setError(payload.answer || "La IA no está configurada en este entorno.");
        return;
      }
      if (!payload?.answer) {
        throw new Error("La IA devolvió una respuesta vacía.");
      }

      setPlan(payload.answer);
      setSource({ provider: payload.provider, model: payload.model });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo generar el plan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.05] via-zinc-900 to-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils size={18} className="text-primary" /> AI Meal Planner
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Generación real mediante KinetixFitt AI. Requiere un proveedor de IA configurado.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label>Objetivo</Label>
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value as keyof typeof GOALS)}
              className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-sm text-white"
            >
              <option value="hipertrofia">Hipertrofia</option>
              <option value="perdida_grasa">Pérdida grasa</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>
          <div>
            <Label>Kcal/día</Label>
            <Input
              value={kcal}
              onChange={(event) => setKcal(event.target.value)}
              inputMode="numeric"
              placeholder="2800"
            />
          </div>
        </div>

        <Button variant="accent" className="w-full h-11 font-black" onClick={() => void generate()} disabled={generating}>
          {generating ? "Generando..." : <><Sparkles size={16} className="mr-2" /> Generar con IA</>}
        </Button>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {plan && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 items-center">
              <p className="font-bold text-sm">Propuesta para {GOALS[goal]} · {kcal} kcal/día</p>
              {source.provider && <span className="text-[10px] uppercase tracking-wider text-zinc-500">{source.provider}{source.model ? ` · ${source.model}` : ""}</span>}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{plan}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
