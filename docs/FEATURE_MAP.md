# FEATURE_MAP.md — Inventario real de funcionalidades

Leyenda de estado: ✅ montada y funcional · 📦 reubicada en hub · 🧩 parcial · 💤 import muerto eliminado (ex-código oculto, hoy visible) · 🔜 propuesto.

## CLIENTE

| Función | Qué hace | Dónde vive | Estado |
|---|---|---|---|
| Entrenamiento de hoy | hero con plan, series, CTA | /client/dashboard | ✅ |
| Sesión + logging | timer 90s, RIR/RPE, gym-mode, PRs, velocity, form-check, voice | /client/workout/[id] | ✅ |
| Plan semanal | semanas/días/ejercicios asignados | /client/workout | ✅ |
| Generador de sesión | workout.lol MIT, biblioteca local | /client/workout (abajo) | ✅ |
| Strong templates | plantillas 5/3/1 etc. | /client/workout | ✅ |
| Progreso | peso, cargas, medidas, fotos privadas, charts reales | /client/progress | ✅ |
| Wearables BT | conexión de dispositivos compatibles | Progreso → tab Wearables | 🧩 (requiere dispositivo real) |
| Mapa muscular / PRs / mesetas | volumen por músculo real, PRs por sesión | /client/progress | ✅ |
| LiftShift analytics | volumen/1RM/adherencia semanal reales | /client/progress | ✅ |
| Check-ins | 8 preguntas + fotos + respuesta del coach | /client/checkins | ✅ |
| Mensajes | chat real con fotos/archivos | /client/messages | ✅ |
| Nutrición | TDEE/macros/agua/IMC + calculadoras PRO + alimentos + hábitos | /client/nutrition | ✅ |
| Cronómetros | Tabata/EMOM/Pomodoro (dedicada) | /client/timers | ✅ |
| Gamificación | RPG XP, tienda, challenges, logros, calendario | /client/tools (Juegos & XP) | 📦 |
| Salud | sueño, healthbox, breathing | /client/tools (Salud) | 📦 |
| Cardio | run + GPX | /client/tools (Cardio) | 📦 |
| Datos | export CSV/PDF, import Hevy, OpenScale | /client/tools (Datos) | 📦 |
| Social | compartir progreso, referidos | /client/tools (Social) | 📦 |
| Educación | wiki interna | /client/tools (Educación) | 📦 |
| Sistema | PWA install, push, calendarios, onboarding video | /client/tools (Sistema) | 📦 |
| IA Coach | chat con contexto del programa | /client/dashboard + nutrición | ✅ (🔜 capa post-entreno) |
| Historial | sesiones pasadas | /client/history | ✅ (también en drawer Más) |
| Onboarding guiado | flow de configuración | /client/onboarding | ✅ (también desde Perfil) |
| Favoritos / Recientes | marcado de funciones | /client/tools + paleta | ✅ |

## TRAINER

| Función | Dónde | Estado |
|---|---|---|
| Dashboard operación (KPIs animados, atención necesaria) | /trainer/dashboard | ✅ |
| Clientes CRUD + ficha 6 tabs | /trainer/clients | ✅ |
| Programas create/edit atómicos + assign | /trainer/workouts + assign-program | ✅ (test 9/9) |
| Ejercicios (100, biblioteca real) | /trainer/exercises | ✅ |
| Check-ins review + AI | /trainer/checkins | ✅ |
| Mensajes | /trainer/messages | ✅ |
| Analíticas reales + Revenue | /trainer/analytics | ✅ |
| Pagos/suscripciones | /trainer/payments | ✅ |
| Studio: CRM, Risk ML, auto-mensajes, programación masiva, kits plataformas, revenue pro | /trainer/studio | ✅ |
| Recursos | /trainer/resources | ✅ |
| Live session, export, changelog | dashboard / changelog | ✅ |

## Transversales
Auth JWT por roles ✅ · PWA instalable ✅ · Electron wrapper ✅ · tema claro/oscuro ✅ · búsqueda ⌘K ✅ · notificaciones ✅ · persistencia de programas con historial preservado + tests ✅.

## Deuda conocida (documentada, no oculta)
- Uploads privados: almacenamiento canónico en `storage/uploads` y serving mediante rutas autenticadas; validar E2E con usuario propietario/no propietario antes del release.
- Fotos de la referencia (pasos/calorías/sueño) sin fuente de datos real → no se inventan.
- Store de reset-password en memoria (dev-only, documentado).
- Tooltips de charts dark en tema claro.
