# KinetixFitt — Project State

**Status:** Living document / evidence-based  
**Last verified:** 2026-09-18  
**Repository:** `Ezequiell-26/kinetixFitt-mobile-and-web`

## 1. Evidence rule

This document is context, not proof. Current source, tests, CI, deployment and runtime evidence are authoritative. Never carry old completion claims forward without re-verification.

## 2. AI improvement control layer

The repository contains durable AI governance under `.ai/` plus `.github/agents` and `.github/skills`, including audit, evidence, feature ledger, integration registry, performance baselines, definition of done and execution protocol.

## 3. Architecture state

The repository contains `apps/mobile` and `apps/web` with explicit roles. Current production/deployment topology still needs verification so the deployed surface matches the intended architecture.

Technology includes Next.js, React, TypeScript, Prisma/PostgreSQL, Stripe, Mercado Pago, S3-compatible storage, Capacitor, Electron, Three.js/R3F, Sentry, Zod, Recharts, Framer Motion, Web Push/VAPID and Upstash rate limiting.

## 4. 2026-09-18 hardening on `main`

### Notifications / API input integrity
- `POST /api/notifications` uses a strict Zod schema for its mutation payload.
- The route still supports both existing behaviors: mark one own notification as read, or mark all own unread notifications as read when the payload is `{}`.
- Unknown payload keys, blank IDs and non-string IDs are rejected with `400` instead of being silently accepted.
- Added a focused unit test covering the notification mutation contract and included it in `test:unit`.
- Source-level review is complete for the API contract; CI/runtime verification for the latest commit remains pending.

### Notifications / accessibility and UX
- `NotificationsBell` now exposes `aria-expanded` and `aria-haspopup` on the trigger.
- The bell icon and unread indicator are hidden from redundant screen-reader output while the trigger label includes the unread count.
- The popover uses dialog semantics, a polite live region for notification content, explicit button types, and Escape-key dismissal.
- Existing polling, offline guard, routing and mark-all behavior are preserved.
- This is a source-level accessibility hardening batch; keyboard focus trapping and full browser/assistive-technology verification remain unverified.

### PWA / offline
- PWA manifest no longer references screenshot assets absent from the repository.
- Service Worker no longer caches `/api/*` responses or authenticated dashboard navigations.
- Service Worker offline mutation paths match real APIs (`/api/workout-logs`, `/api/checkins`, `/api/measurements`, `/api/progress-photos`).
- Service Worker outbox uses a dedicated IndexedDB database (`kinetixfitt-sw-outbox`) separate from client offline sync.
- Retry limits and non-retryable HTTP handling are bounded.

### Measurements / data integrity
- `/api/measurements` uses strict Zod validation and numeric bounds.
- Client writes resolve the authenticated client server-side.
- Trainer writes require trainer ownership of the target client.
- Reads are scoped to the authenticated client/trainer relationship.

### Payments / webhook trust
- Payment checkout already uses provider-specific idempotency and local payment records.
- Stripe and Mercado Pago webhook events remain atomically claimed and provider-signed.
- Webhook settlement now requires an explicit KinetixFitt `paymentId`; it no longer falls back to an arbitrary pending payment for a client.
- Webhook settlement validates provider amount and currency against the stored payment before changing payment state.

### Auth / account integrity
- Public registration creates `User`, `Profile`, and the related `Client` record inside one Prisma transaction, preventing partial accounts when a downstream write fails.
- Duplicate-email rejection is handled inside the transaction and mapped to the existing public `400` contract.

### CI / AI guard
- Static AI repository guard was refined so comment-only mentions such as a honeypot's "falso" response do not become blocking fake-code findings.
- The duplicate `providerCheckoutId` migration is idempotent while preserving migration history.
- The latest commit currently has no green CI conclusion claimed until runtime verification is visible.

### Multiplatform
- Windows: Electron NSIS target + CI.
- macOS: Electron DMG target + CI.
- Android: Capacitor generation/sync + debug APK workflow + separate signed AAB workflow.
- iOS: Capacitor generation/sync on macOS + iOS Simulator artifact workflow.
- Electron uses sandboxed renderer, context isolation, disabled Node integration and same-origin navigation checks.
- Native projects remain generated rather than committed to avoid platform drift.
- Platform verifier checks monorepo layout, dependency locations and manifest asset references.

## 5. Verification state

Source/configuration has been deeply inspected through GitHub. The repository cannot yet be declared fully production-ready from source inspection alone. Runtime/device/provider evidence is still required.

The accessibility hardening batch is integrated on `main` at commit `f806470b68e96d505302bb6bae2f55293a3dfbdc`. Source-level verification covers the notification trigger/popover semantics and preserved behavior. CI/runtime verification for this commit is not yet visible.

## 6. Remaining release blockers

1. Green CI result for the latest `main` commit.
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
