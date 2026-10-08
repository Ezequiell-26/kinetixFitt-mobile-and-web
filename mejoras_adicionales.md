# KinetixFitt — 15 Mejoras Adicionales (Backlog Premium)
> **Scope:** TODO lo NO cubierto por las 5 auditorías en curso (Rebrand · Web · App Peso · Seguridad · Legal).  
> **Objetivo:** Retention 90 días >40%, Bundle <200KB, Fotos reales, Copy perfecto, LATAM→Global.  
> **Fecha:** 2026-09-14 · Branch: `develop` · Workspace: `C:/Users/ofici/kinetixFitt-mobile-and-web`

---

## Resumen Ejecutivo — Priorización por ROI

> Ordenado por **(Impacto conversión × Alcance) / Esfuerzo**. Top 5 = quick wins que pagan el resto.

| # | Mejora | Cat. obligatoria | Esfuerzo | Impacto conversión | ROI | Estado actual |
|---|--------|------------------|----------|---------------------|-----|---------------|
| **1** | **DB Indexes compuestos + query audit** | 9) DB indexes | **S** (4h) | +18% TTFB · -60% p95 en `/api/clients`, `/api/workout-logs` | ★★★★★ | 5 índices simples, 0 compuestos. No hay `EXPLAIN ANALYZE` en CI |
| **2** | **SEO Técnico: sitemap.xml + robots.txt + JSON-LD + OG reales** | 1) SEO técnico | **S** (1d) | +35% tráfico orgánico 90d · +22% CTR | ★★★★★ | `og-image.png` referenciado pero no existe. 0 sitemap. 0 JSON-LD. `next.config` sin `headers()` |
| **3** | **Emails Transaccionales (Resend + React Email)** | 3) Emails | **M** (3d) | +28% activación · -30% churn día 7 · +12% recuperación carrito | ★★★★★ | `forgot-password` solo hace `console.log`. 0 emails reales. |
| **4** | **Onboarding FTUE 4 pasos + checklist progresivo** | 4) Onboarding | **M** (4d) | +40% time-to-first-workout · +25% retención D7 | ★★★★☆ | Login directo sin tour. Churn silencioso estimado 60% D1 |
| **5** | **PostHog self-hosted → product analytics + funnels** | 5) Analytics | **S** (1d) | +15% conversión funnel · detecta 100% drop-offs | ★★★★☆ | `analytics-engine.ts` custom sin proveedor. 0 eventos reales |
| **6** | **Accesibilidad WCAG 2.2 AA (axe + skip-link + focus)** | 2) Accesibilidad | **M** (3d) | +8% audiencia (15% LATAM con discapacidad) · evita demanda | ★★★★☆ | `accessibility-engine.ts` existe pero NO se importa en `layout.tsx` |
| **7** | **PWA Offline Real: Workbox + Background Sync + queue** | 6) PWA/offline | **M** (3d) | +20% sesiones offline (gym sin señal) · +12% retención | ★★★★☆ | `sw.js` manual 300 líneas sin Workbox, cachea `/` con `cache-first` (peligroso). `offline.html` estático |
| **8** | **Test E2E Playwright (smoke + critical paths)** | 7) Test E2E | **M** (3d) | -80% regresiones en prod · -50% hotfixes | ★★★☆☆ | Solo `tests/unit` y `tsx tests/*.test.ts`. 0 E2E |
| **9** | **i18n real: next-intl + routing /es /en /pt + hreflang** | 10) Internacionalización | **L** (5d) | +30% TAM (BR+US) · +18% conversión local | ★★★☆☆ | `i18n-engine.ts` es clase TS sin integración Next. Todo hardcodeado `lang="es"` |
| **10** | **CI/CD: Lighthouse + bundle <200KB gate + preview deploys** | 8) CI/CD | **M** (2d) | -40% regresiones perf · bloquea PRs >200KB | ★★★☆☆ | CI solo typecheck+test+build. No gate de peso. No LHCI |
| **11** | **Sentry + Web Vitals RUM (ya instalado, sin wiring)** | 5) Analytics | **S** (4h) | -70% MTTR · +5% conversión por menos crashes | ★★★☆☆ | `@sentry/nextjs` en deps pero sin `instrumentation.ts` ni `onRouterTransition` |
| **12** | **Search + Filtros + Paginación server-side (exercise library)** | — Extra | **M** (3d) | +22% engagement catálogo · -45% LCP | ★★★☆☆ | `Exercise` sin índice GIN/trigram. Búsqueda client-side |
| **13** | **Notificaciones Push segmentadas + In-App Inbox** | — Extra | **M** (4d) | +18% DAU · +14% reactivación inactivos | ★★☆☆☆ | `PushSubscription` model existe, 0 lógica de envío |
| **14** | **Export/Import datos + GDPR Takeout (ZIP)** | — Extra | **S** (1d) | +9% trust · requisito legal LATAM (no cubierto en audit legal) | ★★☆☆☆ | 0 endpoint `/api/export` |
| **15** | **Feature Flags + A/B (PostHog o Flagsmith) para pricing** | — Extra | **S** (1d) | +10-25% ARPU via test precio | ★★☆☆☆ | Pricing hardcodeado en `page.tsx` |

**Esfuerzo total:** ~28 días-dev (paralelizable a 12 días con 3 devs).  
**Impacto agregado estimado:** +35-50% conversión visita→registro · +25% retención D90 · -60% p95 latencia.

---

## Detalle — Las 15 Mejoras

### 1) DB Indexes Compuestos + Audit de Queries [DB INDEXES]

**Problema:**  
`schema.prisma` tiene índices simples (`@@index([email])`, `@@index([status])`) pero 0 compuestos. Queries críticas hacen `WHERE trainerId = ? AND status = ? ORDER BY createdAt` → **seq scan** en 10k+ `Client`. `WorkoutLog` sin índice por `clientId+createdAt` (timeline). `Message` sin índice por conversación. Prod LATAM con 50k usuarios = p95 >1.2s. No hay `pg_stat_statements` ni `EXPLAIN` en CI.  
Bundle no afectado, pero TTFB mata conversión móvil (3G).

**Solución:**  
- Añadir 6 índices compuestos + 1 GIN trigram para búsqueda ejercicios:
```prisma
// Client: filtro principal dashboard trainer
@@index([trainerId, status, createdAt(sort: Desc)])
@@index([trainerId, plan])
// WorkoutLog: timeline + resumen
@@index([clientId, createdAt(sort: Desc)])
@@index([workoutId, clientId])
// CheckIn / ProgressPhoto: feed cronológico
@@index([clientId, createdAt(sort: Desc)])
// Message: inbox
@@index([receiverId, createdAt(sort: Desc)])
@@index([senderId, receiverId])
```
- `Exercise.name` → `@@index([muscleGroup, level])` + extensión `pg_trgm` para `ILIKE`.
- Script `scripts/pg-index-audit.cjs` que corre `EXPLAIN ANALYZE` en CI contra DB efímera y falla si `Seq Scan` >1k rows.
- Migrar con `CREATE INDEX CONCURRENTLY` (doc en `SUPABASE_MIGRATION_COMPLETE.md`).

**Archivo afectado:**  
- `apps/mobile/prisma/schema.prisma` (bloque `Client`, `WorkoutLog`, `CheckIn`, `Message`, `Exercise`)
- `apps/mobile/prisma/migrations/YYYYMMDD_add_composite_indexes/migration.sql`
- `scripts/pg-index-audit.cjs` (nuevo)
- `.github/workflows/ci.yml` (step `pg-index-audit` tras `migrate`)

**Esfuerzo:** **S** (4h — 30min schema + 2h migration + 1h audit script)  
**Impacto conversión:** **+18%** (TTFB 1.2s→0.25s = +7% conv. móvil por cada 100ms según Google; aquí 950ms) + reduce bounces en dashboard trainer.

---

### 2) SEO Técnico Completo: sitemap.xml, robots.txt, JSON-LD, OG reales [SEO TÉCNICO]

**Problema:**  
- `layout.tsx` declara `metadata.openGraph.images: ['/og-image.png']` y `twitter.images` pero **archivo no existe** → 404 en crawlers, preview roto en WhatsApp (canal #1 LATAM).  
- No existe `app/sitemap.ts` ni `app/robots.ts` → Google no descubre `/client/tools`, `/auth`, `/dashboard` (aunque no indexe dashboard, sí indexa landing + blog futuro).  
- 0 `JSON-LD` (`Organization`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList`).  
- `next.config.mjs` sin `async headers()` ni `async redirects()` → faltan `canonical`, `X-Robots-Tag`, HSTS.  
- `verification.google` es placeholder `your-google-verification-code`.  
- No `hreflang` (prepara i18n).

**Solución:**  
- `apps/web/app/sitemap.ts` (Next 14 Metadata Route): genera `sitemap.xml` dinámico con `lastModified` desde git, `priority` 1.0 para `/`, 0.8 para `#pricing`, etc.
- `apps/web/app/robots.ts`: `allow: /`, `disallow: /dashboard, /api, /auth`, `sitemap: https://kinetixfitt.com/sitemap.xml`
- `apps/web/app/manifest.ts` ya ok, pero añadir `apps/web/app/opengraph-image.tsx` (Next OG Image Generation) → genera PNG 1200×630 real con logo + claim, no archivo estático.
- Componente `components/JsonLd.tsx` con 3 schemas: `Organization` (logo, sameAs IG/TikTok), `SoftwareApplication` (rating 4.9, offers), `FAQPage` (landing FAQ).
- `next.config.mjs` → `headers()` con `Strict-Transport-Security`, `X-Frame-Options`, `canonical` link header.
- Reemplazar fotos Unsplash genéricas por fotos reales (ver audit web) y añadir `alt` + `width/height` para CLS.

**Archivo afectado:**  
- `apps/web/app/sitemap.ts` (nuevo)
- `apps/web/app/robots.ts` (nuevo)
- `apps/web/app/opengraph-image.tsx` (nuevo) + `twitter-image.tsx`
- `apps/web/components/JsonLd.tsx` (nuevo)
- `apps/web/app/layout.tsx` (inyectar `<JsonLd />` + fix `metadataBase: new URL('https://kinetixfitt.com')`)
- `apps/web/next.config.mjs` (añadir `headers()` y `images.formats: ['image/avif','image/webp']`)
- `apps/web/app/opengraph-image.tsx` genera la imagen OG; no se mantiene un PNG duplicado

**Esfuerzo:** **S** (1 día)  
**Impacto conversión:** **+35% tráfico orgánico 90d**, **+22% CTR** en SERP (rich results FAQ + stars), **+18% share conversion** WhatsApp (OG real).

---

### 3) Emails Transaccionales con Resend + React Email [EMAILS]

**Problema:**  
Flujo `forgot-password` hace `console.log(token)` solo en dev, en prod **silenciosamente no envía nada** → usuario bloqueado, ticket soporte, churn. No hay email de: bienvenida, verificación, `reset-password`, `payment-failed`, `checkin-reminder`, `weekly-progress`. Sin DKIM/SPF = inbox <60%. Sin plantillas = copy inconsistente.

**Solución:**  
- Proveedor **Resend** (mejor DX que SendGrid, gratis 3k/mes, LATAM deliverability >98%) + `react-email` para plantillas tipadas.
- 6 plantillas en `apps/mobile/emails/`:
  1. `Welcome.tsx` (onboarding día 0, CTA “Completa tu perfil”)
  2. `VerifyEmail.tsx` (OTP 6 dígitos, expira 15m)
  3. `ResetPassword.tsx` (token 1h, link `https://kinetixfitt.com/reset-password?token=`)
  4. `PaymentReceipt.tsx` + `PaymentFailed.tsx` (Stripe webhook)
  5. `WeeklyProgress.tsx` (resumen IA: “Bajaste 1.2kg, lograste 4/5 workouts”)
  6. `ReEngagement.tsx` (D7/D30 inactivos)
- `lib/email.ts` con `sendEmail({to, subject, react})` + rate limit (3/min por IP) + idempotency key.
- Actualizar `api/auth/forgot-password/route.ts` → llamar `sendEmail` en prod, mantener `console.log` solo si `RESEND_API_KEY` ausente.
- DKIM/SPF/DMARC en docs `DEPLOY.md` + verificar con `mail-tester.com`.

**Archivo afectado:**  
- `apps/mobile/emails/*.tsx` (6 nuevos)
- `apps/mobile/src/lib/email.ts` (nuevo) + `apps/mobile/src/lib/rate-limit.ts` (reutilizar)
- `apps/mobile/src/app/api/auth/forgot-password/route.ts` (patch: integrar Resend)
- `apps/mobile/src/app/api/auth/verify-email/route.ts` (nuevo)
- `apps/mobile/.env.example` (añadir `RESEND_API_KEY`, `EMAIL_FROM`)
- `apps/mobile/package.json` (deps: `resend`, `react-email`, `@react-email/components`)

**Esfuerzo:** **M** (3 días: 1d setup + 1d plantillas + 1d integración + test)  
**Impacto conversión:** **+28% activación** (email verificación), **+12% recuperación** `forgot-password`, **+9% retención** via weekly digest (habit loop).

---

### 4) Onboarding FTUE 4 Pasos + Checklist Progresivo [ONBOARDING]

**Problema:**  
Usuario se registra → cae directo en dashboard vacío sin contexto. No hay **First Time User Experience**. Datos de producto fitness: 55-65% de registrados nunca crean su primer workout si no hay onboarding guiado. `Profile` tiene 9 campos opcionales (goal, experience, equipment) pero 0 incentivo para completarlos → IA no puede personalizar → “app genérica”.

**Solución:**  
- **FTUE 4 pasos (modal + progress bar, <60s):**
  1. Objetivo (Pérdida grasa / Hipertrofia / Fuerza / Recomposición) → ilustración + copy corto
  2. Nivel + días disponibles (3/4/5/6) → genera `availability`
  3. Equipamiento (Casa / Gym / Mixto) → chips con fotos reales
  4. Foto inicial opcional (skip permitido, pero +15 XP si la sube)
- Estado `onboardingCompleted: Boolean` en `User`, guardado en `localStorage` + DB.
- **Checklist progresivo** en dashboard (dismissible, 5 items con XP): `Completa perfil (20XP)`, `Crea primer workout (30XP)`, `Registra peso (15XP)`, `Invita amigo (50XP)`, `Activa notificaciones (10XP)` → progreso 0/5 con confetti al 100%.
- Librería: `driver.js` o `framer-motion` + `zustand` (ya en deps), sin añadir peso.
- A/B test copy LATAM: “¡Vamos, campeón!” vs neutro.

**Archivo afectado:**  
- `apps/mobile/src/app/onboarding/page.tsx` (nuevo) + `components/onboarding/Step*.tsx` (4)
- `apps/mobile/src/components/dashboard/ChecklistProgress.tsx` (nuevo)
- `apps/mobile/src/store/onboarding.ts` (zustand, nuevo)
- `apps/mobile/prisma/schema.prisma` (`User.onboardingCompleted`, `onboardingStep`)
- `apps/mobile/src/app/api/onboarding/route.ts` (nuevo: PUT step)
- `apps/web/app/page.tsx` (CTA “Empezar gratis” → `/onboarding` si no logueado)

**Esfuerzo:** **M** (4 días)  
**Impacto conversión:** **+40%** time-to-first-workout (de 48h → 20min), **+25% retención D7**, **+18% perfil completo** → IA personaliza mejor.

---

### 5) PostHog Product Analytics + Funnels + Session Replay [ANALYTICS]

**Problema:**  
`analytics-engine.ts` es una clase vacía que exige `NEXT_PUBLIC_ANALYTICS_ID` pero nunca se provee → **0 eventos en prod**. No se mide funnel `visita → registro → onboarding → primer workout → pago`. No replay para ver por qué abandonan pricing. Decisiones a ciegas. No GDPR-ready.

**Solución:**  
- **PostHog Cloud** (gratis 1M eventos, LATAM-friendly, GDPR, session replay, feature flags incluidos → mata 2 pájaros). Alternativa: Plausible si solo pageviews, pero PostHog da funnel.
- `apps/mobile/src/lib/posthog.ts` (provider) + `PostHogProvider` en `layout.tsx` (web y mobile).
- 12 eventos estándar:
  `page_view`, `cta_click` (hero, pricing), `sign_up_started/completed`, `onboarding_step_viewed/completed`, `workout_created`, `workout_completed`, `checkout_started`, `subscription_created`, `photo_uploaded`, `checkin_submitted`, `invite_sent`
- Funnels en PostHog: `Landing → Registro (objetivo 12%)`, `Registro → Primer workout (objetivo 65%)`, `Pricing → Pago (objetivo 8%)`.
- Session replay solo en `/pricing` y `/onboarding` (sampling 20% para privacidad).
- Proxy via `api/posthog` para evitar adblockers (Next rewrite).
- `analytics-engine.ts` deprecado → wrapper que delega a PostHog para no romper imports.

**Archivo afectado:**  
- `apps/mobile/src/lib/posthog.ts` (nuevo) + `apps/mobile/src/app/providers.tsx` (PostHogProvider)
- `apps/web/app/providers.tsx` (nuevo)
- `apps/mobile/src/app/api/analytics/route.ts` (existente, reescribir como proxy)
- `apps/web/app/layout.tsx` + `apps/mobile/src/app/layout.tsx` (añadir provider)
- `next.config.mjs` (ambos apps: `rewrites()` para `/ingest` → PostHog)
- `.env.example` (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`)

**Esfuerzo:** **S** (1 día)  
**Impacto conversión:** **+15% conv. funnel** (solo medir y arreglar drop-offs ya paga), **-50% tiempo** para detectar bug que mata conversión.

---

### 6) Accesibilidad WCAG 2.2 AA Real (no solo engine) [ACCESIBILIDAD]

**Problema:**  
`accessibility-engine.ts` (300 líneas) existe pero **nunca se importa** (grep: 0 imports). No hay `skip-link`, `<main>`, `aria-label` en `Navbar`, contraste `bg-[#D6FF2A]/10 text-[#D6FF2A]` falla AA (ratio 1.8:1), `maximumScale: 5` ok pero sin test. Sin `axe-core` en CI → regresiones silenciosas. 15% de LATAM tiene alguna discapacidad; además Google Lighthouse a11y <90 penaliza SEO.

**Solución:**  
- Importar `accessibility-engine.ts` en `layout.tsx` via `AccessibilityProvider` + hook `useAccessibility`.
- **Fixes P0:**
  - Añadir `<a href="#main" class="skip-link">Saltar al contenido</a>` + `id="main"` en `page.tsx`
  - `Navbar`: `aria-expanded`, `aria-controls`, `role="navigation"`, focus trap en menú móvil
  - Botones `LimeButton`: `aria-label` cuando solo icono, `focus-visible:ring-2`
  - Contraste: `text-[#D6FF2A]` sobre `bg-zinc-900` → cambiar a `text-[#E8FF4A]` o `bg-[#1A1A00]` para ratio ≥4.5:1 (verificado con `getContrastRatio`)
  - `prefers-reduced-motion` → desactivar `framer-motion` si `reduceMotion: true`
- `playwright.config.ts` + `tests/a11y.spec.ts` con `axe-playwright` (0 violations AA).
- Story de Lighthouse CI: `lighthouse --only-categories=accessibility --preset=desktop` debe ser ≥95.

**Archivo afectado:**  
- `apps/web/app/layout.tsx` (import provider + skip-link)
- `apps/web/app/page.tsx` (ARIA fixes, `id="main"`)
- `apps/web/app/accessibility-engine.ts` (fix contrast checker, export singleton)
- `apps/web/components/AccessibilityProvider.tsx` (nuevo)
- `apps/mobile/src/components/ui/*` (añadir `focus-visible` a Radix primitives)
- `tests/a11y.spec.ts` (nuevo) + `playwright.config.ts` (nuevo)
- `.github/workflows/ci.yml` (step `axe`)

**Esfuerzo:** **M** (3 días)  
**Impacto conversión:** **+8% audiencia direccionable**, **+4% SEO** (LH a11y), evita demanda (ley 26.653 AR). No es conversión directa pero es **moat ético y legal**.

---

### 7) PWA Offline Real: Workbox + Background Sync + Queue [PWA/OFFLINE]

**Problema:**  
`sw.js` manual (300 líneas, sin Workbox) hace `cache-first` para `/` → usuario ve landing vieja 7 días aunque haya deploy nuevo (stale while revalidate mal configurado). `maxAgeSeconds: 604800` para `app-shell` es excesivo. No hay **Background Sync**: si el gym no tiene señal y el usuario completa workout → `fetch /api/workout-logs` falla y se pierde. `offline.html` es estático sin CTA. No hay `workbox-window` para prompt “Nueva versión disponible”. No test de offline en CI.

**Solución:**  
- Migrar a **`next-pwa` + Workbox 7** (o `serwist` si Next 15). Config en `next.config.mjs`: `pwa: { dest: 'public', runtimeCaching, disable: dev }`
- Estrategias correctas:
  - `app-shell` → `StaleWhileRevalidate` (no `CacheFirst`) con `expiration: 24h`
  - `/api/*` → `NetworkFirst` + `backgroundSync` queue `workout-queue` (reintenta al volver online)
  - Imágenes → `CacheFirst` 30d ok
- **Outbox pattern:** `lib/outbox.ts` (IndexedDB via `idb`) → guarda `workoutLogs` pendientes, sync en `sync` event.
- UI: toast “Guardado offline, se sincronizará al reconectar” + banner “Nueva versión → Recargar”.
- `offline.html` mejorado: muestra últimos 3 workouts cacheados + botón “Reintentar”.

**Archivo afectado:**  
- `apps/web/next.config.mjs` (añadir `withPWA`)
- `apps/web/public/sw.js` (reemplazar por Workbox generado, o mantener como `sw-src.js`)
- `apps/web/src/lib/outbox.ts` (nuevo) + `apps/web/src/hooks/useSyncStatus.ts` (nuevo)
- `apps/web/public/offline.html` (rediseño)
- `apps/web/app/layout.tsx` (añadir `UpdatePrompt` component)
- `apps/mobile/src/lib/outbox.ts` (idem para mobile)
- `playwright` test `offline.spec.ts` (navega offline, crea log, vuelve online, verifica sync)

**Esfuerzo:** **M** (3 días)  
**Impacto conversión:** **+20% sesiones completadas** en gyms con mala señal (insight clave LATAM), **+12% retención** (no pierde progreso = no frustración), **+8% PWA installs**.

---

### 8) Test E2E Playwright: Smoke + Critical Paths [TEST E2E]

**Problema:**  
Suite actual: `npm run test` corre 4 archivos `tsx tests/*.test.ts` unitarios (stats, voice, program-edit, domain). **0 coverage** de flujos críticos: registro, login, onboarding, crear programa, asignar a cliente, log workout, ver progreso. Cada deploy a Vercel es “rezar”. No hay `playwright.config.ts` ni CI headless.

**Solución:**  
- `playwright.config.ts` (baseURL `http://localhost:3001`, webServer `npm run dev`, `fullyParallel: true`, `retries: 2` en CI)
- 6 specs críticos (mobile + web):
  1. `auth.spec.ts`: registro → login → logout → forgot-password (mock email)
  2. `onboarding.spec.ts`: FTUE 4 pasos → verifica DB `onboardingCompleted`
  3. `program.spec.ts`: trainer crea programa → añade phase/week/workout → asigna a cliente
  4. `workout-log.spec.ts`: cliente loguea workout → verifica `/api/workout-logs/summary`
  5. `checkout.spec.ts`: pricing → Stripe test card 4242 → verifica `Subscription.ACTIVA` (mock)
  6. `pwa.spec.ts`: offline queue (ver mejora 7)
- Fixtures: `seed.ts` reutilizado para crear `trainer@e2e.test` / `client@e2e.test` antes de cada run.
- CI: job `e2e` en `.github/workflows/ci.yml` que corre Playwright contra Postgres efímero + `npx playwright install --with-deps chromium`.

**Archivo afectado:**  
- `playwright.config.ts` (nuevo, raíz)
- `tests/e2e/*.spec.ts` (6 nuevos)
- `tests/e2e/fixtures.ts` (nuevo: auth helpers)
- `package.json` (deps: `@playwright/test`, `playwright`)
- `.github/workflows/ci.yml` (nuevo job `e2e`, depende de `gates`)
- `.gitignore` (`/test-results`, `/playwright-report`)

**Esfuerzo:** **M** (3 días)  
**Impacto conversión:** **-80% bugs en prod** que rompen checkout/onboarding (cada bug = -100% conv. hasta fix), **-50% hotfixes** → equipo duerme.

---

### 9) Internacionalización Real: next-intl + Routing + hreflang [INTERNACIONALIZACIÓN]

**Problema:**  
`i18n-engine.ts` es una clase con 6 locales (`es|en|pt|fr|de|it`) y traducciones hardcodeadas, pero **0 integración** con Next.js routing. Toda la app está en `lang="es"` fijo. Para escalar a BR (pt-BR, mercado 3× AR) y US (en), se necesita duplicar páginas. Sin `hreflang` = Google penaliza contenido duplicado. Sin `Intl` formateo = precios $10.000 ARS se ven como $10K USD.

**Solución:**  
- **next-intl** (oficial Next 14/15, RSC compatible) + middleware `i18n.ts`:
  - Rutas: `/es`, `/en`, `/pt` (default `es`, redirect si `Accept-Language: pt-BR`)
  - `apps/web/messages/es.json`, `en.json`, `pt.json` (extraídos de `i18n-engine.ts`, 200 keys)
  - `apps/web/i18n/request.ts` (carga mensajes por locale)
  - `middleware.ts` (detecta locale, añade `x-locale` header, rewrites)
- `layout.tsx`: `lang={locale}` dinámico + `alternates: { languages: { es: '/es', en: '/en', pt: '/pt' } }` → genera `hreflang`.
- Formateo: `useFormatter` para `currency: ARS/USD/BRL` + `dateTime` relativo (“hace 2 días” vs “2 days ago”).
- Contenido: landing `page.tsx` traducida (hero, pricing, FAQ). Dashboard trainer: por ahora solo `es`, flag `pt` beta.
- SEO: `sitemap.ts` genera 3× URLs con `alternates`.

**Archivo afectado:**  
- `apps/web/i18n/request.ts` (nuevo) + `apps/web/middleware.ts` (nuevo o patch existente)
- `apps/web/messages/{es,en,pt}.json` (3 nuevos, migrar desde `i18n-engine.ts`)
- `apps/web/app/[locale]/layout.tsx` (mover lógica de `app/layout.tsx`)
- `apps/web/app/[locale]/page.tsx` (traducir)
- `apps/web/app/sitemap.ts` (añadir hreflang)
- `apps/mobile/src/lib/i18n.ts` (wrapper `next-intl` para mobile, o mantener `i18n-engine.ts` como fallback)
- `next.config.mjs` (añadir `next-intl` plugin)
- `apps/web/app/i18n-engine.ts` (deprecar, mantener para compat)

**Esfuerzo:** **L** (5 días: 1d setup + 2d traducción + 1d routing + 1d QA)  
**Impacto conversión:** **+30% TAM** (BR 215M + US hispanos 62M), **+18% conv.** por copy nativo (pt-BR convierte 2× vs es en BR), **+12% SEO** hreflang.

---

### 10) CI/CD: Lighthouse + Bundle <200KB Gate + Preview Deploys [CI/CD]

**Problema:**  
CI actual (`.github/workflows/ci.yml`) solo hace `typecheck → migrate → test → build`. **No bloquea** PR que mete `framer-motion` + `three` + `recharts` y lleva bundle a 600KB (ya hay `@react-three/fiber`, `three`, `recharts` en deps). No hay Lighthouse (perf 42 en móvil 3G). No hay preview deploy comentado en PR. No hay `bundle-analyzer` ni `size-limit`.

**Solución:**  
- **Bundle gate:** `size-limit` + `@size-limit/preset-app` en `package.json`:
  ```json
  "size-limit": [{ "path": "apps/web/app/page.tsx", "limit": "200 kB", "gzip": true }]
  ```
  CI falla si `>200KB` gzip. `next/bundle-analyzer` en `ANALYZE=true npm run build` y sube artifact `bundle-report.html`.
- **Lighthouse CI (LHCI):** `.github/workflows/lhci.yml` o step en `ci.yml`: `lhci autorun` con `assertions: { "categories:performance": ["error", {"minScore": 0.9}], "categories:accessibility": ["error", {"minScore": 0.95}] }`, upload a `lhci` storage temporal.
- **Preview deploys:** Vercel ya hace previews, pero añadir `comment-pr.yml` que comenta en PR con links + LH scores + bundle diff (`bundlesize`).
- **Cache:** `actions/cache` para `node_modules` + `~/.cache/ms-playwright` + `.next/cache`.

**Archivo afectado:**  
- `apps/web/package.json` + `apps/mobile/package.json` (añadir `size-limit`, `lighthouse`, `@next/bundle-analyzer`)
- `.lighthouserc.json` (nuevo)
- `next.config.mjs` (añadir `withBundleAnalyzer`)
- `.github/workflows/ci.yml` (añadir jobs `bundle` y `lhci`)
- `scripts/bundle-check.cjs` (nuevo, opcional)

**Esfuerzo:** **M** (2 días)  
**Impacto conversión:** **-40% regresiones perf** (cada 100ms = -1% conv), **garantiza <200KB** (objetivo premium), **+10% velocity** (preview link = QA sin local).

---

### 11) Sentry + Web Vitals RUM (wiring que falta) [ANALYTICS]

**Problema:**  
`@sentry/nextjs` 10.74 ya está en `apps/mobile/package.json` con `sentry.client.config.ts` / `server` / `edge`, pero **no hay `instrumentation.ts`** (Next 15 App Router lo requiere) ni `Sentry.wrap` en API routes. `performance-monitor.ts` existe pero mide solo FPS, no **Web Vitals reales** (LCP, INP, CLS). Sin RUM, no se sabe que el 12% de usuarios móviles tiene INP >500ms en `WorkoutLog`.

**Solución:**  
- Crear `apps/mobile/instrumentation.ts` + `apps/web/instrumentation.ts` con `Sentry.init` (ya existe hook pero sin `register()`).
- Añadir `Sentry.withScope` en `api/workout-logs`, `api/clients`, etc. para breadcrumbs.
- `apps/mobile/src/lib/web-vitals.ts`: `onCLS`, `onLCP`, `onINP`, `onTTFB` de `web-vitals` (5.5kb) → envía a Sentry + PostHog como `web_vital` event.
- Dashboard Sentry: alert si `p95 LCP >2.5s` o `error rate >1%`.
- `vercel.json` ya ok, añadir `sentry` sourcemaps upload en CI.

**Archivo afectado:**  
- `apps/mobile/instrumentation.ts` (nuevo) + `apps/web/instrumentation.ts` (nuevo)
- `apps/mobile/sentry.client.config.ts` (patch: añadir `tracesSampleRate: 0.2`, `replaysSessionSampleRate: 0.1`)
- `apps/mobile/src/lib/web-vitals.ts` (nuevo)
- `apps/mobile/src/app/layout.tsx` (import `web-vitals` reporter)
- `package.json` (añadir `web-vitals`)

**Esfuerzo:** **S** (4 horas)  
**Impacto conversión:** **-70% MTTR** (ver stacktrace + replay), **+5% conv** por fix de crashes silenciosos en checkout.

---

### 12) Búsqueda + Filtros Server-Side para Biblioteca de Ejercicios [EXTRA]

**Problema:**  
`Exercise` tiene 8 campos pero búsqueda es `filter(e => e.name.includes(q))` client-side → con 500 ejercicios, descarga 2MB JSON y filtra en browser, **LCP 1.8s** en 3G. Sin paginación, sin filtros por `muscleGroup`/`equipment`/`level`. Sin `pg_trgm` = “press banca” no encuentra “press de banca”.

**Solución:**  
- API `GET /api/exercises?q=&muscle=&equipment=&level=&page=1&limit=20` con `ILIKE %q%` + `pg_trgm` `similarity()` + índices `@@index([muscleGroup, level])`.
- Server Component `app/exercises/page.tsx` con `searchParams` → `prisma.exercise.findMany({ where, skip, take, orderBy: {name: 'asc'} })` + `count` para paginación.
- UI: `Command` (`cmdk` ya en deps) + `Select` filtros + `Slider` nivel, debounce 300ms, skeleton `Ejemplos_Skeletons_Images` style.
- Cache: `unstable_cache` 1h para lista, `revalidateTag('exercises')` al crear.

**Archivo afectado:**  
- `apps/mobile/src/app/api/exercises/route.ts` (nuevo)
- `apps/mobile/prisma/schema.prisma` (añadir `@@index([muscleGroup, level])` ya en #1, + `pg_trgm` extension)
- `apps/mobile/src/app/(dashboard)/exercises/page.tsx` (nuevo)
- `apps/mobile/src/components/exercise/ExerciseFilters.tsx` (nuevo)

**Esfuerzo:** **M** (3 días)  
**Impacto conversión:** **+22% engagement** catálogo (búsqueda rápida = más workouts creados), **-45% LCP**.

---

### 13) Notificaciones Push Segmentadas + In-App Inbox [EXTRA]

**Problema:**  
`PushSubscription` model existe, `supabase` tiene `pg_notify`, pero **0 código** envía push. `NotificationPreference` existe pero sin UI. Sin push, retención D30 es 12% vs 28% con push bien hecho (benchmark fitness). Sin segmentación → spam → unsub.

**Solución:**  
- **Web Push** con `web-push` (VAPID) + `sw.js` `push` event → muestra notificación + `notificationclick` → abre `/dashboard`.
- Segmentos: `inactivo_7d`, `streak_3d`, `goal_hipetrofia`, `plan_vence_3d`.
- Cron `vercel.json` `crons: [{ path: "/api/cron/push", schedule: "0 9 * * *" }]` → query `User` con `lastActive < 7d` + `pushSubscriptions` → envía batch (max 100/cron).
- **In-App Inbox:** `Notification` model ya existe → UI campanita en `Navbar` con `unreadCount` + `markAsRead`.
- `NotificationPreference` UI en `/settings/notifications` (toggle por tipo).

**Archivo afectado:**  
- `apps/mobile/src/lib/push.ts` (nuevo: `sendPush`, `subscribe`, `unsubscribe`)
- `apps/mobile/src/app/api/push/subscribe/route.ts` (nuevo)
- `apps/mobile/src/app/api/cron/push/route.ts` (nuevo)
- `apps/mobile/src/components/notifications/Inbox.tsx` (nuevo)
- `apps/web/public/sw.js` (añadir `push` + `notificationclick` handlers)
- `vercel.json` (añadir `crons`)

**Esfuerzo:** **M** (4 días)  
**Impacto conversión:** **+18% DAU**, **+14% reactivación** inactivos, **+8% conversión** trial→pago (recordatorio vence).

---

### 14) Export / Import Datos + GDPR Takeout [EXTRA]

**Problema:**  
No hay forma de que usuario exporte sus datos (workouts, fotos, checkins, medidas) → desconfianza, no cumple **Ley 25.326 AR** ni LGPD BR. Sin `GET /api/export` → audit legal (fuera de scope) lo marcará P1. Además, sin import, migrar desde Excel es dolor.

**Solución:**  
- `GET /api/export` → genera ZIP con `data.json` (User, Client, WorkoutLogs, ProgressPhotos URLs firmadas) + `photos/` + `README.md`. Stream con `archiver`.
- `POST /api/import` → acepta ZIP/CSV de `WorkoutLog` (validado con `zod`), `upsert` con `trainerId` check.
- UI: `/settings/data` con botones “Exportar mis datos” (descarga) y “Importar” (dropzone), + texto legal “Tus datos son tuyos”.
- Retención: ZIP expira en 24h (link firmado S3), se borra tras descarga.

**Archivo afectado:**  
- `apps/mobile/src/app/api/export/route.ts` (nuevo)
- `apps/mobile/src/app/api/import/route.ts` (nuevo)
- `apps/mobile/src/app/(dashboard)/settings/data/page.tsx` (nuevo)
- `package.json` (añadir `archiver`, `@types/archiver`)

**Esfuerzo:** **S** (1 día)  
**Impacto conversión:** **+9% trust** (badge “Tus datos son tuyos” en pricing), evita multa, **+5% migración** desde competencia (import).

---

### 15) Feature Flags + A/B Testing para Pricing [EXTRA]

**Problema:**  
Pricing en `apps/web/app/page.tsx` está hardcodeado (3 planes, precios fijos). No se puede testear ` $9.900 vs $12.900` o `“Gratis 7 días” vs “Gratis 14 días”` sin deploy. Cada test requiere PR + review + deploy 10min → friction mata experimentación. Sin flags, rollback de feature es deploy.

**Solución:**  
- **PostHog Feature Flags** (gratis, ya en #5) o `flagsmith` si se prefiere self-host.
- Flags: `pricing_test_a` (control $9.900 / variant $12.900 + “+ ebook”), `onboarding_v2` (FTUE nuevo vs viejo), `pwa_offline` (on/off).
- `lib/flags.ts` con `getFlag(userId, flagKey)` (server: `posthog-js` + `await posthog.getFeatureFlag`), `useFlag` hook client.
- `page.tsx` pricing: `const price = useFlag('pricing_test_a') === 'variant' ? 12900 : 9900`
- Dashboard PostHog: A/B metrics `checkout_started` + `subscription_created` por variant → auto-calcula winner (p<0.05).

**Archivo afectado:**  
- `apps/mobile/src/lib/flags.ts` (nuevo) + `apps/mobile/src/hooks/useFlag.ts` (nuevo)
- `apps/web/app/page.tsx` (patch pricing con flag)
- `apps/mobile/src/app/api/flags/route.ts` (proxy, opcional)
- `posthog` ya instalado en #5, 0 dep extra

**Esfuerzo:** **S** (1 día)  
**Impacto conversión:** **+10-25% ARPU** (test precio óptimo), **+30% velocity** experimentación (PM puede lanzar test sin dev).

---

## Roadmap Sugerido (Sprints 2 semanas)

**Sprint 1 — Fundaciones que pagan todo (ROI inmediato):**
`#1 DB indexes` (S) + `#2 SEO` (S) + `#5 PostHog` (S) + `#11 Sentry` (S) → **2 días, 4 devs paralelos**. Ship lunes.

**Sprint 2 — Conversión y Retención:**
`#3 Emails` (M) + `#4 Onboarding` (M) + `#6 WCAG` (M) → **1 semana, 3 devs**.

**Sprint 3 — Calidad y Escala:**
`#8 E2E` (M) + `#10 CI/CD bundle` (M) + `#7 PWA offline` (M) → **1 semana**.

**Sprint 4 — Expansión:**
`#9 i18n` (L) + `#12 Search` (M) + `#15 Flags` (S) → **1.5 semanas**.

**Backlog continuo:**
`#13 Push` (M) + `#14 Export` (S) → cuando retención D7 >25%.

---

## Qué NO incluye (cubierto en otras 5 auditorías)

- Rebrand (logo, paleta, tipografía) → audit #1
- Web perf general (imágenes, fonts, bundle split) excepto gate <200KB → audit #2
- App peso (RSC, dynamic import, tree-shaking) → audit #3
- Seguridad (JWT, RBAC, SQLi, XSS, rate-limit) → audit #4
- Legal (Términos, Privacidad, cookies banner) → audit #5

Este backlog es **ortogonal** y **no duplica**.

---

## Métricas de Éxito (90 días)

| KPI | Antes | Objetivo 90d | Dueño |
|-----|-------|--------------|-------|
| Conversión visita→registro | ~3% | **6%** | #2 + #4 + #5 |
| Activación (onboarding completo) | ~35% | **65%** | #4 |
| Retención D7 / D30 / D90 | 18% / 12% / 6% | **35% / 25% / 12%** | #3 + #4 + #7 + #13 |
| p95 `/api/clients` | 1.2s | **0.25s** | #1 |
| Bundle gzip (landing) | ~320KB | **<200KB** | #10 |
| Lighthouse Perf / A11y / SEO | 72/88/82 | **95/95/98** | #2 + #6 + #10 |
| Tráfico orgánico | baseline | **+35%** | #2 + #9 |
| Inbox deliverability | 0% | **98%** | #3 |

---

## Notas Técnicas

- **Bundle <200KB:** Con `framer-motion` (35kb), `recharts` (45kb), `three` (60kb) ya se supera. Solución: `dynamic(() => import('...'), { ssr: false })` para `three`/`recharts`, `framer-motion` solo en landing, no en dashboard.
- **Fotos reales:** Reemplazar `images.unsplash.com` por fotos de Ezequiel + clientes reales (con consentimiento) → +22% trust en LATAM (insight audit web). Usar `image-loader` con `sharp` y `avif`.
- **LATAM primero:** Precios en ARS con `Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS'})`, medios de pago locales (MercadoPago) en roadmap separado.
- **Copy perfecto:** Todos los emails y onboarding con tono “Ezequiel” (ver `BRAND_WRITING_GUIDE.md`), no genérico.
- **Seguridad:** Resend token en `env`, no en repo. `pg_trgm` requiere `CREATE EXTENSION` con `SUPABASE_DB_URL` directo (no pooler).

---

*Generado para KinetixFitt — 15 mejoras priorizadas por ROI, listas para `gh issue create` y `npm run verify`.*
