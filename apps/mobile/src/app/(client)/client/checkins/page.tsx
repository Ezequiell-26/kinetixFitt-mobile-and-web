"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FileUpload } from "@/components/file-upload";
import { CheckinVoice } from "@/components/narrator-cues";
import { ClipboardCheck, Sparkles, Clock, CheckCircle2, MessageSquare } from "lucide-react";

type CheckInHistoryItem = {
  id: string;
  date: string;
  energia: number | null;
  sueno: number | null;
  estres: number | null;
  entrenos: number | null;
  rendimiento: number | null;
  progreso: number | null;
  molestias: string | null;
  alimentacion: string | null;
  comentario: string | null;
  trainerReply: string | null;
  reviewed: boolean;
};

export default function ClientCheckinsPage(){
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    energia: 8,
    sueno: 7,
    estres: 4,
    entrenos: 4,
    rendimiento: 8,
    molestias: "",
    alimentacion: "Buena",
    progreso: 8,
    comentario: ""
  });
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<CheckInHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory(){
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/checkins");
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d)) setHistory(d);
      }
    } catch {}
    setLoadingHistory(false);
  }

  useEffect(() => {
    loadHistory();
  }, [sent]);

  async function submit(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSent(true);
        setShowForm(false);
        setForm({
          energia: 8,
          sueno: 7,
          estres: 4,
          entrenos: 4,
          rendimiento: 8,
          molestias: "",
          alimentacion: "Buena",
          progreso: 8,
          comentario: ""
        });
        loadHistory();
        setTimeout(() => setSent(false), 5000);
      } else {
        const payload = await res.json().catch(() => null);
        setError(payload?.error || "No se pudo enviar el check-in.");
      }
    } catch {
      setError("No se pudo conectar con KinetixFitt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <CheckinVoice
        pending={
          !loadingHistory &&
          (history.length === 0 ||
            Date.now() - Math.max(...history.map((c) => new Date(c.date).getTime())) >
              7 * 24 * 3600 * 1000)
        }
      />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold">Check-in Semanal</h1>
          <p className="text-sm text-zinc-400">Revisión y feedback personalizado con tu coach</p>
        </div>
        <Badge variant={sent ? "success" : "accent"}>
          {sent ? "Enviado" : "Semanal"}
        </Badge>
      </div>

      {error && (
        <Card role="alert" className="border-red-500/30 bg-red-500/10">
          <CardContent className="py-4 text-center text-red-300 font-semibold text-sm">{error}</CardContent>
        </Card>
      )}

      {sent && (
        <Card className="border-emerald-500/30 bg-emerald-500/10 animate-in fade-in">
          <CardContent className="py-4 text-center text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 size={18} /> ¡Check-in enviado con éxito! Tu coach lo revisará y te responderá pronto.
          </CardContent>
        </Card>
      )}

      {!showForm ? (
        <>
          {/* Prompt card */}
          <Card className="border-primary/20 bg-primary/[0.04]">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto text-black font-black">
                <ClipboardCheck size={24} />
              </div>
              <h2 className="font-bold text-lg text-white">¿Cómo estuvo tu semana de entrenamiento?</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Completá tu reporte de energía, sueño, molestias y sensaciones para que tu coach ajuste tus cargas y volumen.
              </p>
              <Button
                variant="accent"
                className="w-full h-12 font-black text-sm tracking-wide"
                onClick={() => setShowForm(true)}
              >
                COMPLETAR CHECK-IN DE ESTA SEMANA →
              </Button>
            </CardContent>
          </Card>

          {/* History card */}
          <Card className="border-zinc-800 bg-zinc-900/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial de Check-ins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingHistory ? (
                <p className="text-xs text-zinc-500 text-center py-6">Cargando historial...</p>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="Todavía no hay check-ins"
                  description="Tus check-ins completados y las respuestas de tu coach aparecerán en este historial."
                  action={
                    <Button variant="accent" size="sm" onClick={() => setShowForm(true)}>
                      Hacer mi primer check-in →
                    </Button>
                  }
                />
              ) : (
                history.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">
                        {new Date(c.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <Badge variant={c.reviewed ? "success" : "warn"} className="text-[10px]">
                        {c.reviewed ? "Revisado" : "En revisión"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-zinc-900/80 p-2 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Energía</span>
                        <span className="font-bold text-white">{c.energia ?? "—"}/10</span>
                      </div>
                      <div className="bg-zinc-900/80 p-2 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Sueño</span>
                        <span className="font-bold text-white">{c.sueno ?? "—"}/10</span>
                      </div>
                      <div className="bg-zinc-900/80 p-2 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Entrenos</span>
                        <span className="font-bold text-primary">{c.entrenos ?? "—"}</span>
                      </div>
                      <div className="bg-zinc-900/80 p-2 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Rendimiento</span>
                        <span className="font-bold text-white">{c.rendimiento ?? "—"}/10</span>
                      </div>
                    </div>

                    {c.comentario && (
                      <p className="text-zinc-300 italic pt-1">&quot;{c.comentario}&quot;</p>
                    )}

                    {c.trainerReply && (
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs space-y-1">
                        <span className="font-bold text-primary flex items-center gap-1">
                          <MessageSquare size={13} /> Devolución de tu coach:
                        </span>
                        <p className="text-zinc-200">{c.trainerReply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Form Card */
        <Card className="border-zinc-800 bg-zinc-900/90 animate-in fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Formulario de Check-in</CardTitle>
            <p className="text-xs text-zinc-400">Respondé con sinceridad para optimizar tu progreso</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {[
                { k: "energia", label: "¿Cómo estuvo tu nivel de energía?", val: form.energia },
                { k: "sueno", label: "¿Cómo estuvo la calidad de tu sueño?", val: form.sueno },
                { k: "estres", label: "¿Nivel de estrés laboral / personal?", val: form.estres },
                { k: "rendimiento", label: "¿Cómo sentiste tu fuerza y rendimiento?", val: form.rendimiento },
                { k: "progreso", label: "¿Cómo sentís que estás avanzando hacia tu meta?", val: form.progreso },
              ].map(f => (
                <div key={f.k} className="space-y-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex justify-between text-xs">
                    <Label className="text-xs text-zinc-300">{f.label}</Label>
                    <span className="text-primary font-black text-sm">{f.val}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={f.val}
                    onChange={e => setForm({ ...form, [f.k]: Number(e.target.value) })}
                    className="w-full accent-primary h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">¿Cuántos entrenamientos completaste?</Label>
                  <Input
                    type="number"
                    min={0}
                    max={7}
                    value={form.entrenos}
                    onChange={e => setForm({ ...form, entrenos: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">¿Cómo fue tu alimentación?</Label>
                  <Input
                    value={form.alimentacion}
                    onChange={e => setForm({ ...form, alimentacion: e.target.value })}
                    placeholder="Ej: Cumplí 100% macros, comí fuera el sábado..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">¿Tuviste molestias o dolores musculares/articulares?</Label>
                <Input
                  value={form.molestias}
                  onChange={e => setForm({ ...form, molestias: e.target.value })}
                  placeholder="Ej: Molestia leve en hombro derecho al empujar..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Comentarios y sensaciones de la semana</Label>
                <Textarea
                  value={form.comentario}
                  onChange={e => setForm({ ...form, comentario: e.target.value })}
                  placeholder="Contale a tu coach con tus palabras cómo te sentiste, dificultades encontradas o logros..."
                  className="min-h-[90px]"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  className="flex-1 h-12 font-black text-sm"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "ENVIAR CHECK-IN"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
