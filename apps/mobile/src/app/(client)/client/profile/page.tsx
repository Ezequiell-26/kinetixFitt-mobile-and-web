"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, CreditCard, Loader2, LogOut } from "lucide-react";

type ClientProfileData = {
  id: string; name: string; email: string; age: number | null; weight: number | null; height: number | null; goal: string; plan: string; status: string; experience: string | null; availability: number | null; equipment: string | null;
  subscription: { plan: string; status: string; price: number | null; nextPayment: string | null } | null;
};

export default function ClientProfilePage(){
  const [profile, setProfile] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [savedSuccess, setSavedSuccess] = useState(false); const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(""); const [age, setAge] = useState(""); const [weight, setWeight] = useState(""); const [height, setHeight] = useState(""); const [goal, setGoal] = useState("HIPERTROFIA"); const [availability, setAvailability] = useState(4); const [equipment, setEquipment] = useState("Gimnasio completo");

  async function loadProfile(){
    setLoading(true); setError(null);
    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meData = await meRes.json().catch(() => null);
      const myId: string | null = meData?.user?.clientId ?? null;
      if (myId) {
        const detailRes = await fetch(`/api/clients/${myId}`, { cache: "no-store" });
        const full = await detailRes.json().catch(() => null);
        if (!detailRes.ok) throw new Error(full?.error || "No se pudo cargar tu perfil.");
        setProfile(full); setName(full.name || ""); setAge(full.age ? String(full.age) : ""); setWeight(full.weight ? String(full.weight) : ""); setHeight(full.height ? String(full.height) : ""); setGoal(full.goal || "HIPERTROFIA"); setAvailability(full.availability || 4); setEquipment(full.equipment || "Gimnasio completo");
      } else if (meData?.user?.name) setName(meData.user.name);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar tu perfil."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadProfile(); }, []);

  async function handleSave(e: React.FormEvent){
    e.preventDefault(); if (!profile) return; setSaving(true); setSavedSuccess(false); setError(null);
    try {
      const res = await fetch(`/api/clients/${profile.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, age: age ? Number(age) : null, weight: weight ? Number(weight) : null, height: height ? Number(height) : null, goal, availability: Number(availability), equipment }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error al guardar cambios.");
      setProfile((current) => current ? { ...current, ...data } : current);
      setSavedSuccess(true); window.setTimeout(() => setSavedSuccess(false), 4000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error al guardar cambios."); }
    finally { setSaving(false); }
  }

  async function logout(){ try { await fetch("/api/auth/logout", { method:"POST" }); } finally { location.href="/login"; } }

  if (loading) return <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-500"><Loader2 size={15} className="animate-spin"/> Cargando perfil...</div>;

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-display font-bold text-white">Mi Perfil</h1><p className="text-sm text-zinc-400">Datos personales, objetivos físicos y preferencias</p></div>
    {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200"><AlertTriangle size={15} className="mt-0.5"/>{error}</div>}
    {savedSuccess&&<div role="status" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs font-bold text-primary"><Check size={16}/> Tus cambios fueron guardados.</div>}

    <Card className="border-primary/20 bg-primary/[0.04]">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-white">¿Querés actualizar tu configuración inicial?</p>
          <p className="mt-1 text-xs text-zinc-500">Volvé al onboarding para revisar objetivo, nivel, disponibilidad y equipamiento.</p>
        </div>
        <Link href="/client/onboarding">
          <Button variant="outline" className="min-h-[44px] w-full sm:w-auto">Abrir onboarding</Button>
        </Link>
      </CardContent>
    </Card>

    <Card className="border-primary/15 bg-[#0B151E]"><CardContent className="flex items-center gap-4 p-5"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-black">{name?.[0]?.toUpperCase()||"A"}</div><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-bold text-white">{name||"Atleta"}</h2><p className="truncate text-xs text-zinc-400">{profile?.email}</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant="success" className="text-[10px]">{profile?.status||"ACTIVO"}</Badge><Badge variant="muted" className="text-[10px]">{profile?.plan||"PERSONALIZADO"}</Badge><Badge variant="accent" className="text-[10px]">{goal.replace("_"," ")}</Badge></div></div></CardContent></Card>

    <form onSubmit={handleSave} className="space-y-4">
      <Card className="border-primary/15 bg-[#0B151E]"><CardHeader className="pb-3"><CardTitle className="text-base">Datos físicos</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label className="text-xs">Nombre completo</Label><Input value={name} onChange={e=>setName(e.target.value)} required maxLength={120}/></div><div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={profile?.email||""} disabled className="opacity-50"/></div></div>
        <div className="grid grid-cols-3 gap-3"><div className="space-y-1.5"><Label className="text-xs">Edad</Label><Input type="number" min="13" max="120" value={age} onChange={e=>setAge(e.target.value)} placeholder="28"/></div><div className="space-y-1.5"><Label className="text-xs">Peso (kg)</Label><Input type="number" min="20" max="400" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="85.0"/></div><div className="space-y-1.5"><Label className="text-xs">Altura (cm)</Label><Input type="number" min="100" max="250" value={height} onChange={e=>setHeight(e.target.value)} placeholder="178"/></div></div>
        <div className="space-y-1.5"><Label className="text-xs">Objetivo de entrenamiento</Label><select value={goal} onChange={e=>setGoal(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-white focus:border-primary focus:outline-none"><option value="HIPERTROFIA">Hipertrofia (Ganancia Muscular)</option><option value="PERDIDA_GRASA">Pérdida de Grasa & Definición</option><option value="FUERZA">Fuerza Máxima & Powerlifting</option><option value="RECOMPOSICION">Recomposición Corporal</option><option value="OTRO">Salud & Acondicionamiento</option></select></div>
      </CardContent></Card>
      <Card className="border-primary/15 bg-[#0B151E]"><CardHeader className="pb-3"><CardTitle className="text-base">Disponibilidad y equipamiento</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label className="text-xs">Días de entrenamiento por semana</Label><select value={availability} onChange={e=>setAvailability(Number(e.target.value))} className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-white focus:border-primary focus:outline-none"><option value={2}>2 días</option><option value={3}>3 días</option><option value={4}>4 días</option><option value={5}>5 días</option><option value={6}>6 días</option></select></div><div className="space-y-1.5"><Label className="text-xs">Equipamiento / lugar</Label><Input value={equipment} onChange={e=>setEquipment(e.target.value)} placeholder="Gimnasio, casa con mancuernas..." maxLength={200}/></div></div><Button type="submit" variant="accent" disabled={saving} className="mt-2 h-12 w-full font-black">{saving?<><Loader2 size={15} className="mr-2 animate-spin"/> Guardando...</>:"GUARDAR CAMBIOS"}</Button></CardContent></Card>
    </form>

    <Card className="border-primary/15 bg-[#0B151E]"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CreditCard size={18} className="text-primary"/> Suscripción de coaching</CardTitle></CardHeader><CardContent className="space-y-3 text-xs"><div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3"><div><p className="text-sm font-bold text-white">Plan {profile?.plan||"Personalizado"}</p><p className="text-zinc-500">Coaching 1:1 con tu coach</p></div><Badge variant={profile?.subscription?.status === "ACTIVA" ? "success" : "warn"}>{profile?.subscription?.status||"PENDIENTE"}</Badge></div>{profile?.subscription&&<div className="space-y-1 text-zinc-400"><div className="flex justify-between border-b border-zinc-850 py-1"><span>Cuota mensual</span><span className="font-bold text-white">${profile.subscription.price?.toLocaleString("es-AR")} ARS</span></div>{profile.subscription.nextPayment&&<div className="flex justify-between py-1"><span>Próximo vencimiento</span><span className="font-bold text-zinc-300">{new Date(profile.subscription.nextPayment).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}</span></div>}</div>}<p className="pt-1 text-center text-[11px] text-zinc-500">Pagos y renovaciones se gestionan de forma segura. No se almacenan datos de tarjetas.</p></CardContent></Card>

    <Card className="border-red-500/20 bg-red-500/5"><CardContent className="pt-4"><Button variant="ghost" onClick={() => void logout()} className="h-12 w-full gap-2 border border-red-500/20 bg-zinc-950 font-bold text-red-400 hover:bg-red-500/10"><LogOut size={16}/> Cerrar sesión</Button><p className="mt-2 text-center text-[11px] text-zinc-600">Tus programas y progreso quedan guardados.</p></CardContent></Card>
  </div>;
}
