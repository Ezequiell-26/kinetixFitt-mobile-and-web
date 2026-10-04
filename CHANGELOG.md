## [2026-10-05] — Reliability / UX cleanup

- Corregido el request JSON roto de `AiMealPlanner` que impedía el `typecheck` móvil (TS1135).
- Añadido timeout de 20 s y cancelación de requests en `AiMealPlanner`.
- Cancelación de búsquedas obsoletas en `CommandPalettePro`.
- Añadido acceso al onboarding desde `/client/profile`.
- Eliminados destinos WhatsApp ficticios; ahora dependen de `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Sincronizados `docs/UI_UX_AUDIT.md`, `.ai/PROJECT_REALITY.md` y `docs/FEATURE_MAP.md` con el estado real.
# Changelog

Todas las versiones notables de KINETIXFITT.

## [1.0.1] - 2026-09-10 — Lote 1: persistencia de programas y asignación

### Corregido
- **Editar un programa con historial ya no falla ni borra registros**: `WorkoutLog.workoutId` pasó a opcional con `onDelete: SetNull` y se agregó `workoutName` como snapshot del nombre de la sesión. Antes, el `PUT` reventaba con error 500 por la FK Restrict cuando el programa tenía logs.
- **Guardado de programas atómico**: `POST /api/programs` y `PUT /api/programs/[id]` corren en una sola transacción (`replaceProgramWeeks` acepta el cliente de transacción). Si algo falla a mitad del guardado, el programa queda como estaba.
- **workout-logs ya no sustituye IDs silenciosamente**: un `workoutId` inexistente ahora devuelve 404 (antes se guardaba contra el primer workout de la base) y un atleta no puede registrar entrenamientos de un programa que no le fue asignado (403).
- **Un atleta sin programa asignado ve el estado "Ezequiel está diseñando tu plan"** en `/client/workout`; se eliminó el fallback que le mostraba el primer programa de la base.
- Un CLIENT ya no puede leer programas que no le fueron asignados (`GET /api/programs` y `GET /api/programs/[id]` filtran por asignación) ni autoasignarse un programa vía `PATCH /api/clients/[id]` (solo TRAINER).

### Test
- `npm run test:core`: regresión de edición de programas contra una copia de la DB (9 asserts: log sobrevive, snapshot del nombre, transacción fallida no deja estado parcial).

### Notas
- Migración `20260910143357_workoutlog_history_preserving` (no destructiva). Respaldo previo: `prisma/dev.db.backup-20260910`.
- Reiniciar el dev server para que cargue el Prisma Client regenerado.

## [1.0.0] - 2026-09-09

### Agregado
- 37 rutas, 18 modelos Prisma, 15 índices
- Auth JWT TRAINER/CLIENT con RLS real
- Dashboard trainer con charts Recharts + analíticas
- Creador Program → Fase → Semana → Día con superseries
- Experiencia entrenar con timer, RIR, vibración y guardado real
- Biblioteca 10 ejercicios, progreso con slider, fotos reales con upload
- Check-ins y mensajes 100% reales con DB
- Nutrición VIP: TDEE, macros, 1RM, hábitos, calendario
- PWA instalable Android/iOS, tema blanco/negro, offline
- Recursos VIP y WhatsApp flotante

### Seguridad
- Middleware por rol, RLS por userId, Zod, sin any

### Rendimiento
- Build 102kB, Promise.all, debounce, índices, paginación
