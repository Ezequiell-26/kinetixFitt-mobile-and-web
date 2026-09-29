'use client';

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { BRAND } from "@/constants/branding";

const links = [
  { href: "/funciones", labelKey: "nav.features" as const },
  { href: "/planes", labelKey: "nav.plans" as const },
  { href: "/descargar", labelKey: "nav.download" as const },
];

export function SiteNav() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#09090B]/78 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex min-h-11 items-center gap-2" aria-label={BRAND.name}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#D6FF2A] text-sm font-black text-black shadow-[0_0_26px_rgba(214,255,42,.14)]">K</span>
          <span className="text-[15px] font-black tracking-[-0.03em]">KINETIX<span className="text-[#D6FF2A]">FITT</span></span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hidden min-h-11 items-center rounded-full px-3 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white sm:inline-flex">
              {t(l.labelKey)}
            </Link>
          ))}
          <details className="relative sm:hidden">
            <summary className="list-none min-h-11 cursor-pointer rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-zinc-200 [&::-webkit-details-marker]:hidden">
              {t('nav.menu')}
            </summary>
            <div className="absolute right-0 top-[52px] w-48 rounded-2xl border border-white/10 bg-[#101012] p-2 shadow-2xl">
              {links.map((l) => <Link key={l.href} href={l.href} className="flex min-h-11 items-center rounded-xl px-3 text-sm text-zinc-200 hover:bg-white/[0.05]">{t(l.labelKey)}</Link>)}
            </div>
          </details>
          <Link href="/login" className="ml-1 inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/[0.06]">{t('auth.signIn')}</Link>
          <Link href="/register" className="hidden min-h-11 items-center justify-center rounded-full bg-[#D6FF2A] px-5 text-sm font-black text-black transition hover:bg-[#E0FF5A] sm:inline-flex">Empezar</Link>
        </nav>
      </div>
    </header>
  );
}
