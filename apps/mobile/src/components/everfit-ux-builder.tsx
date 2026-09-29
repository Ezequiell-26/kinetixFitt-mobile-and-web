"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Users,
  Zap,
  TrendingUp,
  Link2,
  Search,
  Layers,
  Timer,
  Check,
  ArrowUp,
  ArrowDown,
  Dumbbell,
  Settings2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Inspirado en Everfit (#2 UX/programación) — https://everfit.io
// Everfit: workout builder UX premium — drag&drop + auto-progression + program assignment + exercise library
// Mejorado con MIT: dnd pattern (shadcn/Radix), OptiLifts (auto-progression), Lyftr (program builder), Simple (schedule), TrueCoach (1:1 simple library)
// Licencia MIT — patrones adaptados (drag&drop nativo HTML5 + progression engine + assignment) sin copia literal

type BuilderExercise = {
  id: string;
  exerciseId: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  weight: string;
  rir: number;
  restSec: number;
  tempo: string;
  superset: boolean;
  note: string;
};

type BuilderDay = {
  id: string;
  name: string;
  exercises: BuilderExercise[];
};

type BuilderWeek = {
  id: string;
  name: string;
  days: BuilderDay[];
};

type LibraryItem = { id: string; name: string; muscle: string; equipment: string };

type Client = { id: string; name: string; email?: string | null; assignedProgramId?: string | null };

function makeEx(lib: LibraryItem): BuilderExercise {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    exerciseId: lib.id,
    name: lib.name,
    muscle: lib.muscle,
    sets: 3,
    reps: "8-12",
    weight: "",
    rir: 2,
    restSec: 90,
    tempo: "3-1-1-0",
    superset: false,
    note: "",
  };
}

export function EverfitUxBuilder() {
  const [weeks, setWeeks] = useState<BuilderWeek[]>([
    {
      id: "w1",
      name: "Semana 1",
      days: [
        { id: "d1", name: "Día 1 — Tren Superior", exercises: [] },
        { id: "d2", name: "Día 2 — Tren Inferior", exercises: [] },
      ],
    },
  ]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [programName, setProgramName] = useState("Programa nuevo");
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Todos");
  const [autoProgression, setAutoProgression] = useState(true);
  const [progressionRule, setProgressionRule] = useState<"linear" | "double" | "rir">("double");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dragEx, setDragEx] = useState<BuilderExercise | null>(null);
  const [dragLibrary, setDragLibrary] = useState<LibraryItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBuilderData() {
      setLibraryLoading(true);
      setDataError(null);
      try {
        const [exerciseRes, clientRes] = await Promise.all([
          fetch("/api/exercises?limit=100", { cache: "no-store" }),
          fetch("/api/clients?limit=200", { cache: "no-store" }),
        ]);
        const exerciseData = await exerciseRes.json().catch(() => null);
        const clientData = await clientRes.json().catch(() => null);

        if (!exerciseRes.ok) throw new Error(exerciseData?.error || "No se pudo cargar la biblioteca de ejercicios.");
        if (!clientRes.ok) throw new Error(clientData?.error || "No se pudo cargar tu cartera de clientes.");

        const exerciseItems = Array.isArray(exerciseData) ? exerciseData : [];
        const clientItems = Array.isArray(clientData?.items)
          ? clientData.items
          : Array.isArray(clientData)
            ? clientData
            : [];

        const mappedLibrary = exerciseItems
          .filter((item) => item?.id && item?.name)
          .map((item) => ({
            id: String(item.id),
            name: String(item.name),
            muscle: String(item.muscleGroup || "General"),
            equipment: String(item.equipment || "No especificado"),
          }));

        if (mappedLibrary.length === 0) throw new Error("La biblioteca de ejercicios está vacía.");

        if (!cancelled) {
          setLibrary(mappedLibrary);
          setClients(clientItems);
          setSelectedClients((current) => current.filter((id) => clientItems.some((client: Client) => client.id === id)));

          setWeeks((current) => {
            const hasExercises = current.some((week) => week.days.some((day) => day.exercises.length > 0));
            if (hasExercises) return current;
            return current.map((week, weekIndex) =>
              weekIndex === 0
                ? {
                    ...week,
                    days: week.days.map((day, dayIndex) =>
                      dayIndex === 0
                        ? { ...day, exercises: mappedLibrary.slice(0, 2).map(makeEx) }
                        : day
                    ),
                  }
                : week
            );
          });
        }
      } catch (cause) {
        if (!cancelled) {
          setDataError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos del builder.");
        }
      } finally {
        if (!cancelled) setLibraryLoading(false);
      }
    }

    void loadBuilderData();
    return () => {
      cancelled = true;
    };
  }, []);

  const muscles = useMemo(() => ["Todos", ...Array.from(new Set(library.map((l) => l.muscle)))], [library]);
  const filteredLibrary = useMemo(() => {
    return library.filter((l) => {
      const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = muscleFilter === "Todos" || l.muscle === muscleFilter;
      return matchSearch && matchMuscle;
    });
  }, [library, search, muscleFilter]);

  const totalExercises = weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + d.exercises.length, 0), 0);
  const totalSets = weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + d.exercises.reduce((c, e) => c + e.sets, 0), 0), 0);
  const estMin = weeks.reduce((a, w) => a + w.days.length * 60, 0);

  function addWeek() {
    setWeeks((prev) => [
      ...prev,
      {
        id: `w-${Date.now()}`,
        name: `Semana ${prev.length + 1}`,
        days: [{ id: `d-${Date.now()}`, name: `Día 1`, exercises: [] }],
      },
    ]);
  }

  function addDay(weekIdx: number) {
    const copy = [...weeks];
    copy[weekIdx].days.push({ id: `d-${Date.now()}`, name: `Día ${copy[weekIdx].days.length + 1}`, exercises: [] });
    setWeeks(copy);
  }

  function addExerciseToDay(weekIdx: number, dayIdx: number, lib?: LibraryItem) {
    const item = lib || library[0];
    if (!item || !weeks[weekIdx]?.days[dayIdx]) return;
    const copy = [...weeks];
    copy[weekIdx].days[dayIdx].exercises.push(makeEx(item));
    setWeeks(copy);
    setSaveMessage(null);
    setSaveError(null);
  }

  function updateEx(weekIdx: number, dayIdx: number, exIdx: number, field: keyof BuilderExercise, value: unknown) {
    const copy = [...weeks];
    (copy[weekIdx].days[dayIdx].exercises[exIdx] as unknown as Record<string, unknown>)[field as string] = value;
    setWeeks(copy);
  }

  function removeEx(weekIdx: number, dayIdx: number, exIdx: number) {
    const copy = [...weeks];
    copy[weekIdx].days[dayIdx].exercises.splice(exIdx, 1);
    setWeeks(copy);
  }

  function duplicateEx(weekIdx: number, dayIdx: number, exIdx: number) {
    const copy = [...weeks];
    const orig = copy[weekIdx].days[dayIdx].exercises[exIdx];
    copy[weekIdx].days[dayIdx].exercises.splice(exIdx + 1, 0, { ...orig, id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
    setWeeks(copy);
  }

  function moveEx(weekIdx: number, dayIdx: number, exIdx: number, dir: "up" | "down") {
    const copy = [...weeks];
    const list = copy[weekIdx].days[dayIdx].exercises;
    const target = dir === "up" ? exIdx - 1 : exIdx + 1;
    if (target < 0 || target >= list.length) return;
    const [m] = list.splice(exIdx, 1);
    list.splice(target, 0, m);
    setWeeks(copy);
  }

  function handleDropOnDay(weekIdx: number, dayIdx: number) {
    if (dragLibrary) {
      addExerciseToDay(weekIdx, dayIdx, dragLibrary);
      setDragLibrary(null);
      return;
    }
    if (dragEx) {
      // find and remove from origin, add to target
      const copy = [...weeks];
      let found: BuilderExercise | null = null;
      for (const w of copy) for (const d of w.days) {
        const idx = d.exercises.findIndex((e) => e.id === dragEx.id);
        if (idx !== -1) {
          found = d.exercises.splice(idx, 1)[0];
          break;
        }
      }
      if (found) copy[weekIdx].days[dayIdx].exercises.push(found);
      setWeeks(copy);
      setDragEx(null);
    }
  }

  function toggleClient(id: string) {
    setSelectedClients((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setSaveMessage(null);
    setSaveError(null);
  }

  async function saveAndAssign() {
    if (saving) return;
    const trimmedName = programName.trim();
    if (!trimmedName) {
      setSaveError("Poné un nombre para el programa.");
      return;
    }
    if (selectedClients.length === 0) {
      setSaveError("Seleccioná al menos un cliente.");
      return;
    }
    if (totalExercises === 0) {
      setSaveError("Agregá al menos un ejercicio antes de guardar.");
      return;
    }

    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const frequency = Math.max(1, Math.min(7, Math.max(...weeks.map((week) => week.days.length), 1)));
      const payload = {
        name: trimmedName,
        description: `Creado desde Everfit UX Builder. Regla de progresión: ${autoProgression ? progressionRule : "manual"}.`,
        durationWeeks: weeks.length,
        frequency,
        weeks: weeks.map((week, weekIndex) => ({
          weekNumber: weekIndex + 1,
          days: week.days.map((day, dayIndex) => ({
            dayNumber: dayIndex + 1,
            name: day.name,
            estimatedMin: 60,
            exercises: day.exercises.map((exercise) => ({
              exerciseId: exercise.exerciseId,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              rir: exercise.rir,
              restSec: exercise.restSec,
              tempo: exercise.tempo,
              load: exercise.weight.trim() || undefined,
              notes: exercise.note.trim() || undefined,
            })),
          })),
        })),
      };

      const programRes = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const programData = await programRes.json().catch(() => null);

      if (!programRes.ok || !programData?.id) {
        throw new Error(programData?.error || "No se pudo guardar el programa.");
      }

      const assignmentResults = await Promise.all(
        selectedClients.map(async (clientId) => {
          try {
            const response = await fetch(`/api/clients/${clientId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assignedProgramId: programData.id }),
            });
            const body = await response.json().catch(() => null);
            return { clientId, ok: response.ok, error: body?.error || null };
          } catch (cause) {
            return {
              clientId,
              ok: false,
              error: cause instanceof Error ? cause.message : "Error de red",
            };
          }
        })
      );

      const failed = assignmentResults.filter((result) => !result.ok);
      const assigned = assignmentResults.length - failed.length;

      setSelectedClients([]);
      setSaveMessage(
        assigned === assignmentResults.length
          ? `Programa "${programData.name}" creado y asignado a ${assigned} cliente${assigned === 1 ? "" : "s"}.`
          : `Programa "${programData.name}" creado. Se asignó a ${assigned} de ${assignmentResults.length} cliente${assignmentResults.length === 1 ? "" : "s"}.`
      );

      if (failed.length > 0) {
        setSaveError(
          `${failed.length} asignación${failed.length === 1 ? "" : "es"} fallaron. ${failed.map((item) => item.error).filter(Boolean).slice(0, 2).join(" ")}`
        );
      }
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "No se pudo guardar el programa.");
    } finally {
      setSaving(false);
    }
  }

  // Auto-progression preview: next week weight = +2.5% or double progression logic
  const progressionPreview = useMemo(() => {
    if (!autoProgression || weeks.length === 0) return null;
    const firstDay = weeks[0].days[0];
    if (!firstDay || firstDay.exercises.length === 0) return null;
    const ex = firstDay.exercises[0];
    const baseW = parseFloat(ex.weight) || 80;
    if (progressionRule === "linear") return `${baseW}kg → ${(baseW * 1.025).toFixed(1)}kg (+2.5% lineal)`;
    if (progressionRule === "double") return `${ex.reps} @ ${baseW || 80}kg → si toca tope 2 sesiones, +2.5kg (doble progresión)`;
    return `RIR ${ex.rir} → si RIR ≤1 dos sesiones, +2.5kg; si RIR ≥4, mantener (RIR-based)`;
  }, [autoProgression, progressionRule, weeks]);

  return (
    <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers size={18} className="text-primary" /> Everfit UX Builder
              <Badge variant="muted" className="text-[10px] border-zinc-700">drag&drop + auto-progression + assignment</Badge>
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="muted" className="border-zinc-700 text-zinc-400 text-[10px]"><Dumbbell size={10} className="mr-1" />{totalExercises} ej</Badge>
            <Badge variant="muted" className="border-zinc-700 text-zinc-400 text-[10px]">{totalSets} series</Badge>
            <Badge variant="muted" className="border-zinc-700 text-zinc-400 text-[10px]"><Timer size={10} className="mr-1" />{estMin} min/sem</Badge>
          </div>
        </div>

        {/* Auto-progression bar */}
        <div className="mt-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={autoProgression} onChange={(e) => setAutoProgression(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
            <span className="text-xs font-black flex items-center gap-1"><Zap size={12} className="text-primary" /> Auto-progression</span>
          </label>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <div className="flex gap-1.5">
            {[
              { id: "double", label: "Doble progresión" },
              { id: "linear", label: "Lineal +2.5%" },
              { id: "rir", label: "RIR-based" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setProgressionRule(r.id as typeof progressionRule)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${progressionRule === r.id ? "bg-primary text-black border-primary" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[11px] text-zinc-500 flex items-center gap-1"><TrendingUp size={11} className="text-emerald-400" />{progressionPreview || "Activa para ajustar carga automáticamente"}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid lg:grid-cols-[280px_1fr] gap-3">
          {dataError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{dataError}</span>
            </div>
          )}

          {/* Library */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col max-h-[560px]">
            <div className="p-3 border-b border-zinc-800 space-y-2">
              <p className="text-xs font-black tracking-widest uppercase text-zinc-400 flex items-center gap-1.5"><Search size={12} /> Biblioteca</p>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ejercicio..."
                  className="w-full h-9 pl-8 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {muscles.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMuscleFilter(m)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${muscleFilter === m ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-500 border-zinc-800"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">
                {libraryLoading ? "Cargando biblioteca real..." : `Arrastrá al día o tocá + — ${filteredLibrary.length} ejercicios`}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {libraryLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-500">
                  <Loader2 size={14} className="animate-spin" /> Cargando ejercicios...
                </div>
              ) : filteredLibrary.length === 0 ? (
                <p className="px-2 py-10 text-center text-xs text-zinc-500">No hay ejercicios para ese filtro.</p>
              ) : filteredLibrary.map((lib) => (
                <div
                  key={lib.id}
                  draggable
                  onDragStart={() => setDragLibrary(lib)}
                  onDragEnd={() => setDragLibrary(null)}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2 hover:border-zinc-700 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical size={14} className="text-zinc-500 group-hover:text-zinc-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-none truncate">{lib.name}</p>
                    <p className="text-[11px] text-zinc-500">{lib.muscle} • {lib.equipment}</p>
                  </div>
                  <button
                    onClick={() => addExerciseToDay(0, 0, lib)}
                    className="w-7 h-7 rounded-lg bg-primary text-black flex items-center justify-center hover:bg-primary-hover shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
              <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1"><Link2 size={11} /> Tip: arrastrá o usá + para agregar al Día 1</p>
            </div>
          </div>

          {/* Builder canvas */}
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {weeks.map((w, wi) => (
              <div key={w.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="bg-zinc-900/60 px-3 py-2.5 flex items-center justify-between border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" className="font-black text-[11px]">{w.name}</Badge>
                    <input
                      value={w.name}
                      onChange={(e) => {
                        const c = [...weeks];
                        c[wi].name = e.target.value;
                        setWeeks(c);
                      }}
                      className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-zinc-700 focus:border-primary outline-none px-1 w-32"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => addDay(wi)}><Plus size={12} className="mr-1" /> Día</Button>
                    {weeks.length > 1 && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-zinc-500 hover:text-red-400" onClick={() => setWeeks(weeks.filter((_, i) => i !== wi))}><Trash2 size={12} /></Button>
                    )}
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  {w.days.map((d, di) => (
                    <div
                      key={d.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropOnDay(wi, di)}
                      className={`border rounded-2xl overflow-hidden transition ${dragLibrary || dragEx ? "border-primary/40 bg-primary/[0.03]" : "border-zinc-800 bg-zinc-900"}`}
                    >
                      <div className="px-3 py-2.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2">
                        <input
                          value={d.name}
                          onChange={(e) => {
                            const c = [...weeks];
                            c[wi].days[di].name = e.target.value;
                            setWeeks(c);
                          }}
                          className="flex-1 bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-zinc-700 focus:border-primary outline-none px-1 min-w-0"
                        />
                        <span className="text-[11px] text-zinc-500 shrink-0">{d.exercises.length} ej • {d.exercises.reduce((a, e) => a + e.sets, 0)} series</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-800 shrink-0" onClick={() => addExerciseToDay(wi, di)}><Plus size={12} className="mr-1" /> Ejercicio</Button>
                        <button
                          onClick={() => {
                            const c = [...weeks];
                            c[wi].days.splice(di, 1);
                            setWeeks(c);
                          }}
                          className="text-zinc-500 hover:text-red-400 p-1 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {d.exercises.length === 0 ? (
                        <div className="p-6 text-center border-2 border-dashed border-zinc-800 rounded-xl m-3 bg-zinc-950">
                          <p className="text-xs text-zinc-500">Soltá ejercicios aquí o presioná + Ejercicio</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-800">
                          {d.exercises.map((ex, ei) => (
                            <div
                              key={ex.id}
                              draggable
                              onDragStart={() => setDragEx(ex)}
                              onDragEnd={() => setDragEx(null)}
                              className={`p-3 bg-zinc-950 hover:bg-zinc-900/40 transition group ${dragEx?.id === ex.id ? "opacity-40" : ""}`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="mt-1 cursor-grab active:cursor-grabbing text-zinc-500 group-hover:text-zinc-400"><GripVertical size={14} /></span>
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center font-black text-xs shrink-0">{ei + 1}</span>
                                    <span className="font-bold text-sm truncate flex-1">{ex.name}</span>
                                    <Badge variant="muted" className="border-zinc-800 text-zinc-500 text-[10px] shrink-0">{ex.muscle}</Badge>
                                    {ex.superset && <Badge variant="accent" className="text-[10px]">SUPERSET</Badge>}
                                  </div>

                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                    <div>
                                      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Sets</span>
                                      <input type="number" min={1} value={ex.sets} onChange={(e) => updateEx(wi, di, ei, "sets", Number(e.target.value) || 1)} className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg text-center text-sm font-bold text-white" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Reps</span>
                                      <input value={ex.reps} onChange={(e) => updateEx(wi, di, ei, "reps", e.target.value)} placeholder="8-12" className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg text-center text-sm font-bold text-white" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Peso</span>
                                      <input value={ex.weight} onChange={(e) => updateEx(wi, di, ei, "weight", e.target.value)} placeholder="80kg" className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg text-center text-sm text-white" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">RIR</span>
                                      <input type="number" min={0} max={5} value={ex.rir} onChange={(e) => updateEx(wi, di, ei, "rir", Number(e.target.value))} className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg text-center text-sm font-bold text-white" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Desc</span>
                                      <input type="number" step={15} value={ex.restSec} onChange={(e) => updateEx(wi, di, ei, "restSec", Number(e.target.value) || 90)} className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg text-center text-sm font-bold text-white" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Tempo</span>
                                      <input value={ex.tempo} onChange={(e) => updateEx(wi, di, ei, "tempo", e.target.value)} placeholder="3-1-1-0" className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg text-center text-xs font-mono text-white" />
                                    </div>
                                  </div>

                                  <div className="flex gap-1.5">
                                    <input
                                      value={ex.note}
                                      onChange={(e) => updateEx(wi, di, ei, "note", e.target.value)}
                                      placeholder="Nota: codos pegados, pausa abajo..."
                                      className="flex-1 h-8 px-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-primary"
                                    />
                                    <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer shrink-0">
                                      <input type="checkbox" checked={ex.superset} onChange={(e) => updateEx(wi, di, ei, "superset", e.target.checked)} className="accent-primary" /> SS
                                    </label>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1 shrink-0">
                                  <button onClick={() => moveEx(wi, di, ei, "up")} disabled={ei === 0} aria-label="Subir ejercicio" className="p-2 -m-1 text-zinc-500 hover:text-white disabled:opacity-30 min-h-[32px] min-w-[32px] flex items-center justify-center"><ArrowUp size={12} /></button>
                                  <button onClick={() => moveEx(wi, di, ei, "down")} disabled={ei === d.exercises.length - 1} aria-label="Bajar ejercicio" className="p-2 -m-1 text-zinc-500 hover:text-white disabled:opacity-30 min-h-[32px] min-w-[32px] flex items-center justify-center"><ArrowDown size={12} /></button>
                                  <button onClick={() => duplicateEx(wi, di, ei)} aria-label="Duplicar ejercicio" className="p-2 -m-1 text-zinc-500 hover:text-primary min-h-[32px] min-w-[32px] flex items-center justify-center"><Copy size={12} /></button>
                                  <button onClick={() => removeEx(wi, di, ei)} aria-label="Eliminar ejercicio" className="p-2 -m-1 text-zinc-500 hover:text-red-400 min-h-[32px] min-w-[32px] flex items-center justify-center"><Trash2 size={12} /></button>
                                </div>
                              </div>
                              {autoProgression && (
                                <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
                                  <Zap size={10} className="text-primary" />
                                  {progressionRule === "double" ? `Doble: si ${ex.reps} tope 2× → +2.5kg` : progressionRule === "linear" ? `Lineal: +2.5% next week` : `RIR ${ex.rir}: si RIR≤1 2× → +2.5kg`}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addWeek} className="w-full border-dashed border-zinc-700 h-10"><Plus size={14} className="mr-2" /> Agregar semana</Button>
          </div>
        </div>

        {/* Assignment */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black tracking-widest uppercase text-zinc-400 flex items-center gap-1.5"><Users size={14} className="text-primary" /> Asignar programa real</p>
              <p className="mt-1 text-[11px] text-zinc-500">Se crea el programa en la base y luego se asigna a los clientes seleccionados.</p>
            </div>
            <Badge variant="muted" className="border-zinc-700 text-zinc-500 text-[11px] shrink-0">{selectedClients.length} clientes</Badge>
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={programName}
              onChange={(e) => { setProgramName(e.target.value); setSaveMessage(null); setSaveError(null); }}
              maxLength={160}
              placeholder="Nombre del programa"
              className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-bold text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none"
            />
            <span className="flex items-center gap-1.5 px-2 text-xs text-zinc-500"><Settings2 size={12} /> {weeks.length} semanas • {Math.max(...weeks.map((w) => w.days.length), 1)} días/sem</span>
          </div>

          <div className="mb-3 max-h-44 overflow-y-auto pr-1 grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {clients.map((c) => {
              const sel = selectedClients.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleClient(c.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition ${sel ? "bg-primary border-primary text-black font-bold" : "bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700"}`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? "bg-black border-black text-primary" : "border-zinc-700"}`}>{sel && <Check size={12} />}</span>
                  <span className="text-xs truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
          {saveError && (
            <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          {saveMessage && (
            <div role="status" className="mb-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500 px-2">
              <Settings2 size={12} /> Duración {weeks.length} sem • {Math.max(...weeks.map((w) => w.days.length), 1)} días/sem
            </span>
            <Button
              variant="accent"
              className="ml-auto font-black"
              disabled={saving || selectedClients.length === 0 || !programName.trim() || totalExercises === 0}
              onClick={() => void saveAndAssign()}
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin mr-1" /> Guardando y asignando...</>
              ) : selectedClients.length ? (
                <>Crear y asignar a {selectedClients.length} cliente{selectedClients.length === 1 ? "" : "s"} →</>
              ) : (
                "Seleccioná clientes"
              )}
            </Button>
          </div>

          <div className="mt-3 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-2.5 flex gap-2">
            <TrendingUp size={14} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white">Regla de progresión</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {autoProgression
                  ? `Se guarda como regla “${progressionRule}” en el programa; las cargas quedan según lo definido en cada ejercicio.`
                  : "Progresión manual: las cargas quedan según lo definido en cada ejercicio."}
              </p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
