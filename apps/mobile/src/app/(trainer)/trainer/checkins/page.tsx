"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckinAI } from "@/components/checkin-ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  User, 
  AlertCircle,
  Sparkles
} from "lucide-react";

type CheckInItem = {
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
  client: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
};

export default function TrainerCheckinsPage(){
  const [checkins, setCheckins] = useState<CheckInItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "REVIEWED">("ALL");

  // Reply drawer/modal state
  const [replyingTo, setReplyingTo] = useState<CheckInItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCheckins(){
    setLoading(true);
    try {
      const res = await fetch("/api/checkins");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCheckins(data);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    loadCheckins();
  }, []);

  async function handleMarkReviewed(id: string, reviewed: boolean){
    try {
      const res = await fetch("/api/checkins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reviewed })
      });
      if (res.ok) {
        setCheckins(prev => prev.map(c => c.id === id ? { ...c, reviewed } : c));
      }
    } catch {}
  }

  async function handleSubmitReply(e: React.FormEvent){
    e.preventDefault();
    if (!replyingTo || !replyText.trim()) return;
    setSavingReply(true);
    setError(null);

    try {
      const res = await fetch("/api/checkins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: replyingTo.id,
          trainerReply: replyText.trim(),
          reviewed: true
        })
      });

      if (res.ok) {
        setCheckins(prev => prev.map(c => c.id === replyingTo.id ? { ...c, trainerReply: replyText.trim(), reviewed: true } : c));
        setReplyingTo(null);
        setReplyText("");
      } else {
        const payload = await res.json().catch(() => null);
        setError(payload?.error || "No se pudo enviar la respuesta.");
      }
    } catch {
      setError("No se pudo conectar con KinetixFitt.");
    } finally {
      setSavingReply(false);
    }
  }

  const pendingCount = checkins.filter(c => !c.reviewed).length;
  const filtered = checkins.filter(c => {
    if (filter === "PENDING") return !c.reviewed;
    if (filter === "REVIEWED") return c.reviewed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Revisión de Check-ins</h1>
          <p className="text-sm text-zinc-400">
            {pendingCount > 0 ? (
              <span className="text-amber-400 font-medium">{pendingCount} pendientes de responder</span>
            ) : (
              <span className="text-emerald-400 font-medium">Todos los check-ins al día</span>
            )}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {[
            { id: "ALL", label: `Todos (${checkins.length})` },
            { id: "PENDING", label: `Pendientes (${pendingCount})` },
            { id: "REVIEWED", label: `Revisados (${checkins.length - pendingCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition font-medium ${
                filter === f.id
                  ? "bg-white text-black border-white font-bold"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card role="alert" className="border-red-500/30 bg-red-500/10">
          <CardContent className="py-3 text-sm text-red-300">{error}</CardContent>
        </Card>
      )}

      {/* Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg border-zinc-800 bg-zinc-950 shadow-2xl">
            <CardHeader className="border-b border-zinc-800 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                Responder a {replyingTo.client?.name || "Cliente"}
              </CardTitle>
              <p className="text-xs text-zinc-400">
                Check-in del {new Date(replyingTo.date).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {replyingTo.comentario && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 italic">
                  &quot;{replyingTo.comentario}&quot;
                </div>
              )}

              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Tu devolución como entrenador:</label>
                  <Textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Excelente trabajo esta semana. En base a tu molestia, vamos a ajustar la carga de sentadillas..."
                    className="min-h-[120px] bg-zinc-900 border-zinc-800 text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setReplyingTo(null); setReplyText(""); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    size="sm"
                    disabled={savingReply || !replyText.trim()}
                    className="font-bold"
                  >
                    {savingReply ? "Enviando..." : "Enviar Respuesta"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checkins List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500">Cargando check-ins...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-zinc-800 bg-zinc-900/40">
          <CardContent className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <ClipboardCheck size={22} />
            </div>
            <p className="font-bold text-base text-white">No hay datos todavía</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {filter === "PENDING"
                ? "No tenés check-ins pendientes de responder."
                : "Aún no se han registrado check-ins en la plataforma."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(ch => (
            <Card
              key={ch.id}
              className={`border-zinc-800 bg-zinc-900/90 shadow-[0_10px_32px_rgba(0,0,0,0.3)] transition ${
                !ch.reviewed ? "border-primary/30 shadow-[0_0_15px_rgba(214,255,42,0.03)]" : ""
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm">
                    {ch.client?.name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <CardTitle className="text-base text-white">{ch.client?.name || "Cliente"}</CardTitle>
                    <p className="text-xs text-zinc-500">
                      {new Date(ch.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <Badge variant={ch.reviewed ? "success" : "warn"}>
                  {ch.reviewed ? "Revisado" : "Pendiente de respuesta"}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Metric Badges */}
                {/* Análisis IA con los datos REALES de este check-in (antes mostraba siempre
                    los mismos números de ejemplo sin importar quién respondiera). */}
                <CheckinAI checkin={{
                  energia: ch.energia ?? 5,
                  sueno: ch.sueno ?? 5,
                  estres: ch.estres ?? 5,
                  entrenos: ch.entrenos ?? 0,
                  rendimiento: ch.rendimiento ?? 5,
                  molestias: ch.molestias || "",
                  alimentacion: 5,
                  progreso: ch.progreso ?? 5,
                }} />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Energía</span>
                    <span className="font-black text-white text-base">{ch.energia ?? "—"}/10</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Sueño</span>
                    <span className="font-black text-white text-base">{ch.sueno ?? "—"}/10</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Estrés</span>
                    <span className="font-black text-white text-base">{ch.estres ?? "—"}/10</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Entrenos</span>
                    <span className="font-black text-primary text-base">{ch.entrenos ?? "—"}</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Rendimiento</span>
                    <span className="font-black text-white text-base">{ch.rendimiento ?? "—"}/10</span>
                  </div>
                </div>

                {/* Additional Client notes: molestias, alimentacion */}
                {(ch.molestias || ch.alimentacion) && (
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    {ch.molestias && (
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold block">Molestias / Dolores</span>
                        <p className="text-zinc-200 mt-0.5">{ch.molestias}</p>
                      </div>
                    )}
                    {ch.alimentacion && (
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold block">Alimentación</span>
                        <p className="text-zinc-200 mt-0.5">{ch.alimentacion}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Comment */}
                {ch.comentario && (
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-xs">
                    <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Comentario del Cliente</span>
                    <p className="text-zinc-200">{ch.comentario}</p>
                  </div>
                )}

                {/* Trainer reply if existing */}
                {ch.trainerReply && (
                  <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-primary block">Tu respuesta enviada:</span>
                    <p className="text-zinc-200">{ch.trainerReply}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1 flex-wrap">
                  <Button
                    variant="accent"
                    size="sm"
                    className="flex-1 font-bold h-10"
                    onClick={() => {
                      setReplyingTo(ch);
                      setReplyText(ch.trainerReply || "");
                    }}
                  >
                    <MessageSquare size={15} className="mr-1.5" />
                    {ch.trainerReply ? "Modificar Respuesta" : "Responder al Check-in"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => handleMarkReviewed(ch.id, !ch.reviewed)}
                  >
                    {ch.reviewed ? "Marcar Pendiente" : "Marcar Revisado"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
