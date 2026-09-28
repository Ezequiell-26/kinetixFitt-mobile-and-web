"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, Dumbbell, Loader2 } from "lucide-react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

type WorkoutLog = {
  id: string;
  date: string;
  durationMin?: number | null;
  workout?: { name?: string | null } | null;
};

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ClientCalendar() {
  const [month, setMonth] = useState(() => new Date());
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState(() => dateKey(new Date()));
  const [error, setError] = useState<string | null>(null);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthLabel = month.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const todayKey = dateKey(new Date());

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch("/api/workout-logs", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar el historial de entrenamientos.");
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el calendario.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const logsByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    for (const log of logs) {
      const key = dateKey(new Date(log.date));
      const existing = map.get(key) ?? [];
      existing.push(log);
      map.set(key, existing);
    }
    return map;
  }, [logs]);

  const selectedLogs = logsByDate.get(selectedKey) ?? [];
  const completedThisMonth = Array.from(logsByDate.entries()).filter(([key]) => key.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}-`)).length;

  function changeMonth(delta: number) {
    setMonth(new Date(year, monthIndex + delta, 1));
  }

  function goToday() {
    const today = new Date();
    setMonth(today);
    setSelectedKey(dateKey(today));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="rounded-[28px] border border-[#1C3142] bg-[#0B151E] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8193A5]">Constancia</p>
            <h2 className="mt-1 font-display text-2xl font-black capitalize text-white">{monthLabel}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => changeMonth(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1C3142] bg-[#081119] text-[#8193A5] transition hover:border-[#34D399]/30 hover:text-white" aria-label="Mes anterior"><ChevronLeft size={18} /></button>
            <button type="button" onClick={goToday} className="h-10 rounded-xl border border-[#34D399]/25 bg-[#34D399]/[0.07] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#34D399] transition hover:bg-[#34D399]/10">Hoy</button>
            <button type="button" onClick={() => changeMonth(1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1C3142] bg-[#081119] text-[#8193A5] transition hover:border-[#34D399]/30 hover:text-white" aria-label="Mes siguiente"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-7 gap-2">
          {WEEKDAYS.map((day) => <div key={day} className="pb-1 text-center text-[10px] font-black uppercase tracking-[0.12em] text-[#55697A]">{day}</div>)}
          {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} className="aspect-square" />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const current = new Date(year, monthIndex, day);
            const key = dateKey(current);
            const completed = logsByDate.get(key)?.length ?? 0;
            const selected = selectedKey === key;
            const isToday = key === todayKey;
            return (
              <button key={key} type="button" onClick={() => setSelectedKey(key)} className={`group relative aspect-square rounded-2xl border p-2 text-left transition-all duration-200 ${selected ? "border-[#34D399]/60 bg-[#34D399]/[0.10] shadow-[0_0_24px_rgba(52,211,153,0.10)]" : "border-[#1C3142] bg-[#081119] hover:-translate-y-0.5 hover:border-[#34D399]/30 hover:bg-[#0E1922]"}`} aria-label={`${day} de ${monthLabel}`}>
                <span className={`text-xs font-black ${isToday ? "text-[#34D399]" : "text-white"}`}>{day}</span>
                {completed > 0 && <span className="absolute bottom-2 left-2 right-2 flex items-center gap-1 text-[9px] font-bold text-[#34D399]"><span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />{completed} {completed === 1 ? "sesión" : "sesiones"}</span>}
                {isToday && completed === 0 && <span className="absolute bottom-2 left-2 text-[9px] font-bold text-[#55697A]">Hoy</span>}
              </button>
            );
          })}
        </div>

        {loading && <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-[#1C3142] bg-[#081119] py-4 text-xs text-[#8193A5]"><Loader2 size={15} className="animate-spin text-[#34D399]" />Actualizando calendario…</div>}
        {error && <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-xs text-red-200">{error}</div>}
      </section>

      <aside className="rounded-[28px] border border-[#1C3142] bg-[#0B151E] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8193A5]">Día seleccionado</p><h3 className="mt-1 text-xl font-black text-white">{new Date(`${selectedKey}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}</h3></div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#34D399]/20 bg-[#34D399]/[0.08] text-[#34D399]"><CalendarDays size={18} /></span>
        </div>

        <div className="mt-5 rounded-2xl border border-[#1C3142] bg-[#081119] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#55697A]">Este mes</p>
          <div className="mt-2 flex items-end justify-between"><span className="font-display text-4xl font-black text-white">{completedThisMonth}</span><span className="pb-1 text-xs text-[#8193A5]">días entrenados</span></div>
        </div>

        <div className="mt-5 space-y-3">
          {selectedLogs.length > 0 ? selectedLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-[#1C3142] bg-[#081119] p-4">
              <div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#34D399]/10 text-[#34D399]"><Dumbbell size={16} /></span><div className="min-w-0"><p className="text-sm font-black text-white">{log.workout?.name || "Entrenamiento"}</p><p className="mt-1 text-[11px] text-[#8193A5]">{log.durationMin ? `${log.durationMin} minutos` : "Sesión registrada"}</p></div><CheckCircle2 size={17} className="ml-auto shrink-0 text-[#34D399]" /></div>
            </div>
          )) : <div className="rounded-2xl border border-dashed border-[#1C3142] px-4 py-8 text-center"><CalendarDays size={22} className="mx-auto text-[#55697A]" /><p className="mt-3 text-sm font-bold text-white">Sin sesiones registradas</p><p className="mt-1 text-xs leading-5 text-[#8193A5]">Cuando completes un entrenamiento aparecerá acá automáticamente.</p></div>}
        </div>
      </aside>
    </div>
  );
}
