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

## 4. 2026-09-17 hardening completed on `main`

### Notifications / Push
- Push registration persists through the Prisma `PushSubscription` model.
- `/api/push/send` is internally authenticated and uses the same persistence layer as registration.
- Push delivery uses the centralized policy in `apps/mobile/src/lib/push-server.ts` for enablement, category preferences and timezone-aware quiet hours.
- Bulk push preference evaluation uses a single Prisma query instead of one query per recipient.
- New messages trigger typed coach-message Push notifications.
- New check-ins notify the assigned trainer in-app and by typed Push.
- Trainer check-in replies notify clients in-app and by Push.
- Expired Web Push endpoints returning 404/410 are deactivated.

### Rate limiting
- Message sends use the existing distributed/fallback limiter.
- Check-in create/review writes use dedicated limits.
- Authenticated uploads use the existing upload limit profile.

### Storage security
- Uploads use strict MIME allowlists and magic-byte validation.
- File size is bounded and filenames are generated server-side.
- Files are created with exclusive `wx` mode to reduce overwrite races.
- Upload serving is authenticated and resource-scoped.
- Avatar serving no longer grants blanket access to every authenticated user; it is restricted to the avatar owner or that user's assigned trainer.
- PDF responses are served as attachments and private responses are non-cacheable.

### AI
- AI request input is validated and rate limited.
- OpenAI/GLM configuration is distinguished and incomplete GLM configuration is rejected.
- Database context is explicitly treated as data rather than instructions.
- Trainer AI client context remains protected by server-side ownership checks.

### Offline / PWA
- Service Worker mutation outbox uses persistent IndexedDB with an allowlisted set of same-origin mutation APIs and bounded retries.
- Client offline sync uses IndexedDB with legacy localStorage migration.

### Windows / macOS / Android / iOS
- Windows desktop has a dedicated Electron NSIS build script and CI job.
- macOS desktop has a dedicated Electron DMG build script and CI job.
- Electron renderer has `contextIsolation`, disabled `nodeIntegration`, sandboxing, and same-origin navigation enforcement.
- Android is generated with Capacitor, synced, and built as a debug APK in native CI; signed AAB remains available through the separate Android release workflow.
- iOS is generated with Capacitor on macOS CI, synced, compiled against an iOS Simulator SDK, and exported as a zipped `.app` build artifact.
- The mobile wrapper requires an explicit HTTPS `CAPACITOR_SERVER_URL`, preventing accidental builds that rely on an incomplete local `public` directory.
- Native project directories remain generated rather than committed, so platform source stays derived from the shared application source and avoids native drift.
- The platform verification script now matches the actual monorepo paths and no longer assumes a SQLite development database.

## 5. Verification state

Latest `main` commit is tracked by GitHub after the multiplatform workflow hardening. Source/configuration has been inspected through GitHub. This session still does not have completed CI results for the final commit, and direct Vercel deployment inspection returned 403 permission denied. GitHub branch inspection shows `main` is unprotected with no required status checks.

Therefore the project remains `PARTIAL / E2_STATIC` from an evidence perspective. The native matrix is implemented, but actual runner results, installed-app smoke tests, store signing and deployed runtime behavior still require execution.

The repository CI workflow contains static audit, typecheck, lint, migration/seed, unit tests, mobile build, security HTTP tests, Playwright E2E and web build gates. The native workflow now separately builds Windows, macOS, Android and iOS-simulator artifacts.

## 6. Remaining release blockers still requiring real environment evidence

1. Successful CI/build/typecheck/lint/test result on the latest `main`.
2. Real PostgreSQL migration validation against the target environment.
3. Sandbox Stripe and Mercado Pago checkout/webhook tests with deployed callbacks.
4. Real Web Push delivery and preference/quiet-hours verification on supported browsers/devices.
5. Browser termination/restart offline synchronization test.
6. Android APK/AAB smoke test on representative devices and final signed release verification.
7. iOS Simulator smoke test plus signed archive/IPA and App Store provisioning when Apple credentials are available.
8. Windows EXE and macOS DMG installation/update smoke tests on representative machines.
9. Fresh measured performance budgets and representative device/network baselines.
10. Full private-asset lifecycle test across upload/read/delete and cross-user denial.
11. Deployment-topology verification for `apps/web` versus `apps/mobile`.
12. GitHub branch protection and required checks for `main`.
13. Replacement of historical/documentary performance claims with current measurements.

## 7. Operating principle

**KinetixFitt should gain capabilities without losing reliability.**
