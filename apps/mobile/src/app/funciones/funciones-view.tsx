'use client';

import Link from "next/link";
import {
  ClipboardList,
  Dumbbell,
  Timer,
  Apple,
  MessagesSquare,
  Camera,
  ArrowRight,
  CheckCircle2,
  Play,
  Sparkles,
} from "lucide-react";
import { SiteNav } from "@/components/landing/site-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { useTranslation } from "@/hooks/use-translation";

const groups = [
  {
    icon: ClipboardList,
    title: "Programa personalizado",
    desc: "Tu plan armado por KinetixFitt según tu objetivo, días disponibles y lugar de entreno: casa o gimnasio.",
    href: "/client/workout",
    cta: "Ver mi entreno",
    features: ["Adaptativo", "Sin conexión", "Actualizable"],
    image: "/features/programa-personalizado.jpg",
  },
  {
    icon: Dumbbell,
    title: "Biblioteca de ejercicios",
    desc: "Biblioteca disponible sin conexión: instrucciones, músculos trabajados y equipo necesario de cada ejercicio.",
    href: "/client/workout",
    cta: "Explorar ejercicios",
    features: ["Guías de ejecución", "Músculos trabajados", "Equipo requerido"],
    image: "/features/biblioteca-ejercicios.jpg",
  },
  {
    icon: Timer,
    title: "Cronómetros integrados",
    desc: "HIIT, Tabata, EMOM, Pomodoro y descansos entre series, sin salir de tu sesión de entreno.",
    href: "/client/timers",
    cta: "Abrir cronómetros",
    features: ["Intervalos configurables", "Descanso entre series", "Alertas sonoras"],
    image: "/features/cronometros.jpg",
  },
  {
    icon: Apple,
    title: "Nutrición y calculadoras",
    desc: "Registro diario de comidas, macros, calculadora de calorías, TMB y 1RM estimado.",
    href: "/client/nutrition",
    cta: "Ver nutrición",
    features: ["Scanner de códigos", "Base de datos alimentos", "Seguimiento de macros"],
    image: "/features/nutricion.jpg",
  },
  {
    icon: MessagesSquare,
    title: "Contacto directo con tu coach",
    desc: "Mensajes privados y check-ins semanales con respuesta real de tu coach. Nada de bots.",
    href: "/client/messages",
    cta: "Abrir mensajes",
    features: ["Mensajes privados", "Check-ins", "Contexto del atleta"],
    image: "/features/mensajes-coach.jpg",
  },
  {
    icon: Camera,
    title: "Progreso privado",
    desc: "Peso, medidas y fotos de progreso visibles solo para vos y tu entrenador. Comparador antes/después incluido.",
    href: "/client/progress",
    cta: "Ver mi progreso",
    features: ["Comparador de fotos", "Gráficos de progreso", "Privacidad total"],
    image: "/features/progreso.jpg",
  },
];

const testimonials = [
  {
    name: "Martín G.",
    role: "Cliente desde 2024",
    content: "La mejor app de entrenamiento que usé. El programa se adapta perfectamente a mi horario y los ejercicios están muy bien explicados.",
    rating: 5,
    image: "/testimonials/martin-g.jpg",
  },
  {
    name: "Sofía R.",
    role: "Cliente desde 2023",
    content: "El seguimiento nutricional y las calculadoras me ayudaron a alcanzar mis objetivos. La comunicación con tu coach es excelente.",
    rating: 5,
    image: "/testimonials/sofia-r.jpg",
  },
  {
    name: "Lucas P.",
    role: "Cliente desde 2024",
    content: "Los cronómetros integrados y el modo offline son increíbles. Entreno en cualquier lado sin preocuparme por la conexión.",
    rating: 5,
    image: "/testimonials/lucas-p.jpg",
  },
];

export default function FuncionesView() {
  const { t, locale } = useTranslation();
  
  return (
    <div className="min-h-dvh bg-[#080808] text-white">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-14">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
            <Sparkles size={16} className="text-[#34D399]" />
            <span className="text-sm font-medium">Herramientas esenciales</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance">
            Todo tu entreno,{" "}
            <span className="text-[#34D399]">en un solo lugar</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Entrenamiento, progreso y comunicación reunidos en una sola experiencia, con cada flujo conectado al backend real.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#34D399] text-black font-black hover:bg-[#2DC48A] transition-colors"
            >
              Probarlo gratis <ArrowRight size={18} />
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-zinc-700 font-black hover:border-[#34D399] transition-colors"
            >
              <Play size={18} /> Ver demo
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {groups.map((g, index) => (
            <article
              key={g.title}
              className="group rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden hover:border-[#34D399]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#34D399]/10"
            >
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-b border-zinc-800">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(52,211,153,.12),transparent_52%)]" />
                <div className="relative flex h-full items-center justify-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#34D399]/20 bg-[#34D399]/10 text-[#34D399]">
                    <g.icon size={30} />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-black">{g.title}</h2>
                <p className="mt-2 text-sm text-zinc-400">{g.desc}</p>
                <ul className="mt-4 space-y-2">
                  {g.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-[#34D399] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={g.href}
                  className="mt-6 min-h-[48px] inline-flex items-center justify-center gap-2 w-full rounded-full border border-zinc-700 text-sm font-black hover:border-[#34D399] hover:bg-[#34D399]/10 transition-all"
                >
                  {g.cta} <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </section>

        {/* Demo Section */}
        <section id="demo" className="mb-20">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 lg:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-black">Una vista del producto</h2>
              <p className="mt-2 text-zinc-400">La experiencia se organiza alrededor de tres acciones: planificar, registrar y revisar.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Planificar", value: "Programa + sesiones", detail: "Tu coach crea y asigna la estructura de entrenamiento." },
                { title: "Registrar", value: "Series + progreso", detail: "La sesión guarda cargas, repeticiones y métricas." },
                { title: "Revisar", value: "Check-ins + analytics", detail: "Atleta y coach ven el historial para tomar decisiones." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-zinc-800 bg-[#09090B] p-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#34D399]">{item.title}</div>
                  <div className="mt-3 text-lg font-black">{item.value}</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust without fabricated social proof */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-black">Hecho para el trabajo real</h2>
            <p className="mt-2 text-zinc-400">Sin métricas comerciales inventadas ni pantallas de demo que simulan datos reales.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Atletas", text: "Entrenamiento, progreso, check-ins, mensajes y recursos en un solo lugar." },
              { title: "Entrenadores", text: "Programas, clientes, asignaciones, analíticas y operaciones centralizadas." },
              { title: "Datos reales", text: "Cuando una integración externa no está configurada, el producto lo muestra explícitamente." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-black">Preguntas frecuentes</h2>
            <p className="mt-2 text-zinc-400">Resolvemos tus dudas</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "¿Necesito conexión a internet para usar la app?",
                a: "No. La mayoría de las funciones funcionan sin conexión, incluyendo tu programa de ejercicios y los cronómetros. Solo necesitas internet para sincronizar tu progreso y recibir actualizaciones.",
              },
              {
                q: "¿Cuánto tiempo tarda tu coach en responder los mensajes?",
                a: "Generalmente responde dentro de las 24 horas hábiles. Para consultas urgentes, podés usar el chat en vivo durante el horario de atención.",
              },
              {
                q: "¿Puedo cambiar mi programa si mis objetivos cambian?",
                a: "Sí. Tu programa se adapta automáticamente según tu progreso y feedback. Además, podés solicitar ajustes personalizados en cualquier momento.",
              },
              {
                q: "¿La app está disponible para iOS y Android?",
                a: "Sí, KinetixFitt está disponible como PWA progresiva que funciona en ambos sistemas, además de tener versiones nativas para una experiencia optimizada.",
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="font-bold">{faq.q}</h3>
                  <span className="transition group-open:rotate-180">
                    <svg
                      className="w-5 h-5 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-zinc-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="text-center">
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900 p-12">
            <h2 className="text-2xl lg:text-4xl font-black mb-4">
              ¿Listo para empezar tu transformación?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              Creá tu cuenta de atleta y empezá con una estructura clara de entrenamiento y progreso.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#34D399] text-black font-black hover:bg-[#2DC48A] transition-colors"
              >
                Comenzar gratis <ArrowRight size={18} />
              </Link>
              <Link
                href="/planes"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-zinc-700 font-black hover:border-[#34D399] transition-colors"
              >
                Ver planes
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

