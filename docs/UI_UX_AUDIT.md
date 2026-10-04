# UI_UX_AUDIT.md — Auditoría UX/UI (actualizada 2026-10-05)

Auditoría sobre la app real (37 rutas, ~130 componentes, 2 roles). Estado: post-reorganización R1 (hubs Tools/Studio) y R2 (motion + iconos). Esta auditoría guía el rediseño FitSync premium.

## Problemas de navegación
- ✅ RESUELTO (R1): catálogo de funciones sin hogar → `/client/tools` (7 categorías) y `/trainer/studio` (4 tabs).
- ✅ RESUELTO: Mensajes está en el drawer móvil "Más"; el bottom-nav conserva Inicio, Entrenar, Nutrición y Progreso.
- ⚠️ El trainer tiene 10 links planos agrupados (R1) pero sin estados de sección; ok para MVP.
- ⚠️ `/client/calculators` sigue siendo una ruta heredada/redirect; mantener como compatibilidad pero no enlazarla como destino primario.

## Problemas visuales
- ✅ RESUELTO: microcopia técnica ("X MIT", "fórmulas públicas") eliminada de toda la UI (74 archivos).
- ✅ RESUELTO: emojis reemplazados por iconos lucide consistentes.
- ✅ RESUELTO: el sistema visual principal usa verde esmeralda sobre superficies azul-negras; queda trabajo pendiente solo en componentes legacy con hex hardcodeados.
- ✅ RESUELTO: superficies principales ya usan el sistema zinc/azul-negro; revisar restos legacy durante el siguiente cleanup.
- ⚠️ Botones mezclan 3 estilos de radio en componentes viejos (xl vs 2xl vs full).

## Problemas de jerarquía
- ✅ RESUELTO: dashboard cliente 370→~130 líneas con hero 2-col + módulo semanal + KPIs 4.
- ⚠️ Progreso continúa siendo la pantalla más densa; priorizar un resumen fijo y grupos colapsables para salud/cardio/datos.
- ✅ RESUELTO: TDEE/macros es el bloque dominante y las calculadoras secundarias quedaron bajo "Más calculadoras y herramientas".

## Funciones duplicadas
- ✅ RESUELTO: timers en Nutrición y Timers (solo Timers + banner link).
- ✅ RESUELTO: Achievements/Challenges/PredictivePlateau duplicados entre Dashboard y Progreso (quedaron en Progreso/Tools).
- ✅ RESUELTO: `CommandPalette` es un shim de compatibilidad que reexporta `CommandPalettePro`; existe una sola implementación.

## Funciones mal ubicadas / difíciles de encontrar
- ✅ RESUELTO: CRM/RiskML/BulkAssign/RevenuePro estaban importados y nunca montados → visibles en Studio.
- ✅ RESUELTO: Historial está disponible en el drawer móvil y en el registro de navegación.
- ✅ RESUELTO: onboarding se alcanza tras registro/login cuando corresponde y ahora también desde Mi Perfil.

## Pantallas sobrecargadas / vacías
- Sobrecargadas: Progreso (ver arriba), Nutrición (6 calculadoras al mismo nivel).
- Vacías: `/trainer/resources` y `/trainer/analytics` tienen poco contenido propio; usarlos para consolidar (RevenueAnalytics ya se movió a analytics).

## Elementos innecesarios
- ✅ RESUELTO: el botón WhatsApp ya no apunta a un número ficticio; solo aparece cuando `NEXT_PUBLIC_WHATSAPP_NUMBER` está configurado.
- Changelog visible solo para trainer: ok, mantener.

## Consistencia
- Tokens: hoy todo usa hex hardcodeados (#D6FF2A, zinc). → migrar a variables CSS (`--primary`, `--surface`...) definidas en DESIGN_SYSTEM.md; los componentes siguen Tailwind, así que el cambio se hace en globals + hex constantes.
- Tipografía: Space Grotesk (display) + Inter (texto) ya consistente.

## Responsive
- ✅ RESUELTO: cliente 640px móvil / 1100px desktop; trainer sidebar + contenido.
- ⚠️ Tablas de pagos/analytics en móvil hacen scroll horizontal → envolver en overflow-x.

## Accesibilidad
- ✅ RESUELTO: contraste del acento como texto en modo claro (#047857), focus-visible global, aria en rings/bars.
- ✅ RESUELTO: contraste del acento en los contextos auditados ya está contemplado; mantener revisión al introducir nuevos tokens.

## Rendimiento visual
- ✅ RESUELTO: dashboards livianos (componentes movidos a hubs), animaciones con `prefers-reduced-motion`.
- ⚠️ Recharts remonta en cada cambio de tab de Progreso → memoizar en R-next.

## A destacar más / a ocultar
- Destacar: Entrenamiento de hoy (ya hero), Check-in pendiente (badge), Mensajes sin leer (bell ya existe).
- Ocultar en hubs (ya hecho): gamificación, salud, cardio, datos, social, educación, sistema, studio.
