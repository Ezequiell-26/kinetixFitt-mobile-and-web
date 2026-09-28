import Link from "next/link";
import { SiteNav } from "@/components/landing/site-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { ArrowRight, Apple, BarChart3, Check, Clock3, Dumbbell, HeartPulse, MessageCircle, Play, ShieldCheck, Sparkles, Target } from "lucide-react";

const pillars = [
  { icon: Target, title: "Entrenamiento a medida", desc: "Programas construidos alrededor de tu objetivo, disponibilidad y nivel." },
  { icon: Dumbbell, title: "Ejecución guiada", desc: "Ejercicios, sesiones y seguimiento pensados para entrenar con claridad." },
  { icon: BarChart3, title: "Progreso visible", desc: "Registrá sesiones, medidas y evolución para tomar mejores decisiones." },
  { icon: Apple, title: "Nutrición integrada", desc: "Objetivos, macros, comidas e hidratación dentro de la misma experiencia." },
  { icon: HeartPulse, title: "Recuperación", desc: "Sueño, estrés, respiración y recuperación reunidos en un solo lugar." },
  { icon: MessageCircle, title: "Coach conectado", desc: "Check-ins y comunicación directa sin salir de KinetixFitt." },
];

const flow = [
  ["01", "Definí tu objetivo", "Contanos qué querés conseguir y cómo entrenás hoy."],
  ["02", "Seguí tu plan", "Tené tus sesiones, descansos y registros listos para cada día."],
  ["03", "Medí y ajustá", "Usá tus datos para mantener el rumbo y mejorar."],
];

const plans = [
  { name: "Básico", price: "12.000", desc: "Para empezar con una estructura clara.", items: ["Programa de entrenamiento", "Biblioteca de ejercicios", "Registro de progreso"] },
  { name: "Personalizado", price: "18.000", desc: "La experiencia central de KinetixFitt.", highlight: true, items: ["Plan adaptado a vos", "Check-ins", "Mensajes con tu coach", "Seguimiento de progreso"] },
  { name: "Premium", price: "25.000", desc: "Seguimiento más cercano y completo.", items: ["Todo lo de Personalizado", "Ajustes semanales", "Nutrición guiada", "Prioridad de atención"] },
];

export default function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#09090B] text-white">
      <SiteNav />

      <main>
        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[680px] overflow-hidden">
            <div className="absolute left-1/2 top-12 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-0 top-44 h-72 w-72 rounded-full bg-cyan-400/5 blur-3xl" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          </div>

          <div className="relative z-10 grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-12">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white/[0.03] px-3.5 py-2 text-[11px] font-black tracking-[0.18em] text-primary backdrop-blur">
                <Sparkles size={13} /> KINETIXFITT · FITNESS OS
              </div>
              <h1 className="max-w-3xl text-balance text-5xl font-black leading-[0.95] tracking-[-0.045em] sm:text-7xl lg:text-[5.8rem]">
                Entrená con intención.
                <span className="block text-primary">Progresá con datos.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
                Una experiencia única para entrenar, registrar tu progreso, cuidar tu recuperación y mantenerte conectado con tu coach.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-black text-black shadow-[0_0_40px_rgb(var(--primary)/.14)] transition hover:bg-primary-hover">
                  Empezar ahora <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
                </Link>
                <Link href="/funciones" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 text-sm font-bold text-white backdrop-blur transition hover:border-white/20 hover:bg-white/[0.06]">
                  Explorar la plataforma <Play size={15} fill="currentColor" />
                </Link>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
                {["Entrenamiento", "Nutrición", "Recuperación"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-3 text-center text-zinc-300">
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Módulo</span>
                    <span className="mt-1 block font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-5 rounded-[36px] bg-primary/8 blur-3xl" />
              <div className="relative rounded-[32px] border border-white/10 bg-[#101012]/90 p-3 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[24px] border border-white/8 bg-[#0C0C0F] p-5 sm:p-6">
                  <div className="flex items-center justify-between border-b border-white/8 pb-5">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Hoy</div>
                      <div className="mt-1 text-2xl font-black">Tu sesión</div>
                    </div>
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">Estado</div>
                      <div className="text-sm font-black">Listo</div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {["Sentadilla · 4×8", "Press banca · 4×10", "Remo · 3×10"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.025] p-3.5">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Dumbbell size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold">{item}</div>
                          <div className="mt-1 text-xs text-zinc-500">Serie {index + 1} · descanso 90s</div>
                        </div>
                        <Check size={17} className="text-zinc-500" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4">
                      <Clock3 size={17} className="text-primary" />
                      <div className="mt-3 text-xl font-black">42:18</div>
                      <div className="text-xs text-zinc-500">Tiempo activo</div>
                    </div>
                    <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4">
                      <BarChart3 size={17} className="text-primary" />
                      <div className="mt-3 text-xl font-black">+8%</div>
                      <div className="text-xs text-zinc-500">Carga vs. sesión anterior</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/6 bg-white/[0.018]">
          <div className="mx-auto grid max-w-7xl gap-px px-4 py-px sm:grid-cols-2 lg:grid-cols-3 lg:px-6">
            {pillars.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="group bg-[#09090B] px-5 py-7 sm:px-7 sm:py-8">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-primary/15 bg-primary/8 text-primary transition group-hover:border-primary/35 group-hover:bg-primary/12">
                  <Icon size={20} />
                </div>
                <h2 className="text-lg font-black tracking-tight">{title}</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-[.78fr_1.22fr]">
            <div className="lg:sticky lg:top-28">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Un sistema, no solo una app</span>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Todo conectado.</h2>
              <p className="mt-5 max-w-xl text-zinc-500 leading-7">La experiencia está pensada para que cada acción tenga continuidad: entrenás, registrás, medís y usás esa información para decidir mejor.</p>
            </div>
            <div className="grid gap-4">
              {flow.map(([n, title, desc]) => (
                <div key={n} className="group grid gap-5 rounded-3xl border border-white/8 bg-white/[0.025] p-6 sm:grid-cols-[64px_1fr] sm:p-7 transition hover:border-primary/20 hover:bg-white/[0.035]">
                  <div className="text-2xl font-black text-primary">{n}</div>
                  <div>
                    <h3 className="text-xl font-black">{title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="planes" className="border-y border-white/6 bg-white/[0.018]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Planes</span>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Elegí cómo empezar.</h2>
              <p className="mt-4 text-zinc-500">Precios en pesos argentinos. Sin permanencia.</p>
            </div>
            <div className="mx-auto mt-10 grid max-w-6xl gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.name} className={`relative rounded-3xl border p-6 sm:p-7 ${plan.highlight ? "border-primary/50 bg-primary/[0.055] shadow-[0_24px_80px_rgb(var(--primary)/.06)]" : "border-white/8 bg-[#0C0C0F]"}`}>
                  {plan.highlight && <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">Recomendado</div>}
                  <h3 className="text-xl font-black">{plan.name}</h3>
                  <p className="mt-2 text-sm text-zinc-500">{plan.desc}</p>
                  <div className="mt-7 flex items-end gap-2">
                    <span className="text-4xl font-black">${plan.price}</span>
                    <span className="pb-1 text-xs text-zinc-500">/ mes</span>
                  </div>
                  <div className="my-7 h-px bg-white/7" />
                  <ul className="space-y-3">
                    {plan.items.map((item) => <li key={item} className="flex gap-2.5 text-sm text-zinc-300"><Check size={17} className="mt-0.5 shrink-0 text-primary" />{item}</li>)}
                  </ul>
                  <Link href="/register" className={`mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full text-sm font-black ${plan.highlight ? "bg-primary text-black hover:bg-primary-hover" : "border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
                    Empezar con {plan.name}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-primary p-8 text-black sm:p-12 lg:p-16">
            <div className="absolute -right-10 -top-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
            <div className="relative max-w-3xl">
              <ShieldCheck size={24} />
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Tu progreso merece una experiencia mejor.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-black/70 sm:text-base">Entrenamiento, datos y seguimiento en una plataforma diseñada para crecer con vos.</p>
              <Link href="/register" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 text-sm font-black text-white">Crear mi cuenta <ArrowRight size={17} /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
