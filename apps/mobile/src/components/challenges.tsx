"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, AlertCircle } from "lucide-react";

type WorkoutLog = {
  date: string;
  completed?: boolean;
  durationMin?: number | null;
  sets?: Array<{ weight?: number | null; reps?: number | null }>;
};

type CheckIn = { date: string };

type Challenge = {
  id: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  unit: string;
  reward: string;
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function Challenges() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [logsResponse, checkinsResponse] = await Promise.all([
          fetch("/api/workout-logs?limit=100", { cache: "no-store" }),
          fetch("/api/checkins", { cache: "no-store" }),
        ]);
        const [logsPayload, checkinsPayload] = await Promise.all([
          logsResponse.json().catch(() => []),
          checkinsResponse.json().catch(() => []),
        ]);
        if (!logsResponse.ok) throw new Error(logsPayload?.error || "No se pudo cargar tu actividad.");
        if (!checkinsResponse.ok) throw new Error(checkinsPayload?.error || "No se pudieron cargar tus check-ins.");
        if (!cancelled) {
          setLogs(Array.isArray(logsPayload) ? logsPayload : []);
          setCheckins(Array.isArray(checkinsPayload) ? checkinsPayload : []);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los desafíos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const challenges = useMemo<Challenge[]>(() => {
    const now = new Date();
    const weekStart = startOfWeek(now).getTime();
    const monthStart = startOfMonth(now).getTime();

    const recentLogs = logs.filter((log) => new Date(log.date).getTime() >= weekStart);
    const monthCheckins = checkins.filter((checkin) => new Date(checkin.date).getTime() >= monthStart);
    const weeklyVolume = recentLogs.reduce((total, log) => {
      return total + (log.sets || []).reduce((sum, set) => {
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        return sum + Math.max(0, weight * reps);
      }, 0);
    }, 0);

    return [
      {
        id: "week-sessions",
        title: "Constancia",
        desc: "5 entrenamientos esta semana",
        progress: recentLogs.filter((log) => log.completed !== false).length,
        target: 5,
        unit: "sesiones",
        reward: "150 XP",
      },
      {
        id: "week-volume",
        title: "Volumen semanal",
        desc: "50.000 kg esta semana",
        progress: Math.round(weeklyVolume),
        target: 50000,
        unit: "kg",
        reward: "200 XP",
      },
      {
        id: "month-checkins",
        title: "Comunicación perfecta",
        desc: "4 check-ins este mes",
        progress: monthCheckins.length,
        target: 4,
        unit: "check-ins",
        reward: "300 XP",
      },
    ];
  }, [logs, checkins]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] via-zinc-900 to-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy size={18} className="text-primary" /> Challenges
        </CardTitle>
        <p className="text-xs text-zinc-500">Progreso personal calculado desde tus entrenamientos y check-ins reales.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center text-xs text-zinc-500">Calculando tu progreso real...</p>
        ) : (
          challenges.map((challenge) => {
            const pct = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));
            return (
              <div key={challenge.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-sm flex items-center gap-1.5">
                      <Target size={12} className="text-primary" /> {challenge.title}
                      <Badge variant="muted" className="text-[10px]">{challenge.reward}</Badge>
                    </p>
                    <p className="text-xs text-zinc-500">{challenge.desc}</p>
                  </div>
                  <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded-full">{pct}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {challenge.progress.toLocaleString("es-AR")} / {challenge.target.toLocaleString("es-AR")} {challenge.unit}
                </p>
              </div>
            );
          })
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
          Los rankings globales no se muestran hasta contar con una fuente server-side real y anonimizada.
        </div>
      </CardContent>
    </Card>
  );
}
