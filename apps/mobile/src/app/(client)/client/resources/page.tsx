"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bookmark, Check, ChevronDown, MessageCircle, Star } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";

type Resource = {
  id: string;
  title: string;
  type: "Video" | "Guía" | "Checklist" | "Audio";
  duration: string;
  premium: boolean;
  thumb: string;
  summary: string;
  body: string[];
};

const resources: Resource[] = [
  {
    id: "squat-technique",
    title: "Guía práctica: Sentadilla con Barra",
    type: "Guía",
    duration: "5 min",
    premium: true,
    thumb: "/exercises/free/Barbell_Glute_Bridge.jpg",
    summary: "Checklist visual para preparar y ejecutar una sentadilla con barra con control.",
    body: [
      "Prepará la postura con pies aproximadamente al ancho de hombros y una base estable.",
      "Mantené el tronco firme, iniciá el descenso con control y buscá profundidad que puedas repetir sin perder posición.",
      "Subí empujando el suelo y mantené rodillas y pies alineados durante el recorrido.",
    ],
  },
  {
    id: "nutrition-hypertrophy",
    title: "Guía: Nutrición para Hipertrofia",
    type: "Guía",
    duration: "6 min",
    premium: true,
    thumb: "/exercises/free/Ab_Roller.jpg",
    summary: "Principios generales para organizar comidas alrededor de un objetivo de ganancia muscular.",
    body: [
      "Usá el objetivo calórico calculado por KinetixFitt como referencia, no como indicación médica.",
      "Distribuí fuentes de proteína y carbohidratos en las comidas que mejor se adapten a tu rutina.",
      "Revisá semanalmente peso, rendimiento y adherencia antes de hacer cambios grandes.",
    ],
  },
  {
    id: "meal-prep",
    title: "Checklist: Preparación de Comidas",
    type: "Checklist",
    duration: "4 min",
    premium: false,
    thumb: "/exercises/free/Air_Bike.jpg",
    summary: "Pasos rápidos para dejar comida lista y reducir decisiones durante la semana.",
    body: [
      "Elegí 2 o 3 fuentes de proteína, 2 acompañamientos y vegetales que puedas rotar.",
      "Porcioná las comidas en recipientes y etiquetá los días para evitar improvisaciones.",
      "Dejá una opción rápida disponible para los días en que cambie tu horario.",
    ],
  },
  {
    id: "preworkout-audio",
    title: "Audio: Preparación Pre-Entreno",
    type: "Audio",
    duration: "1 min",
    premium: true,
    thumb: "/exercises/free/Alternate_Hammer_Curl.jpg",
    summary: "Una pausa breve para bajar distracciones y entrar enfocado a la sesión.",
    body: [
      "Este recurso funciona como preparación mental; no reemplaza el calentamiento físico.",
      "Respirá, revisá el objetivo del entrenamiento y comenzá por tu calentamiento planificado.",
    ],
  },
];

export default function ResourcesPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kinetixfitt-saved-resources");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedIds(parsed.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      // Preferimos iniciar sin favoritos antes que romper la pantalla por storage corrupto.
    }
  }, []);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  function toggleSaved(id: string) {
    const next = savedSet.has(id) ? savedIds.filter((value) => value !== id) : [...savedIds, id];
    setSavedIds(next);
    try {
      localStorage.setItem("kinetixfitt-saved-resources", JSON.stringify(next));
    } catch {
      // La sesión actual mantiene el estado aunque localStorage no esté disponible.
    }
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Recursos VIP</h1>
          <p className="text-sm text-zinc-500">Guías prácticas y materiales para acompañar tu entrenamiento</p>
        </div>
        <Badge variant="accent">VIP</Badge>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-zinc-900">
        <CardContent className="flex items-center gap-3 pt-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-black">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <p className="font-bold">Biblioteca actual</p>
            <p className="text-xs text-zinc-500">
              {resources.length} recursos catalogados · {savedIds.length} guardados en este dispositivo
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {resources.map((resource) => {
          const open = openId === resource.id;
          const saved = savedSet.has(resource.id);
          return (
            <Card key={resource.id} className="overflow-hidden border-zinc-800 transition hover:border-zinc-700">
              <div className="flex gap-3 p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                  <OptimizedImage
                    src={resource.thumb}
                    alt={resource.title}
                    fill
                    className="h-full w-full object-cover"
                    sizes="80px"
                    quality={80}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={resource.premium ? "accent" : "muted"}>{resource.type}</Badge>
                    <span className="text-xs text-zinc-500">{resource.duration}</span>
                    {resource.premium && <span className="text-xs text-primary">• VIP</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold">{resource.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : resource.id)}
                    >
                      <ChevronDown size={13} className={`mr-1.5 transition-transform ${open ? "rotate-180" : ""}`} />
                      {open ? "Cerrar" : "Ver"}
                    </Button>
                    <Button
                      type="button"
                      variant={saved ? "success" : "ghost"}
                      size="sm"
                      className="h-8 text-xs"
                      aria-pressed={saved}
                      onClick={() => toggleSaved(resource.id)}
                    >
                      {saved ? <Check size={13} className="mr-1.5" /> : <Bookmark size={13} className="mr-1.5" />}
                      {saved ? "Guardado" : "Guardar"}
                    </Button>
                  </div>
                </div>
              </div>

              {open && (
                <div className="border-t border-zinc-800 bg-zinc-950/60 px-4 py-4">
                  <p className="text-sm font-semibold text-white">{resource.summary}</p>
                  <div className="mt-3 space-y-2">
                    {resource.body.map((paragraph) => (
                      <p key={paragraph} className="text-xs leading-5 text-zinc-400">{paragraph}</p>
                    ))}
                  </div>
                  {resource.type === "Audio" && (
                    <audio className="mt-4 w-full" controls preload="none" src="/audio/voices/kinetixfitt/motivation/vamos-suave.mp3" aria-label="Audio de preparación pre-entreno" />
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>¿Necesitás ayuda?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Link href="/client/messages" className="flex-1">
            <Button variant="accent" className="w-full">
              <MessageCircle size={15} className="mr-2" /> Chatear con tu coach
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
