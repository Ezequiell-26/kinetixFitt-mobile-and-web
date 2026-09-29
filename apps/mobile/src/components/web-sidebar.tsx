"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Apple, BarChart3, BookOpen, CreditCard, Dumbbell, FileText, Footprints, Gamepad2, HeartPulse, Home, LayoutDashboard, LayoutGrid, LogOut, Menu, MessageCircle, Search, Settings, Settings2, Timer, TrendingUp, Trophy, User, Users, Wrench, X, ClipboardCheck, Clock, Loader2, CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/notifications-bell";
import { CommandPalettePro } from "@/components/command-palette-pro";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/constants/branding";

type NavLink = { href: string; label: string; icon: LucideIcon; badge?: string };
type NavGroup = { label: string; links: NavLink[] };

const clientNavGroups: NavGroup[] = [
  { label: "Principal", links: [
    { href: "/client/dashboard", label: "Dashboard", icon: Home },
    { href: "/client/workout", label: "Entrenamientos", icon: Dumbbell },
    { href: "/client/calendar", label: "Calendario", icon: CalendarDays },
    { href: "/client/nutrition", label: "Nutrición", icon: Apple },
    { href: "/client/progress", label: "Progreso", icon: TrendingUp },
  ] },
  { label: "Seguimiento", links: [
    { href: "/client/checkins", label: "Check-ins", icon: ClipboardCheck },
    { href: "/client/history", label: "Historial", icon: Clock },
    { href: "/client/achievements", label: "Logros & XP", icon: Trophy },
  ] },
  { label: "Herramientas", links: [
    { href: "/client/tools", label: "Centro de herramientas", icon: LayoutGrid },
    { href: "/client/tools?cat=gamificacion", label: "Juegos & XP", icon: Gamepad2 },
    { href: "/client/tools?cat=salud", label: "Salud", icon: HeartPulse },
    { href: "/client/tools?cat=cardio", label: "Cardio", icon: Footprints },
    { href: "/client/tools?cat=datos", label: "Datos", icon: BarChart3 },
    { href: "/client/tools?cat=social", label: "Social", icon: Users },
    { href: "/client/tools?cat=sistema", label: "Sistema", icon: Settings2 },
    { href: "/client/timers", label: "Cronómetros", icon: Timer, badge: "PRO" },
    { href: "/client/resources", label: "Recursos VIP", icon: BookOpen },
  ] },
  { label: "Comunicación", links: [{ href: "/client/messages", label: "Mensajes", icon: MessageCircle }] },
  { label: "Cuenta", links: [
    { href: "/client/profile", label: "Mi Perfil", icon: User },
    { href: "/client/settings", label: "Ajustes", icon: Settings },
  ] },
];

const trainerNavGroups: NavGroup[] = [
  { label: "Principal", links: [
    { href: "/trainer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trainer/clients", label: "Clientes", icon: Users },
    { href: "/trainer/checkins", label: "Check-ins", icon: ClipboardCheck },
    { href: "/trainer/messages", label: "Mensajes", icon: MessageCircle },
  ] },
  { label: "Entrenamiento", links: [
    { href: "/trainer/workouts", label: "Entrenamientos", icon: Dumbbell },
    { href: "/trainer/exercises", label: "Ejercicios", icon: Activity },
    { href: "/trainer/resources", label: "Recursos", icon: BookOpen },
  ] },
  { label: "Negocio", links: [
    { href: "/trainer/analytics", label: "Analíticas", icon: BarChart3 },
    { href: "/trainer/payments", label: "Pagos", icon: CreditCard },
    { href: "/trainer/studio", label: "Studio", icon: Wrench },
  ] },
  { label: "Sistema", links: [
    { href: "/trainer/changelog", label: "Novedades", icon: FileText, badge: "NUEVO" },
    { href: "/trainer/settings", label: "Ajustes", icon: Settings },
  ] },
];

interface WebSidebarProps {
  role: "CLIENT" | "TRAINER";
  userName?: string | null;
  _userAvatar?: string | null;
  children?: React.ReactNode;
}

export function WebSidebar({ role, userName, children }: WebSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const navGroups = role === "CLIENT" ? clientNavGroups : trainerNavGroups;
  const dashboardHref = role === "CLIENT" ? "/client/dashboard" : "/trainer/dashboard";
  const searchKey = searchParams.toString();
  const currentHref = `${pathname}${searchKey ? `?${searchKey}` : ""}`;

  useEffect(() => setNavigating(false), [pathname, searchKey]);
  useEffect(() => {
    if (!navigating) return;
    const id = window.setTimeout(() => setNavigating(false), 10000);
    return () => window.clearTimeout(id);
  }, [navigating]);

  function startNavigation(href: string, closeMobile = false) {
    if (href !== currentHref) setNavigating(true);
    if (closeMobile) setMobileOpen(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const avatarInitial = (userName || "U").trim().charAt(0).toUpperCase() || "U";
  const mobilePrimaryNav: NavLink[] = role === "CLIENT"
    ? [
        { href: "/client/dashboard", label: "Inicio", icon: Home },
        { href: "/client/workout", label: "Entrenar", icon: Dumbbell },
        { href: "/client/progress", label: "Progreso", icon: TrendingUp },
        { href: "/client/messages", label: "Mensajes", icon: MessageCircle },
      ]
    : [
        { href: "/trainer/dashboard", label: "Inicio", icon: LayoutDashboard },
        { href: "/trainer/clients", label: "Clientes", icon: Users },
        { href: "/trainer/workouts", label: "Entrenar", icon: Dumbbell },
        { href: "/trainer/messages", label: "Mensajes", icon: MessageCircle },
      ];
  const isActive = (href: string) => {
    const [basePath, query] = href.split("?");
    if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) return false;
    if (!query) return pathname === basePath && searchParams.toString() === "";
    const expected = new URLSearchParams(query);
    for (const [key, value] of expected.entries()) if (searchParams.get(key) !== value) return false;
    return true;
  };

  const renderNav = (mobile = false) => (
    <nav className={mobile ? "space-y-5" : "space-y-6"} aria-label={mobile ? "Menú móvil" : "Navegación principal"}>
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">{group.label}</p>
          <ul className="space-y-1">
            {group.links.map((link) => {
              const active = isActive(link.href);
              return <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} onClick={() => startNavigation(link.href, mobile)} aria-current={active ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${active ? "border-primary/20 bg-primary/10 text-primary shadow-[0_0_24px_rgba(214,255,42,0.08)]" : "border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"}`}>
                  <link.icon size={18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0 transition-transform group-hover:scale-105" />
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  {link.badge && <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${link.badge === "NUEVO" ? "bg-violet-500 text-white" : "bg-primary text-black"}`}>{link.badge}</span>}
                </Link>
              </li>;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return <div className="min-h-screen overflow-x-clip bg-[#080D11]">
    <OfflineIndicator />
    <header className="sticky top-0 z-40 h-16 border-b border-white/[0.06] bg-[#080D11]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => setMobileOpen((open) => !open)} className="-ml-2 rounded-lg p-2 text-zinc-400 transition hover:bg-white/[0.04] hover:text-white lg:hidden" aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <Link href={dashboardHref} onClick={() => startNavigation(dashboardHref)} className="group flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-[#0C1115] shadow-[0_0_30px_rgba(214,255,42,0.12)]"><img src="/brand/kinetixfitt-mark.svg" alt="" className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" /></span>
            <span className="hidden min-w-0 sm:block"><span className="block font-display text-sm font-black tracking-tight text-white">{BRAND.name}</span><span className="block truncate text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">{role === "CLIENT" ? "Panel de Cliente" : "Panel de Entrenador"}</span></span>
          </Link>
        </div>
        <div className="hidden w-full max-w-md items-center justify-center lg:flex"><CommandPalettePro role={role === "CLIENT" ? "client" : "trainer"} /></div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2"><ThemeToggle /><NotificationsBell /><div className="hidden items-center gap-2 border-l border-white/[0.07] pl-3 md:flex"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-black text-primary">{avatarInitial}</span><span className="max-w-[120px] truncate text-xs font-semibold text-zinc-300">{userName}</span></div><button onClick={handleLogout} className="ml-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-white" title="Cerrar sesión"><LogOut size={15} /><span className="hidden sm:inline">Salir</span></button></div>
      </div>
    </header>

    <div className="flex min-h-[calc(100vh-64px)] min-w-0">
      <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-72 shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] bg-[#080D11]/70 backdrop-blur-sm lg:flex"><div className="flex-1 px-3 py-5">{renderNav()}</div><div className="border-t border-white/[0.06] p-4">
        {role === "CLIENT" && <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/[0.035] p-3.5"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Trophy size={16} /></span><div><p className="text-xs font-black text-white">Plan Pro</p><p className="text-[10px] text-zinc-500">Acceso completo a herramientas</p></div></div><Link href="/client/resources" className="mt-3 flex h-9 items-center justify-center rounded-xl border border-primary/30 text-[11px] font-bold text-primary transition hover:bg-primary/10">Ver beneficios</Link></div>}
        <div className="mb-3 flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-black text-primary">{avatarInitial}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{userName}</p><p className="truncate text-xs text-zinc-500">{role === "CLIENT" ? "Atleta" : "Entrenador"}</p></div></div><button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"><LogOut size={16} /> Cerrar sesión</button>
      </div></aside>
      <main className="min-w-0 flex-1 bg-transparent"><div className="mx-auto w-full max-w-[1600px] px-4 py-5 pb-24 sm:px-6 sm:py-6 sm:pb-24 lg:px-8 lg:pb-6">{children}</div></main>
    </div>

    {mobileOpen && <><button type="button" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" /><aside className="fixed inset-y-0 left-0 z-[51] w-[min(88vw,22rem)] overflow-y-auto border-r border-white/[0.07] bg-[#080D11] shadow-2xl lg:hidden"><div className="p-4 pt-5"><div className="mb-6 flex items-center justify-between"><Link href={dashboardHref} onClick={() => startNavigation(dashboardHref, true)} className="flex items-center gap-2 font-display font-bold text-white"><img src="/brand/kinetixfitt-mark.svg" alt="" className="h-8 w-8" />{BRAND.name}</Link><button onClick={() => setMobileOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400" aria-label="Cerrar menú"><X size={18} /></button></div>{renderNav(true)}<button onClick={handleLogout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-white"><LogOut size={16} /> Cerrar sesión</button></div></aside></>}

    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#080D11]/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:hidden" aria-label="Navegación rápida">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {mobilePrimaryNav.map((link) => {
          const active = isActive(link.href);
          return <Link key={link.href} href={link.href} onClick={() => startNavigation(link.href, false)} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors", active ? "bg-primary/10 text-primary" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200")}>
            <link.icon size={18} strokeWidth={active ? 2.3 : 1.8} />
            <span className="truncate">{link.label}</span>
          </Link>;
        })}
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menú completo" className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200", mobileOpen && "bg-white/[0.05] text-white")}>
          <Menu size={18} />
          <span>Menú</span>
        </button>
      </div>
    </nav>

    {navigating && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#080D11]/95 px-6 backdrop-blur-md" role="status" aria-live="polite" aria-busy="true" aria-label={`Cargando ${BRAND.name}`}><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(214,255,42,0.10),transparent_34%)]" /><div className="relative flex w-full max-w-xs flex-col items-center text-center"><div className="relative mb-5"><div className="absolute -inset-5 rounded-[1.9rem] border border-primary/10 animate-pulse motion-reduce:animate-none" /><div className="absolute -inset-2 rounded-[1.5rem] bg-primary/10 blur-2xl animate-pulse motion-reduce:animate-none" /><div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.35rem] border border-primary/35 bg-[#0C1115] shadow-[0_0_60px_rgba(214,255,42,0.2)]"><img src="/brand/kinetixfitt-mark.svg" alt="" className="h-11 w-11" /></div></div><p className="font-display text-xl font-black tracking-tight text-white">{BRAND.name}</p><div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500"><Loader2 size={11} className="animate-spin motion-reduce:animate-none" /><span>Preparando panel</span></div><div className="mt-7 h-1 w-48 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-1/2 rounded-full bg-primary animate-pulse motion-reduce:animate-none" /></div><p className="mt-3 text-[11px] text-zinc-600">Cargando datos y navegación</p></div></div>}
  </div>;
}