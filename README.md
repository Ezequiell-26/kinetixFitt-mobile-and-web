# KINETIXFITT

Plataforma unificada de fitness para atletas y entrenadores, con aplicación web, aplicación móvil/PWA, backend API, IA, seguimiento de entrenamiento, pagos, notificaciones y herramientas de coaching.

## Arquitectura actual

```text
kinetixFitt-mobile-and-web/
├── apps/
│   ├── web/            # Web pública + experiencias web/SEO
│   └── mobile/         # App principal + API + PWA + Capacitor + Electron fallback
├── packages/
│   ├── shared/
│   ├── ai-models/
│   ├── core/
│   └── native-modules/
├── docs/
├── scripts/
└── package.json
```

`apps/web` y `apps/mobile` son las dos únicas aplicaciones de primer nivel. La capacidad desktop es un shell de `apps/mobile/electron`, por lo que no existe un tercer proyecto desktop.

## Requisitos

- Node.js 22 recomendado (CI usa Node 22)
- npm 10+ recomendado
- PostgreSQL/Supabase para producción
- Upstash Redis para rate limiting distribuido
- Proveedor de email para transaccionales
- Stripe y/o Mercado Pago para pagos
- S3 compatible para assets/backups privados
- Sentry/PostHog para observabilidad/analytics

## Desarrollo

Instalación del monorepo:

```bash
npm ci
npm ci --prefix apps/web
```

Ejecutar ambas aplicaciones:

```bash
npm run dev
```

Solo web:

```bash
npm run web
```

Solo mobile/app dinámica:

```bash
npm run mobile
```

Build completo:

```bash
npm run build
```

Build individual:

```bash
npm run web:build
npm run mobile:build
```

## Quality gates

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Para validación de producción de la aplicación móvil/backend:

```bash
npm -w apps/mobile run verify:production
npm -w apps/mobile run test:e2e
```

Las migraciones de producción se ejecutan con `prisma migrate deploy`; no se utiliza `prisma migrate dev` contra producción.

## Variables de entorno

La referencia principal está en `apps/mobile/.env.example`; el root también incluye un ejemplo mínimo. Nunca se deben commitear credenciales reales.

En producción son especialmente críticas:

- `DATABASE_URL` y `DIRECT_URL`
- `JWT_SECRET`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `KINETIX_INTERNAL_API_SECRET` y `BACKUP_ADMIN_USER_IDS` cuando esos servicios estén habilitados
- claves de Stripe/Mercado Pago si están habilitados
- credenciales S3
- proveedor de email
- Sentry/PostHog
- `CAPACITOR_SERVER_URL` para builds nativos móviles

## Despliegue Vercel

### Web

Crear un proyecto Vercel con este repositorio y mantener la raíz del proyecto en el repositorio. El `vercel.json` raíz instala las dependencias de `apps/web` y ejecuta:

```bash
npm --prefix apps/web run build
```

### Mobile/backend/API

Crear un segundo proyecto Vercel usando el mismo repositorio. Su configuración es `apps/mobile/vercel.json` y ejecuta:

```bash
npm run mobile:build
```

Este proyecto debe tener las variables privadas del backend. No se deben copiar secretos del backend al proyecto web si la web no los necesita.

## Native release

El workflow `.github/workflows/native.yml` genera Android e iOS desde `apps/mobile` mediante Capacitor. Los shells desktop se consideran infraestructura de la aplicación principal y no una tercera aplicación.
Para Android de producción, `.github/workflows/android-release.yml` genera un AAB firmado. Requiere los secrets de GitHub correspondientes al keystore y firma.

Para iOS, el build de App Store requiere un entorno macOS con certificados/provisioning profiles de Apple; se documenta en `docs/RELEASE_RUNBOOK.md`.

## Producción: regla de lanzamiento

El repositorio contiene infraestructura de producción, pero el lanzamiento no se considera verificado hasta que CI, staging, base de datos, dominios, credenciales, pagos, email, storage, observabilidad y pruebas E2E hayan sido comprobados con servicios reales.

Consulta:

- `PRODUCTION_READINESS.md`
- `DEPLOYMENT_CHECKLIST.md`
- `docs/RELEASE_RUNBOOK.md`
- `.ai/PROJECT_REALITY.md`

## Rama operativa

`main` es la rama operativa para los cambios de lanzamiento solicitados en este proyecto. `develop` sigue existiendo en GitHub como rama de desarrollo histórica y no debe considerarse automáticamente equivalente a `main`.

## Licencia

MIT — ver `LICENSE`.

**Actualizado:** 2026-10-08
