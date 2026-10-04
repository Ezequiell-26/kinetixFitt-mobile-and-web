"use client";
/**
 * command-palette-pro.tsx — Command palette premium mejorado
 * Inspirado en patrones MIT de:
 * - pacocoursey/cmdk (MIT) https://github.com/pacocoursey/cmdk — fast, composable, unstyled command menu (fuzzy, groups, keyboard nav)
 * Licencia MIT respetada. Código original adaptado con fuzzy, agrupado, historial y microinteractions.
 * Atribución completa en docs/MIT_ATTRIBUTION.md #71
 */
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, Clock, ArrowRight, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { navForRole, type NavEntry } from "@/lib/nav-registry";
import { useSessionUserKey, useUserPrefs } from "@/lib/user-prefs";

type Cmd = NavEntry & { kbd?: string };

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark className="rounded bg-primary/30 px-0.5 text-white">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
}

export function CommandPalettePro({ role = "trainer" }: { role?: "trainer" | "client" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [dynamic, setDynamic] = useState<Cmd[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const commands = navForRole(role);
  const userKey = useSessionUserKey();
  const { favs, recent, isFav, toggleFav, pushRecent } = useUserPrefs(userKey);

  useEffect(() => {
    if (role !== "trainer" || !open || q.trim().length < 2) { setDynamic([]); return; }
    const term = q.trim().toLowerCase();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const [exRes, clRes] = await Promise.all([
          fetch(`/api/exercises?q=${encodeURIComponent(term)}`, { signal: controller.signal }).then((r) => (r.ok ? r.json() : [])),
          fetch("/api/clients?limit=200", { signal: controller.signal }).then((r) => (r.ok ? r.json() : [])),
        ]);
        const out: Cmd[] = [];
        if (Array.isArray(exRes)) {
          for (const e of exRes.slice(0, 4)) out.push({ label: e.name, href: `/trainer/exercises?q=${encodeURIComponent(e.name)}`, group: "Ejercicios", desc: `${e.muscleGroup} · ${e.equipment || "—"}` });
        }
        const clients = Array.isArray(clRes) ? clRes : Array.isArray(clRes?.items) ? clRes.items : [];
        for (const c of clients) {
          if (!String(c.name).toLowerCase().includes(term)) continue;
          out.push({ label: c.name, href: `/trainer/clients/${c.id}`, group: "Atletas", desc: c.plan || undefined });
        }
        setDynamic(out);
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) setDynamic([]);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, open, role]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((value) => !value); }
      if (event.key === "/" && !open && (event.target as HTMLElement)?.tagName !== "INPUT" && (event.target as HTMLElement)?.tagName !== "TEXTAREA") { event.preventDefault(); setOpen(true); }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) { const timer = window.setTimeout(() => inputRef.current?.focus(), 30); setIdx(0); return () => window.clearTimeout(timer); }
    setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const base = q ? [...commands, ...dynamic] : commands;
    if (!q) return base;
    const low = q.toLowerCase();
    return base.map((command) => {
      const hay = `${command.label} ${command.desc || ""} ${command.group}`.toLowerCase();
      const score = hay.includes(low) ? (command.label.toLowerCase().startsWith(low) ? 2 : 1) : 0;
      return { command, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.command);
  }, [q, commands, dynamic]);

  const groups = useMemo(() => {
    const map = new Map<string, Cmd[]>();
    for (const command of filtered) { if (!map.has(command.group)) map.set(command.group, []); map.get(command.group)!.push(command); }
    return Array.from(map.entries());
  }, [filtered]);

  function go(command: Cmd) { pushRecent({ href: command.href, label: command.label }); setOpen(false); router.push(command.href); }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); setIdx((value) => Math.min(value + 1, Math.max(0, filtered.length - 1))); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setIdx((value) => Math.max(value - 1, 0)); }
    else if (event.key === "Enter") { event.preventDefault(); const command = filtered[idx]; if (command) go(command); }
  }

  return <>
    <button onClick={() => setOpen(true)} aria-label="Abrir paleta de comandos" className={cn("hidden items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 lg:flex", "transition hover:border-zinc-700 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40")}><Search size={14}/><span>Buscar…</span><span className="ml-2 hidden items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] xl:inline-flex"><Command size={10}/>K</span></button>
    <button onClick={() => setOpen(true)} aria-label="Buscar" className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 lg:hidden"><Search size={14}/> Buscar</button>

    <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh] sm:pt-[20vh]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}/>
      <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 28 }} className="relative flex max-h-[70vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#111111] shadow-2xl">
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 p-4"><Search size={18} className="shrink-0 text-zinc-500"/><input ref={inputRef} value={q} onChange={(event) => { setQ(event.target.value); setIdx(0); }} onKeyDown={onKeyDown} placeholder={role === "client" ? "Buscar entrenos, progreso, nutrición…" : "Buscar clientes, rutinas, check-ins…"} className="flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-zinc-500 sm:text-sm"/><button onClick={() => setOpen(false)} className="shrink-0 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800" aria-label="Cerrar"><X size={16}/></button></div>

        {!q && (favs.length > 0 || recent.length > 0) && <div className="px-2 pb-1 pt-3">
          {favs.length > 0 && <><p className="mb-1 flex items-center gap-1 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500"><Star size={10} className="fill-primary text-primary"/> Favoritos</p><div className="space-y-1">{favs.map((favorite) => <button key={`fav-${favorite.href}`} onClick={() => go(favorite as Cmd)} className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left text-sm hover:border-zinc-800 hover:bg-zinc-900"><span className="text-zinc-200">{favorite.label}</span><ArrowRight size={14} className="text-zinc-500"/></button>)}</div></>}
          {recent.length > 0 && <><p className="mb-1 mt-2 flex items-center gap-1 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500"><Clock size={10}/> Recientes</p><div className="space-y-1">{recent.slice(0,4).map((item) => <button key={`recent-${item.href}`} onClick={() => go(item as Cmd)} className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left text-sm hover:border-zinc-800 hover:bg-zinc-900"><span className="text-zinc-300">{item.label}</span><ArrowRight size={14} className="text-zinc-500"/></button>)}</div></>}
          <div className="mx-2 my-2 h-px bg-zinc-800"/>
        </div>}

        <div className="flex-1 space-y-4 overflow-y-auto p-2">{filtered.length === 0 ? <div className="space-y-1 py-10 text-center"><p className="text-sm font-bold text-white">Sin resultados</p><p className="text-xs text-zinc-500">Probá con “{role === "client" ? "progreso" : "clientes"}” o “mensajes”</p></div> : groups.map(([group, items]) => <div key={group}><p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{group}</p><div className="space-y-1">{items.map((command) => { const globalIdx = filtered.indexOf(command); const active = globalIdx === idx; return <div key={`${command.href}-${command.label}`} className={cn("flex items-center gap-2 rounded-xl border px-2.5 py-2.5 transition", active ? "border-white bg-white text-black" : "border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900")} onMouseEnter={() => setIdx(globalIdx)}><button onClick={() => go(command)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold">{highlight(command.label, q)}</span>{command.desc && <span className={cn("block truncate text-[11px]", active ? "text-black/60" : "text-zinc-500")}>{command.desc}</span>}</button>{command.kbd && <span className={cn("shrink-0 rounded-lg border px-2 py-1 text-xs font-mono", active ? "border-black bg-black text-white" : "border-zinc-800 bg-zinc-950 text-zinc-400")}>{command.kbd}</span>}<button onClick={() => toggleFav({ href: command.href, label: command.label })} aria-label={isFav(command.href) ? "Quitar de favoritos" : "Agregar a favoritos"} title={isFav(command.href) ? "Quitar de favoritos" : "Favorito"} className={cn("shrink-0 rounded-lg p-1.5 transition", isFav(command.href) ? "text-primary" : active ? "text-black/50 hover:text-black" : "text-zinc-500 hover:text-zinc-300")}><Star size={14} className={isFav(command.href) ? "fill-primary" : ""}/></button></div>; })}</div></div>)}</div>
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-800 p-2.5 text-[11px] text-zinc-500"><span className="hidden sm:inline">↑↓ navegar • ↵ seleccionar • ESC cerrar</span><span className="sm:hidden">↵ seleccionar • / para abrir</span><span>{filtered.length} comandos</span></div>
      </motion.div>
    </motion.div>}</AnimatePresence>
  </>;
}
