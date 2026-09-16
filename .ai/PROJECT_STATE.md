# KinetixFitt — Project State

**Status:** Living document / evidence-based  
**Last verified:** 2026-09-16  
**Repository:** `Ezequiell-26/kinetixFitt-mobile-and-web`

## 1. Evidence rule

This document is context, not proof. Current source, tests, CI, deployment and runtime evidence are authoritative. Never carry old completion claims forward without re-verification.

## 2. AI improvement control layer

The repository contains durable AI governance under `.ai/` plus `.github/agents` and `.github/skills`, including audit, evidence, feature ledger, integration registry, performance baselines, definition of done and execution protocol.

## 3. Architecture state

The repository contains `apps/mobile` and `apps/web` with explicit roles. Current production/deployment topology still needs verification so the deployed surface matches the intended architecture.

Technology includes Next.js, React, TypeScript, Prisma/PostgreSQL, Stripe, Mercado Pago, S3-compatible storage, Capacitor, Electron, Three.js/R3F, Sentry, Zod, Recharts, Framer Motion, Web Push/VAPID and Upstash rate limiting.

## 4. 2026-09-16 hardening completed on `main`

### Notifications / Push
- Push registration persists through the Prisma `PushSubscription` model.
- `/api/push/send` is internally authenticated and uses the same persistence layer as registration.
- Push delivery now shares a centralized policy in `apps/mobile/src/lib/push-server.ts` for enablement, category preferences and timezone-aware quiet hours.
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

## 5. Verification state

Latest `main` commit is `1da0afea308f1166a84b6de979bb4cf328fd21bc` (`docs: record storage hardening evidence`).

The code has been source-inspected through GitHub, but this session could not establish a passing runtime/CI result. A direct local `git clone` failed in the execution environment, and the connected Vercel deployment inspection returned 403 permission denied. GitHub branch inspection shows `main` is currently unprotected with no required status checks. Therefore the project remains `PARTIAL / E2_STATIC` rather than being declared production-ready.

The repository CI workflow contains static audit, typecheck, lint, migration/seed, unit tests, mobile build, security HTTP tests, Playwright E2E and web build gates, but those gates have not been freshly verified for this head in this session.

## 6. Release blockers still requiring real environment evidence

1. Successful CI/build/typecheck/lint/test result on the latest `main`.
2. Real PostgreSQL migration validation against the target environment.
3. Sandbox Stripe and Mercado Pago checkout/webhook tests with deployed callbacks.
4. Real Web Push delivery and preference/quiet-hours verification on supported browsers/devices.
5. Browser termination/restart offline synchronization test.
6. Android/iOS/desktop packaging and device smoke tests, including signing where required.
7. Fresh measured performance budgets and representative device/network baselines.
8. Full private-asset lifecycle test across upload/read/delete and cross-user denial.
9. Deployment-topology verification for `apps/web` versus `apps/mobile`.
10. GitHub branch protection and required checks for `main`.
11. Replacement of historical/documentary performance claims with current measurements.

## 7. Operating principle

**KinetixFitt should gain capabilities without losing reliability.**
