/**
 * Registro canónico de destinos de navegación.
 * Única fuente de verdad para: palette de comandos, tracker de recientes,
 * favoritos y drawer "Más". Entry = ubicación canónica (href estable).
 */
import type { PrefEntry } from "@/lib/user-prefs";

export type NavEntry = PrefEntry & { group: string; desc?: string };

export const CLIENT_NAV: NavEntry[] = [
  { href: "/client/dashboard", label: "Inicio", group: "Navegación", desc: "Entrenamiento de hoy y tu progreso" },
  { href: "/client/workout", label: "Entrenar", group: "Navegación", desc: "Plan de la semana y sesiones" },
  { href: "/client/calendar", label: "Calendario", group: "Navegación", desc: "Citas y disponibilidad" },
  { href: "/client/nutrition", label: "Nutrición", group: "Navegación", desc: "Macros, alimentos y hábitos" },
  { href: "/client/progress", label: "Progreso", group: "Navegación", desc: "Peso, cargas, medidas y fotos" },
  { href: "/client/messages", label: "Mensajes", group: "Navegación", desc: "Chat con tu coach" },
  { href: "/client/checkins", label: "Check-ins", group: "Navegación", desc: "Tu reporte semanal" },
  { href: "/client/history", label: "Historial", group: "Navegación", desc: "Todas tus sesiones" },
  { href: "/client/timers", label: "Cronómetros", group: "Herramientas", desc: "Tabata, EMOM, Pomodoro" },
  { href: "/client/achievements", label: "Logros & XP", group: "Navegación", desc: "Nivel, desafíos y medallas" },
  { href: "/client/tools?cat=gamificacion", label: "Juegos & XP", group: "Herramientas", desc: "RPG, tienda y challenges" },
  { href: "/client/tools?cat=salud", label: "Salud & Recuperación", group: "Herramientas", desc: "Sueño, breathing, healthbox" },
  { href: "/client/tools?cat=cardio", label: "Cardio & Outdoor", group: "Herramientas", desc: "Run tracker y GPX" },
  { href: "/client/tools?cat=datos", label: "Datos & Integraciones", group: "Herramientas", desc: "Export, import Hevy, OpenScale" },
  { href: "/client/tools?cat=social", label: "Social & Comunidad", group: "Herramientas", desc: "Compartir y referidos" },
  { href: "/client/tools?cat=educacion", label: "Educación", group: "Herramientas", desc: "Wiki de KinetixFitt" },
  { href: "/client/tools?cat=sistema", label: "Sistema & App", group: "Herramientas", desc: "Instalar, push, calendarios" },
  { href: "/client/profile", label: "Perfil", group: "Cuenta", desc: "Tus datos y plan" },
  { href: "/client/settings", label: "Ajustes", group: "Cuenta", desc: "Tema y preferencias" },
];

export const TRAINER_NAV: NavEntry[] = [
  { href: "/trainer/dashboard", label: "Dashboard", group: "Operación", desc: "Pendientes de hoy" },
  { href: "/trainer/clients", label: "Clientes", group: "Operación", desc: "Listado completo" },
  { href: "/trainer/clients/new", label: "Crear cliente", group: "Acciones", desc: "Alta rápida" },
  { href: "/trainer/checkins", label: "Check-ins", group: "Operación", desc: "Revisión semanal" },
  { href: "/trainer/messages", label: "Mensajes", group: "Operación", desc: "Chat con atletas" },
  { href: "/trainer/workouts", label: "Entrenamientos", group: "Contenido", desc: "Programas y rutinas" },
  { href: "/trainer/exercises", label: "Ejercicios", group: "Contenido", desc: "Biblioteca de 100 ejercicios" },
  { href: "/trainer/resources", label: "Recursos", group: "Contenido", desc: "Material para atletas" },
  { href: "/trainer/analytics", label: "Analíticas", group: "Negocio", desc: "Adherencia e ingresos" },
  { href: "/trainer/payments", label: "Pagos", group: "Negocio", desc: "Suscripciones" },
  { href: "/trainer/studio", label: "Studio", group: "Negocio", desc: "CRM, riesgo y automatismos" },
  { href: "/trainer/changelog", label: "Novedades", group: "Sistema", desc: "Cambios recientes de la app" },
  { href: "/trainer/settings", label: "Ajustes", group: "Sistema", desc: "Preferencias" },
];

export function navForRole(role: "client" | "trainer"): NavEntry[] {
  return role === "client" ? CLIENT_NAV : TRAINER_NAV;
}
