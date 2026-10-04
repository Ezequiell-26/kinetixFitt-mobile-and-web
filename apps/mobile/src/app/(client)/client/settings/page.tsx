"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AlertTriangle, Bell, Check, KeyRound, Loader2, LogOut, Shield } from "lucide-react";

type Preferences = { channels: { email: boolean; push: boolean; sms: boolean; whatsapp: boolean }; types: string[] };
type SessionRow = { id: string; current: boolean; userAgent?: string | null; lastUsed: string };

export default function ClientSettings() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>({ channels: { email: true, push: true, sms: false, whatsapp: false }, types: ["workout_reminder", "meal_reminder", "achievement", "coach_message", "payment_reminder"] });
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [prefsResponse, sessionsResponse] = await Promise.all([
          fetch("/api/notification-preferences", { cache: "no-store" }),
          fetch("/api/auth/sessions", { cache: "no-store" }),
        ]);
        const prefs = await prefsResponse.json().catch(() => null);
        const sessionData = await sessionsResponse.json().catch(() => null);
        if (!prefsResponse.ok) throw new Error(prefs?.error || "No se pudieron cargar las preferencias.");
        if (!sessionsResponse.ok) throw new Error(sessionData?.error || "No se pudieron cargar las sesiones.");
        if (!cancelled) {
          setPreferences({ channels: prefs.channels || preferences.channels, types: Array.isArray(prefs.types) ? prefs.types : preferences.types });
          setSessions(Array.isArray(sessionData.sessions) ? sessionData.sessions : []);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los ajustes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function savePreferences(next: Preferences) {
    setPreferences(next); setSavingPrefs(true); setError(null); setSuccess(null);
    try {
      const response = await fetch("/api/notification-preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: true, channels: next.channels, types: next.types }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudieron guardar las preferencias.");
      if (data?.data) setPreferences({ channels: data.data.channels, types: data.data.types });
      setSuccess("Preferencias actualizadas.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron guardar las preferencias."); }
    finally { setSavingPrefs(false); }
  }

  function toggleType(type: string) {
    const types = preferences.types.includes(type) ? preferences.types.filter((item) => item !== type) : [...preferences.types, type];
    void savePreferences({ ...preferences, types });
  }

  function toggleChannel(channel: keyof Preferences["channels"]) {
    void savePreferences({ ...preferences, channels: { ...preferences.channels, [channel]: !preferences.channels[channel] } });
  }

  async function revokeAll() {
    setError(null); setSuccess(null);
    try {
      const response = await fetch("/api/auth/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudieron cerrar las sesiones.");
      router.push("/login"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron cerrar las sesiones."); }
  }

  async function logout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { router.push("/login"); router.refresh(); }
  }

  const types = [["workout_reminder", "Recordatorios de entrenamiento"], ["meal_reminder", "Nutrición"], ["achievement", "Progreso y logros"], ["coach_message", "Mensajes del coach"], ["payment_reminder", "Pagos y renovaciones"]] as const;
  const channels = [
    ["email", "Email", true],
    ["push", "Push", true],
    ["sms", "SMS", false],
    ["whatsapp", "WhatsApp", Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)],
  ] as const;

  return (
    <div className="space-y-4 max-w-[720px] pb-20">
      <div><h1 className="text-2xl font-display font-bold text-white">Ajustes</h1><p className="mt-1 text-sm text-[#8193A5]">Personalizá la app, tus avisos y la seguridad de tu cuenta.</p></div>
      {loading && <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-[#8193A5]"><Loader2 size={14} className="animate-spin" /> Cargando...</div>}
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200"><AlertTriangle size={15} />{error}</div>}
      {success && <div role="status" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary"><Check size={15} />{success}</div>}

      <Card className="border-primary/15 bg-[#0B151E]"><CardHeader><CardTitle>Apariencia</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-[#8193A5]">Tema de KinetixFitt con soporte para tu preferencia del sistema.</p><ThemeToggle /></CardContent></Card>

      <Card className="border-primary/15 bg-[#0B151E]"><CardHeader><CardTitle className="flex items-center gap-2"><Bell size={17} className="text-primary" /> Notificaciones</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">{channels.map(([key, label, available]) => <button key={key} type="button" onClick={() => available && toggleChannel(key)} disabled={!available || savingPrefs} aria-disabled={!available} title={!available ? "Este canal todavía no está configurado." : undefined} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-xs font-bold ${preferences.channels[key] ? "border-primary/20 bg-primary/[0.05] text-white" : "border-white/[0.06] bg-white/[0.02] text-zinc-500"}`}><span>{label}</span><span className="text-primary">{!available ? "NO DISP." : preferences.channels[key] ? "ACTIVO" : "OFF"}</span></button>)}</div>
        <div className="space-y-2">{types.map(([key, label]) => <button key={key} type="button" onClick={() => toggleType(key)} disabled={savingPrefs} className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left text-xs"><span className="text-zinc-300">{label}</span><span className={`h-5 w-9 rounded-full p-0.5 ${preferences.types.includes(key) ? "bg-primary" : "bg-zinc-800"}`}><span className={`block h-4 w-4 rounded-full bg-white ${preferences.types.includes(key) ? "translate-x-4" : "translate-x-0"}`} /></span></button>)}</div>
        {savingPrefs && <p className="text-[11px] text-[#8193A5]">Guardando...</p>}
      </CardContent></Card>

      <Card className="border-primary/15 bg-[#0B151E]"><CardHeader><CardTitle className="flex items-center gap-2"><Shield size={17} className="text-primary" /> Seguridad</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-[#8193A5]">Tu sesión se valida en servidor. Cerrá todas las sesiones desde cualquier dispositivo cuando sea necesario.</p><div className="space-y-2">{sessions.map((session) => <div key={session.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-white">{session.current ? "Sesión actual" : "Sesión activa"}</p>{session.current && <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">ACTUAL</span>}</div><p className="mt-1 text-[11px] text-[#8193A5]">{session.userAgent || "Cliente desconocido"}</p><p className="mt-1 text-[11px] text-zinc-600">Último uso: {new Date(session.lastUsed).toLocaleString("es-AR")}</p></div>)}</div><Button variant="outline" onClick={() => void revokeAll()} disabled={loading} className="w-full">Cerrar todas las sesiones</Button></CardContent></Card>

      <Card><CardHeader><CardTitle>Cuenta</CardTitle></CardHeader><CardContent className="space-y-3"><Link href="/forgot-password" className="block"><Button variant="outline" className="w-full gap-2"><KeyRound size={16} /> Cambiar contraseña</Button></Link><Button variant="ghost" className="h-12 w-full gap-2 border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10" onClick={() => void logout()}><LogOut size={16}/> Cerrar sesión</Button></CardContent></Card>
    </div>
  );
}
