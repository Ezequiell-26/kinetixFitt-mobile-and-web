import { BRAND } from "@/constants/branding";

export default function Loading() {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-[#081119]" role="status" aria-busy="true" aria-label={`Cargando ${BRAND.name}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgb(var(--primary) / 0.10),transparent_35%)]" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-5">
          <div className="absolute -inset-5 rounded-[1.9rem] border border-primary/10 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <div className="absolute -inset-2 rounded-[1.5rem] bg-primary/10 blur-2xl animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.35rem] border border-primary/30 bg-[#0B151E] shadow-[0_0_60px_rgb(var(--primary) / 0.20)]">
            <img src="/brand/kinetixfitt-mark.svg" alt="" className="h-11 w-11" />
          </div>
        </div>
        <p className="font-display text-xl font-black tracking-tight text-white">{BRAND.name}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8193A5]">Cargando tu experiencia</p>
        <div className="mt-7 h-1 w-48 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true"><div className="h-full w-1/2 rounded-full bg-primary animate-pulse motion-reduce:animate-none" /></div>
        <p className="mt-3 text-[11px] text-[#55697A]">Preparando datos y navegación</p>
      </div>
    </div>
  );
}
