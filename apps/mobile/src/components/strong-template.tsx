"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dumbbell,
  Clock,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Flame,
  Folder,
  Plus,
  Check,
  Timer,
  Zap,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

// Inspirado en Strong App (MIT community clones) — https://github.com/topics/strong-workout + Lyftr + Simple MIT
// Strong: workout template library, folders, duplicate/start, rest timer precision, PR (Epley 1RM + volume) — MIT
// Licencia: MIT — patrones adaptados (template→folder→exercise→set + rest timer circular + PR Epley) sin copia literal

type TemplateExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  weight: number;
  restSec: number;
  superset?: boolean;
  note?: string;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  folder: string;
  exercises: TemplateExercise[];
  lastUsed?: string;
  color: string;
};

type PrRecord = { exerciseName: string; weight: number; reps: number; oneRM: number; date: string };

function epley(w: number, r: number) {
  return w * (1 + r / 30);
}

function beep(freq = 880, dur = 0.22) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0.14, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {}
}

type ApiProgram = {
  id: string;
  name: string;
  weeks: Array<{
    weekNumber: number;
    workouts: Array<{
      id: string;
      name: string;
      estimatedMin: number;
      exercises: Array<{
        id: string;
        sets: number;
        reps: string;
        restSec: number;
        load?: string | null;
        notes?: string | null;
        supersetGroup?: string | null;
        exercise: { id: string; name: string; muscleGroup: string };
      }>;
    }>;
  }>;
};

type ApiWorkoutLog = {
  workoutId?: string | null;
  workoutName?: string | null;
  date: string;
  sets: Array<{ exerciseName: string; weight?: number | null; reps?: number | null }>;
};

function parseLoad(value: string | null | undefined): number {
  if (!value) return 0;
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}
export function StrongTemplate() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [folder, setFolder] = useState<string>("Todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [restRem, setRestRem] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [prs, setPrs] = useState<PrRecord[]>([]);
  const [lastPr, setLastPr] = useState<PrRecord | null>(null);
  const [logged, setLogged] = useState<Record<string, { w: number; r: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPrAnim, setShowPrAnim] = useState(false);
  const timerRef = useRef<number | null>(null);
  const workoutStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRealData() {
      setLoading(true);
      setError(null);
      try {
        const [programResponse, logsResponse] = await Promise.all([
          fetch("/api/programs", { cache: "no-store" }),
          fetch("/api/workout-logs?limit=100", { cache: "no-store" }),
        ]);
        const programPayload = await programResponse.json().catch(() => []);
        const logsPayload = await logsResponse.json().catch(() => []);
        if (!programResponse.ok) throw new Error(programPayload?.error || "No se pudo cargar tu programa.");
        if (!logsResponse.ok) throw new Error(logsPayload?.error || "No se pudo cargar tu historial.");

        const program = Array.isArray(programPayload) ? (programPayload[0] as ApiProgram | undefined) : undefined;
        const logs = Array.isArray(logsPayload) ? (logsPayload as ApiWorkoutLog[]) : [];
        if (cancelled) return;

        const mapped: WorkoutTemplate[] = (program?.weeks || []).flatMap((week) =>
          week.workouts.map((workout) => ({
            id: workout.id,
            name: workout.name,
            folder: `Semana ${week.weekNumber}`,
            color: "var(--primary)",
            lastUsed: logs.find((log) => log.workoutId === workout.id)?.date
              ? new Date(logs.find((log) => log.workoutId === workout.id)!.date).toLocaleDateString("es-AR")
              : "Sin registrar",
            exercises: workout.exercises.map((item) => ({
              id: item.id,
              name: item.exercise.name,
              muscleGroup: item.exercise.muscleGroup,
              sets: item.sets,
              reps: item.reps,
              weight: parseLoad(item.load),
              restSec: item.restSec,
              superset: Boolean(item.supersetGroup),
              note: item.notes || undefined,
            })),
          }))
        );

        const bestByExercise = new Map<string, PrRecord>();
        for (const log of logs) {
          for (const set of log.sets || []) {
            const w = Number(set.weight);
            const r = Number(set.reps);
            if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) continue;
            const oneRM = epley(w, r);
            const current = bestByExercise.get(set.exerciseName);
            if (!current || oneRM > current.oneRM) {
              bestByExercise.set(set.exerciseName, {
                exerciseName: set.exerciseName, weight: w, reps: r, oneRM,
                date: new Date(log.date).toISOString().slice(0, 10),
              });
            }
          }
        }

        setTemplates(mapped);
        setPrs(Array.from(bestByExercise.values()));
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudo cargar tu entrenamiento.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRealData();
    return () => { cancelled = true; };
  }, []);
  const folders = useMemo(() => ["Todos", ...Array.from(new Set(templates.map((t) => t.folder)))], [templates]);
  const filtered = useMemo(() => (folder === "Todos" ? templates : templates.filter((t) => t.folder === folder)), [templates, folder]);
  const selected = useMemo(() => templates.find((t) => t.id === selectedId) || null, [templates, selectedId]);
  const activeTpl = useMemo(() => templates.find((t) => t.id === activeId) || null, [templates, activeId]);
  const activeEx = activeTpl ? activeTpl.exercises[currentExIdx] : null;

  const totalSets = activeTpl ? activeTpl.exercises.reduce((a, e) => a + e.sets, 0) : 0;
  const doneSets = Object.keys(logged).length;
  const progress = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  // rest timer
  useEffect(() => {
    if (!isResting || paused) return;
    if (restRem <= 0) {
      setIsResting(false);
      beep(980, 0.3);
      try {
        navigator.vibrate?.([60, 30, 60]);
      } catch {}
      return;
    }
    timerRef.current = window.setTimeout(() => setRestRem((v) => v - 1), 1000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isResting, paused, restRem]);

  useEffect(() => {
    if (activeEx) {
      setWeight(String(activeEx.weight || ""));
      setReps(activeEx.reps.split("-")[0] || "8");
    }
  }, [activeEx, currentExIdx]);

  function duplicateTpl(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    const copy: WorkoutTemplate = { ...tpl, id: `${tpl.id}-copy-${Date.now()}`, name: `${tpl.name} (copia)`, lastUsed: "Ahora" };
    setTemplates((prev) => [copy, ...prev]);
    setSelectedId(copy.id);
  }

  function startWorkout(id: string) {
    setActiveId(id);
    setCurrentExIdx(0);
    setCurrentSet(1);
    setLogged({});
    setLastPr(null);
    setSaveState("idle");
    setSaveError(null);
    setRestRem(0);
    setIsResting(false);
    workoutStartedAtRef.current = Date.now();
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setWeight(String(tpl.exercises[0]?.weight || ""));
      setReps(tpl.exercises[0]?.reps.split("-")[0] || "8");
    }
    beep(660, 0.15);
  }

  async function persistWorkout(tpl: WorkoutTemplate, entries: Record<string, { w: number; r: number }>) {
    setSaveState("saving");
    setSaveError(null);
    try {
      const loggedSets = tpl.exercises.flatMap((exercise) =>
        Array.from({ length: exercise.sets }, (_, index) => {
          const entry = entries[exercise.id + "-" + (index + 1)];
          if (!entry) return null;
          return {
            exerciseName: exercise.name,
            setNumber: index + 1,
            weight: entry.w,
            reps: entry.r,
            completed: true,
          };
        }).filter((value): value is {
          exerciseName: string;
          setNumber: number;
          weight: number;
          reps: number;
          completed: true;
        } => value !== null)
      );

      if (loggedSets.length === 0) throw new Error("No hay series registradas para guardar.");

      const startedAt = workoutStartedAtRef.current;
      const durationMin = startedAt
        ? Math.max(1, Math.round((Date.now() - startedAt) / 60000))
        : undefined;

      const response = await fetch("/api/workout-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId: tpl.id,
          workoutName: tpl.name,
          durationMin,
          completed: true,
          sets: loggedSets,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "No se pudo guardar la sesión.");

      setSaveState("saved");
      setTemplates((prev) => prev.map((item) => item.id === tpl.id
        ? { ...item, lastUsed: new Date().toLocaleDateString("es-AR") }
        : item
      ));
    } catch (cause) {
      setSaveState("error");
      setSaveError(cause instanceof Error ? cause.message : "No se pudo guardar la sesión.");
    }
  }

  function logSet() {
    if (!activeTpl || !activeEx) return;
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    const key = `${activeEx.id}-${currentSet}`;
    setLogged((prev) => ({ ...prev, [key]: { w, r } }));

    // PR check Epley
    const newOneRM = epley(w, r);
    const prevPr = prs.find((p) => p.exerciseName === activeEx.name);
    const isPr = !prevPr || newOneRM > prevPr.oneRM * 1.005; // 0.5% tolerance
    if (isPr && w > 0 && r > 0) {
      const rec: PrRecord = { exerciseName: activeEx.name, weight: w, reps: r, oneRM: newOneRM, date: new Date().toISOString().slice(0, 10) };
      setPrs((prev) => {
        const others = prev.filter((p) => p.exerciseName !== activeEx.name);
        return [...others, rec];
      });
      setLastPr(rec);
      setShowPrAnim(true);
      setTimeout(() => setShowPrAnim(false), 2200);
      beep(1200, 0.35);
      try {
        navigator.vibrate?.([30, 40, 80]);
      } catch {}
    } else {
      beep(440, 0.12);
    }

    // advance
    if (currentSet < activeEx.sets) {
      setCurrentSet((s) => s + 1);
      setRestRem(activeEx.restSec || 90);
      setIsResting(true);
      setPaused(false);
    } else if (currentExIdx < activeTpl.exercises.length - 1) {
      setCurrentExIdx((i) => i + 1);
      setCurrentSet(1);
      setRestRem(activeEx.restSec || 90);
      setIsResting(true);
      setPaused(false);
    } else {
      const completedEntries = { ...logged, [key]: { w, r } };
      setRestRem(0);
      setIsResting(false);
      beep(800, 0.4);
      void persistWorkout(activeTpl, completedEntries);
    }
  }

  function skipRest() {
    setIsResting(false);
    setRestRem(0);
  }

  const bestPr = useMemo(() => [...prs].sort((a, b) => b.oneRM - a.oneRM)[0], [prs]);

  if (loading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
        <CardContent className="py-10 text-center text-xs text-zinc-500">Cargando tu programa y tu historial real...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/20 bg-zinc-900 overflow-hidden">
        <CardContent className="py-8 text-center space-y-3">
          <p role="alert" className="text-sm text-red-300">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
        <CardContent className="py-10 text-center space-y-2">
          <Dumbbell size={24} className="mx-auto text-zinc-500" />
          <p className="font-bold text-sm">Todavía no hay sesiones en tu programa.</p>
          <p className="text-xs text-zinc-500">Tu coach debe asignarte un programa antes de empezar desde acá.</p>
        </CardContent>
      </Card>
    );
  }

  if (activeTpl && activeEx) {
    const isFinished = doneSets >= totalSets && totalSets > 0;
    return (
      <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest text-primary uppercase flex items-center gap-1.5">
              <Zap size={12} /> Strong Template • En curso
            </p>
            <p className="font-black text-white leading-tight">{activeTpl.name}</p>
            <p className="text-xs text-zinc-500">
              {currentExIdx + 1}/{activeTpl.exercises.length} • Serie {currentSet}/{activeEx.sets} • {activeEx.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-zinc-500 font-bold uppercase">Progreso</p>
            <p className="font-black text-primary">{progress}%</p>
            <p className="text-[11px] text-zinc-500">{doneSets}/{totalSets} series</p>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
        {/* Rest Timer */}
        {isResting && (
          <div className="bg-primary text-black px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-black text-primary flex items-center justify-center font-black text-base">
                {String(Math.floor(restRem / 60)).padStart(2, "0")}:{String(restRem % 60).padStart(2, "0")}
              </div>
              <div>
                <p className="font-black text-sm leading-none">Descanso</p>
                <p className="text-xs font-bold opacity-70">{activeEx.name} • +15s si necesitás</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-black text-white border-black h-9" onClick={() => setPaused((p) => !p)}>
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </Button>
              <Button size="sm" variant="ghost" className="h-9 text-black font-bold" onClick={() => setRestRem((v) => v + 15)}>
                +15s
              </Button>
              <Button size="sm" variant="ghost" className="h-9 text-black font-bold" onClick={skipRest}>
                Saltar
              </Button>
            </div>
          </div>
        )}

        {/* PR Banner */}
        {showPrAnim && lastPr && (
          <div className="bg-gradient-to-r from-amber-400 to-primary text-black px-4 py-3 flex items-center gap-3 animate-pulse">
            <Trophy size={20} />
            <div>
              <p className="font-black text-sm leading-none">¡Nuevo PR! {lastPr.exerciseName}</p>
              <p className="text-xs font-bold opacity-80">
                {lastPr.weight}kg × {lastPr.reps} • 1RM {Math.round(lastPr.oneRM)}kg (Epley)
              </p>
            </div>
            <Badge className="ml-auto bg-black text-primary">PR</Badge>
          </div>
        )}

        {isFinished ? (
          <CardContent className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Trophy size={28} />
            </div>
            <div>
              <p className="font-black text-lg">
                {saveState === "saved" ? "¡Sesión guardada!" : saveState === "saving" ? "Guardando sesión..." : saveState === "error" ? "Sesión completada, falta guardarla" : "¡Sesión completada!"}
              </p>
              <p className="text-xs text-zinc-500">{activeTpl.name} • {doneSets} series • Volumen {(Object.values(logged).reduce((a, v) => a + v.w * v.r, 0) / 1000).toFixed(1)}t</p>
              {saveState === "error" && saveError && <p role="alert" className="text-xs text-red-300 font-bold mt-1">{saveError}</p>}
              {lastPr && <p className="text-xs text-amber-400 font-bold mt-1">PR del día: {lastPr.exerciseName} {lastPr.weight}×{lastPr.reps} → 1RM {Math.round(lastPr.oneRM)}kg</p>}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {saveState === "error" && (
                <Button variant="outline" onClick={() => void persistWorkout(activeTpl, logged)} className="border-red-500/30">
                  Guardar de nuevo
                </Button>
              )}
              <Button variant="outline" onClick={() => setActiveId(null)} className="border-zinc-700">
                Volver a plantillas
              </Button>
              <Button onClick={() => startWorkout(activeTpl.id)} className="bg-primary text-black hover:bg-primary-hover font-black">
                Repetir
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center font-black">{currentExIdx + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-none">{activeEx.name}</p>
                <p className="text-xs text-zinc-500">
                  {activeEx.sets}×{activeEx.reps} • descanso {activeEx.restSec}s {activeEx.superset && <span className="text-primary">• Superset</span>}
                </p>
                {activeEx.note && <p className="text-[11px] text-amber-300">{activeEx.note}</p>}
              </div>
              <Badge variant="muted" className="border-zinc-700 text-zinc-300">{activeEx.muscleGroup}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Peso (kg)</label>
                <Input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="80" className="bg-zinc-950 border-zinc-800 h-12 text-center font-black text-lg" />
                <p className="text-[11px] text-zinc-600 text-center mt-1">1RM {Math.round(epley(parseFloat(weight) || 0, parseInt(reps) || 0))}kg</p>
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Reps</label>
                <Input value={reps} onChange={(e) => setReps(e.target.value)} inputMode="numeric" placeholder="8" className="bg-zinc-950 border-zinc-800 h-12 text-center font-black text-lg" />
                <p className="text-[11px] text-zinc-600 text-center mt-1">{activeEx.reps} objetivo</p>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Serie</label>
                <div className="h-12 rounded-md border border-zinc-800 bg-zinc-950 flex items-center justify-center font-black text-lg">
                  {currentSet}/{activeEx.sets}
                </div>
                <p className="text-[11px] text-zinc-600 text-center mt-1 flex items-center justify-center gap-1">
                  <TrendingUp size={10} /> Epley
                </p>
              </div>
            </div>

            {lastPr && !showPrAnim && (
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <p className="text-xs font-bold">Último PR: {lastPr.exerciseName} {lastPr.weight}×{lastPr.reps} = {Math.round(lastPr.oneRM)}kg</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="border-zinc-800 h-12" onClick={() => { setPaused(false); setIsResting(false); setRestRem(0); }}>
                <RotateCcw size={16} className="mr-2" /> Saltar descanso
              </Button>
              <Button onClick={logSet} className="bg-primary text-black hover:bg-primary-hover font-black h-12">
                <Check size={18} className="mr-2" /> Registrar serie
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setActiveId(null)} className="text-zinc-400">
                ← Plantillas
              </Button>
              <div className="flex gap-1">
                {activeTpl.exercises.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i < currentExIdx ? "w-6 bg-emerald-500" : i === currentExIdx ? "w-8 bg-primary" : "w-4 bg-zinc-800"}`} />
                ))}
              </div>
              <span className="text-xs text-zinc-600 font-bold">{doneSets}/{totalSets}</span>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell size={18} className="text-primary" /> Plantillas Strong
              <Badge variant="muted" className="text-[10px] border-zinc-700">Programa + Timer + PR</Badge>
            </CardTitle>
          </div>
          {bestPr && (
            <div className="hidden sm:flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
              <Trophy size={14} className="text-amber-400" />
              <div>
                <p className="text-[10px] font-black uppercase text-amber-400 leading-none">Mejor PR</p>
                <p className="text-xs font-bold leading-none">{bestPr.exerciseName} {Math.round(bestPr.oneRM)}kg</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {folders.map((f) => (
            <Button key={f} size="sm" variant={folder === f ? "default" : "outline"} className={folder === f ? "bg-primary text-black font-black h-7 text-xs" : "border-zinc-800 h-7 text-xs"} onClick={() => setFolder(f)}>
              <Folder size={12} className="mr-1" /> {f}
            </Button>
          ))}
          <Badge variant="muted" className="border-zinc-700 text-zinc-500 ml-auto">
            {filtered.length} plantillas • {templates.reduce((a, t) => a + t.exercises.length, 0)} ejercicios
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {selected ? (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="text-zinc-400 -ml-2 h-7">
              ← Volver
            </Button>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: selected.color }} /> {selected.name}
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                    <Folder size={12} /> {selected.folder} • {selected.exercises.length} ejercicios • {selected.exercises.reduce((a, e) => a + e.sets, 0)} series • {selected.lastUsed}
                  </p>
                </div>
                <Badge variant="muted" className="border-zinc-700 shrink-0">{selected.exercises.reduce((a, e) => a + e.restSec, 0) / 60} min est.</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {selected.exercises.map((ex, idx) => (
                  <div key={ex.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-none">{ex.name} {ex.superset && <span className="text-primary text-[10px]">SUPERSET</span>}</p>
                      <p className="text-xs text-zinc-500">{ex.sets}×{ex.reps} @ {ex.weight || "BW"}kg • ⏱ {ex.restSec}s</p>
                    </div>
                    <Badge variant="muted" className="border-zinc-700 text-zinc-400 text-[10px]">{ex.muscleGroup}</Badge>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="outline" className="border-zinc-700" onClick={() => duplicateTpl(selected.id)}>
                  <Copy size={14} className="mr-2" /> Duplicar
                </Button>
                <Button onClick={() => startWorkout(selected.id)} className="bg-primary text-black hover:bg-primary-hover font-black">
                  <Play size={16} className="mr-2" /> Empezar
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-600">
                <Timer size={12} /> Rest timer auto • <Trophy size={12} className="text-amber-400" /> PR Epley • <Flame size={12} className="text-orange-500" /> Volumen
              </div>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((tpl) => (
              <div key={tpl.id} className="group bg-zinc-950 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition cursor-pointer" onClick={() => setSelectedId(tpl.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tpl.color }} />
                    <p className="font-bold text-sm leading-tight group-hover:text-primary transition">{tpl.name}</p>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-primary shrink-0 mt-1" />
                </div>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                  <Folder size={12} /> {tpl.folder} • {tpl.lastUsed}
                </p>
                <div className="mt-3 space-y-1.5">
                  {tpl.exercises.slice(0, 3).map((ex) => (
                    <div key={ex.id} className="flex items-center gap-2 text-xs">
                      <span className="w-1 h-1 rounded-full bg-zinc-600" />
                      <span className="text-zinc-300 truncate">{ex.name}</span>
                      <span className="text-zinc-600 ml-auto shrink-0">{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                  {tpl.exercises.length > 3 && <p className="text-[11px] text-zinc-600">+{tpl.exercises.length - 3} ejercicios más</p>}
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <Badge variant="muted" className="border-zinc-800 text-zinc-400 text-[10px]">{tpl.exercises.length} ej</Badge>
                  <Badge variant="muted" className="border-zinc-800 text-zinc-400 text-[10px]"><Clock size={10} className="mr-1" />{tpl.exercises.reduce((a, e) => a + e.restSec, 0) / 60}m</Badge>
                  <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs font-bold text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); duplicateTpl(tpl.id); }}>
                    <Copy size={12} className="mr-1" /> Duplicar
                  </Button>
                </div>
                <Button size="sm" className="w-full mt-2 bg-white text-black hover:bg-zinc-100 font-bold h-8" onClick={(e) => { e.stopPropagation(); startWorkout(tpl.id); }}>
                  <Play size={14} className="mr-1" /> Entrenar
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Zap size={14} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-zinc-500 leading-snug">Toca una plantilla → ve detalle → Empezar registra series con peso/reps, inicia descanso circular auto (90-180s), detecta PR con Epley 1RM y celebra. Duplica para progresión semanal +2.5%.</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <Badge variant="muted" className="border-zinc-800 text-zinc-500 text-[10px]"><Timer size={10} className="mr-1" /> Rest 30-180s</Badge>
              <Badge variant="muted" className="border-zinc-800 text-zinc-500 text-[10px]"><Trophy size={10} className="mr-1 text-amber-400" /> PR Epley</Badge>
              <Badge variant="muted" className="border-zinc-800 text-zinc-500 text-[10px]"><Flame size={10} className="mr-1 text-orange-500" /> Volumen total</Badge>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-zinc-600 text-center">
          Strong App MIT (community clones) + Lyftr + Simple MIT — atribución en docs/MIT_ATTRIBUTION.md #74-75 — 75 MIT CERRADO
        </p>
      </CardContent>
    </Card>
  );
}
