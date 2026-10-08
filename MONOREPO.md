# KinetixFitt Monorepo

## Aplicaciones

El repositorio mantiene dos aplicaciones de primer nivel:

- **`apps/mobile`** — aplicación principal, API/backend, PWA y empaquetado Capacitor. También contiene el shell Electron de transición.
- **`apps/web`** — sitio web público y experiencias web/SEO.

No existe una tercera aplicación desktop. `apps/mobile/electron` es infraestructura de empaquetado de la aplicación principal, no otro proyecto.

## Paquetes compartidos

- `packages/shared` — tipos, componentes y utilidades compartidas.
- `packages/ai-models` — configuración/modelos relacionados con IA.
- `packages/core` — core Rust/WASM.
- `packages/native-modules` — puentes nativos.

## Instalación

```bash
npm ci
npm ci --prefix apps/web
```

## Desarrollo

```bash
npm run web
npm run mobile
```

Para ejecutar ambas aplicaciones:

```bash
npm run dev
```

## Build y gates

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

La CI es la fuente de verdad para los builds de `apps/mobile` y `apps/web`.

## Base de datos

`apps/mobile/prisma` contiene el schema y las migraciones de PostgreSQL. No se debe asumir una segunda base SQLite en `apps/web`.

## Regla de estructura

No crear otro `apps/*` para desktop, otra web, otro backend ni otra instancia de Electron. Las nuevas capacidades deben entrar en las dos aplicaciones existentes o en un paquete compartido cuando corresponda.
