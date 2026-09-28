import Link from "next/link";
import { BRAND } from "@/constants/branding";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/7 bg-[#08080A]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs text-black">K</span>
            KINETIX<span className="text-primary">FITT</span>
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">Entrenamiento, nutrición, recuperación y seguimiento en una sola experiencia.</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4 lg:grid-cols-5">
          <Link href="/funciones" className="min-h-10 inline-flex items-center text-zinc-400 transition hover:text-white">Funciones</Link>
          <Link href="/planes" className="min-h-10 inline-flex items-center text-zinc-400 transition hover:text-white">Planes</Link>
          <Link href="/descargar" className="min-h-10 inline-flex items-center text-zinc-400 transition hover:text-white">Descargar</Link>
          <Link href="/login" className="min-h-10 inline-flex items-center text-zinc-400 transition hover:text-white">Ingresar</Link>
          <Link href="/register" className="min-h-10 inline-flex items-center font-bold text-primary transition hover:text-primary-hover">Crear cuenta</Link>
        </nav>
      </div>
      <div className="border-t border-white/6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} {BRAND.name}. Todos los derechos reservados.</span>
          <span>{BRAND.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
