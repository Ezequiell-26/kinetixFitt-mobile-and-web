# KinetixFitt — Project State

**Status:** Living document / evidence-based  
**Last verified:** 2026-09-17  
**Repository:** `Ezequiell-26/kinetixFitt-mobile-and-web`

## 1. Evidence rule

This document is context, not proof. Current source, tests, CI, deployment and runtime evidence are authoritative. Never carry old completion claims forward without re-verification.

## 2. AI improvement control layer

The repository contains durable AI governance under `.ai/` plus `.github/agents` and `.github/skills`, including audit, evidence, feature ledger, integration registry, performance baselines, definition of done and execution protocol.

## 3. Architecture state

The repository contains `apps/mobile` and `apps/web` with explicit roles. Current production/deployment topology still needs verification so the deployed surface matches the intended architecture.

Technology includes Next.js, React, TypeScript, Prisma/PostgreSQL, Stripe, Mercado Pago, S3-compatible storage, Capacitor, Electron, Three.js/R3F, Sentry, Zod, Recharts, Framer Motion, Web Push/VAPID and Upstash rate limiting.

## 4. 2026-09-17 deep audit fixes on `main`

### PWA / offline
- Removed stale PWA manifest references to screenshot assets that do not exist in the repository.
- Service Worker no longer caches `/api/*` responses or authenticated dashboard navigations.
- Service Worker offline mutation paths now match real API routes (`/api/workout-logs`, `/api/checkins`, `/api/measurements`, `/api/progress-photos`).
- Service Worker outbox now uses its own IndexedDB database (`kinetixfitt-sw-outbox`) so it cannot collide with the client-side `kinetixfitt-offline` schema.
- Service Worker continues to use bounded retries and drops non-retryable client errors.

### Cross-app development
- `apps/web` development now uses port `3002` while `apps/mobile` remains on `3001`, preventing root `npm run dev` from launching two servers on the same port.

### Measurements / data integrity
- `/api/measurements` now validates request payloads with strict Zod schemas and numeric bounds.
- Client measurement writes resolve the authenticated client server-side.
- Trainer measurement writes require and verify trainer ownership of the target client.
- Measurement reads are scoped to the current client or assigned trainer relationship.
- Weight updates no longer use a silent error path.

### Multiplatform
- Windows: Electron NSIS target + CI.
- macOS: Electron DMG target + CI.
- Android: Capacitor generation/sync + debug APK workflow + separate signed AAB workflow.
- iOS: Capacitor generation/sync on macOS + iOS Simulator `.app` artifact.
- Electron uses sandboxed renderer, context isolation, disabled Node integration and same-origin navigation checks.
- Native projects remain generated rather than committed to avoid platform drift.
- Platform verifier now checks the actual monorepo layout, dependency locations and manifest asset references.

## 5. Verification state

Source/configuration has been deeply inspected through GitHub, including PWA, offline sync, multiplatform workflows, Electron packaging, Capacitor configuration, measurements, payments, dependencies, manifests, navigation references and high-risk security patterns.

The final repository state is still **PARTIAL / E2_STATIC** from an evidence perspective. This session cannot truthfully claim a successful full TypeScript/build/test run because the environment could not clone the complete repository for local execution. Vercel checks are currently failing with a `build-rate-limit` target, and direct Vercel inspection returns permission denied. GitHub branch protection is not enabled.

## 6. Remaining release blockers

1. Fresh CI result for the latest `main` commit.
2. Real PostgreSQL migration validation against staging/production.
3. Stripe and Mercado Pago sandbox checkout/webhook E2E with deployed callbacks.
4. Real Web Push delivery and preference/quiet-hour runtime verification.
5. Browser termination/restart offline synchronization test.
6. Android APK/AAB smoke tests and production signing verification.
7. iOS Simulator smoke test plus signed archive/IPA and App Store provisioning.
8. Windows EXE and macOS DMG installation/update smoke tests; public signing/notarization.
9. Current measured performance budgets and representative device/network baselines.
10. Full private-asset lifecycle and cross-user denial test.
11. Deployment topology verification for `apps/web` and `apps/mobile`.
12. GitHub branch protection and required checks for `main`.
13. Full native push/camera/haptics/other device-specific capabilities require explicit Capacitor plugins if the product intends native APIs rather than Web APIs.

## 7. Operating principle

**KinetixFitt should gain capabilities without losing reliability.**
