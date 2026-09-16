# KinetixFitt — Project Reality

Última actualización: 2026-09-17.

Este archivo es un mapa operativo, no una promesa de producción. El código, las migraciones y los checks vivos son la fuente de verdad.

## Estado global

- `main` es la rama operativa para los cambios de lanzamiento solicitados.
- Prisma usa PostgreSQL (`DATABASE_URL` + `DIRECT_URL`).
- Monorepo con `apps/mobile`, `apps/web`, `apps/desktop` y paquetes compartidos.
- `apps/web` y `apps/mobile` se despliegan como proyectos separados.
- No afirmar `PRODUCTION READY`, `VERIFIED`, `AI-powered` o `COMPLETE` sin evidencia actual.

## Deployment

- `apps/web` se despliega como proyecto Vercel independiente usando el `vercel.json` raíz.
- `apps/mobile` contiene la app dinámica y la API y tiene `apps/mobile/vercel.json` para un segundo proyecto Vercel.
- La configuración de checkout y Capacitor usa URLs confiables configuradas por entorno, no hosts arbitrarios de requests.
- El estado externo de Vercel requiere verificación; los status checks previos mostraron `build-rate-limit`.

## Web

- Landing `/es` y `/en` implementada con navegación, CTA, metadata, sitemap y robots.
- `apps/web/auth/login`, `apps/web/auth/register` y `apps/web/dashboard` ya no contienen autenticación o métricas simuladas; derivan al producto vivo.
- La homepage y SEO no deben usar ratings, usuarios, retención, rankings, reviews, precios o escasez inventados.
- Structured data de producto solo incluye `offers` y `aggregateRating` cuando los datos se suministran explícitamente.

## Auth / Seguridad

- Passwords con bcrypt.
- JWT HS256 + sesión persistente en DB.
- `getSession()` valida firma y sesión persistente.
- Logout revoca sesión; logout global revoca todas.
- Password reset usa `PasswordResetToken`, SHA-256, expiración y consumo atómico; invalida sesiones existentes al cambiar contraseña.
- Rate limiting intenta Upstash Redis distribuido y usa fallback local para desarrollo/degradación.
- El guard anti-fuerza-bruta por cuenta también usa Redis cuando está disponible.
- `getClientIp()` solo confía en forwarded headers con `TRUST_PROXY_HEADERS=true`.
- Registro, login y recuperación usan la política central de IP.
- Health/readiness no devuelven excepciones, env faltantes ni metadata interna innecesaria.
- Uploads usan allowlists, magic bytes y serving autenticado.
- `/api/push/send` requiere `KINETIX_INTERNAL_API_SECRET` y admite IDs CUID reales.
- Backups requieren identidades incluidas en `BACKUP_ADMIN_USER_IDS`.
- `.env` NO debe versionarse. Solo ejemplos sin credenciales.
- Toda API que use `clientId` debe verificar ownership server-side.

## Multi-trainer

- `Client.trainerId` define propiedad.
- `assertTrainerOwnsClient()` es la guardia central.
- Mensajes, check-ins, pagos, workout logs, mediciones, fotos, analytics y automatizaciones deben respetar ownership.
- La automatización `/api/automation/risk` solo consulta la cartera del trainer autenticado.

## Database

- PostgreSQL authoritative.
- Relaciones principales usan `onDelete` explícito.
- `PaymentWebhookEvent` tiene unique `(provider, eventId)`.
- Program replacement valida y limita el payload ANTES de borrar semanas existentes.
- No commitear `dev.db`, `.next`, `.tsbuildinfo`, uploads ni artefactos locales.

## Payments

- Registro manual de pagos usa `/api/payments`.
- Checkout de Stripe y Mercado Pago está implementado a nivel de servidor.
- URLs de checkout y webhook se construyen desde configuración confiable.
- Webhooks Stripe y Mercado Pago exigen firma.
- Los eventos se reclaman mediante insert atómico y el claim se elimina si el procesamiento falla para permitir retry seguro.
- Mercado Pago consulta el pago real antes de liquidarlo y requiere access token configurado.
- Los pagos asociados a un `Payment` existente pueden resolver `clientId` y renovar la suscripción.
- `GET /api/payments/webhook` no expone proveedores y devuelve 405.
- E2E de proveedores externos sigue UNVERIFIED hasta probar con credenciales y webhooks reales.

## Training / Progress

- Workout logs reales con sets, fecha, duración y comentarios.
- Resúmenes calculan sesiones, streak, PRs, adherencia y analytics desde DB.
- Calendar muestra historial real y debe evolucionar hacia sesiones programadas/eventos.
- Importación Hevy/Strong crea logs históricos mediante API; debe seguir validando duplicados/mapeos.

## AI

- `KinetixFitt AI` tiene endpoint autenticado `/api/ai/chat`.
- Proveedor configurable mediante `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` o aliases OpenAI/GLM.
- Rate limit por usuario y timeout del proveedor están implementados.
- El endpoint limita entrada/contexto y no devuelve errores internos del proveedor.
- Si no hay credenciales, responde que la IA no está configurada y no inventa respuestas.
- Form Check NO muestra scores ficticios; requiere un modelo real de pose.
- Inferencia on-device, vision avanzada y tool-calling persistente siguen UNVERIFIED/PARTIAL.

## Trainer automation

- Risk/Auto-Messages calcula riesgo usando `Client`, `WorkoutLog` y `CheckIn` reales.
- El botón Enviar utiliza `/api/messages` y comprueba ownership en servidor.
- No hay nombres de clientes ni métricas hardcodeadas en ese flujo.
- Automatizaciones avanzadas, cohortes y MRR/LTV siguen parciales.

## Health / Wearables

- HealthBox no muestra números simulados.
- Mientras no haya un conector real de HealthKit/Health Connect/wearable verificado, muestra `No conectado`.
- La integración de wearables sigue UNVERIFIED.

## Notifications / Messaging

- Mensajes limitados al coach asignado y cliente propietario.
- Check-ins y workout completions notifican al `trainerId` real.
- Push subscriptions y preferencias existen.
- La entrega end-to-end requiere pruebas por plataforma.

## Offline

- Cola local limitada a 200 operaciones y 256 KB por elemento.
- Reintentos acotados a 3.
- Errores 4xx permanentes se descartan para evitar loops.
- El conflicto multi-dispositivo y la idempotencia server-side completa siguen pendientes.

## Native / PWA / 3D

- PWA existe.
- Android/iOS usan Capacitor como wrappers online contra `CAPACITOR_SERVER_URL`.
- Capacitor ahora usa `apps/mobile/native-shell` como `webDir`, por lo que no empaqueta automáticamente el árbol completo de `public/` (incluyendo ejercicios, audio o vídeos) dentro del paquete nativo.
- Windows/macOS tienen un shell Tauri 2 separado en `apps/desktop` que carga `https://app.kinetixfitt.com` en producción y no incrusta los assets de la web; Electron se conserva como fallback de transición.
- Tauri permite usar una URL remota como `frontendDist` sin assets embebidos. citeturn221957search1turn979271search7
- Android de producción tiene workflow de AAB firmado basado en GitHub Secrets.
- Packaging Android/iOS/macOS/Windows end-to-end sigue UNVERIFIED hasta generar y probar artefactos reales.
- 3D usa Three.js/WebGL; no afirmar WebGPU/Web Workers/OffscreenCanvas sin implementación y medición.

## Quality gates

- CI ejecuta install, typecheck, lint, migrations, seed, unit tests, build mobile, security HTTP E2E y build web.
- El workflow nativo genera Windows/macOS con Tauri y Android/iOS con Capacitor.
- `npm run test:unit` es la suite offline/unittest.
- `npm run test:security` requiere un servidor Next real.
- La suite de seguridad usa fixtures aisladas y no cuentas demo.
- Para cambios importantes: READ → SEARCH → MAP IMPACT → PLAN → CHANGE → TEST → REVIEW DIFF → RE-TEST → DOCUMENT → COMMIT.
- CI vivo y Vercel deben consultarse después de cambios; no asumir que un check anterior sigue verde.

## Riesgos abiertos reales

1. Vercel requiere que la cuenta/entorno de despliegue supere el límite de build y que los dos proyectos se configuren realmente.
2. Integraciones externas de Stripe/Mercado Pago, email, push, storage S3/R2 y AI requieren credenciales reales para E2E.
3. Falta completar la pirámide E2E de journeys completos.
4. Falta terminar sincronización offline real y resolución de conflictos.
5. Community, automatizaciones avanzadas y varias capacidades de IA siguen parciales.
6. Native packaging y releases de stores siguen sin verificación end-to-end; esta optimización debe medirse con los artefactos generados en CI.
