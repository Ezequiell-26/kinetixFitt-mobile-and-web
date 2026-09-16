# KinetixFitt — Project State

**Status:** Living document / evidence-based  
**Last verified:** 2026-09-16  
**Repository:** `Ezequiell-26/kinetixFitt-mobile-and-web`

## 1. How to read this document

This file is CONTEXT, not proof.

Do not infer that a subsystem is production-ready because a feature appears in this document. Current code, tests, CI, deployment, and runtime evidence are authoritative.

Never copy an old metric or completion claim into a new report without re-verifying it.

For AI-driven continuous improvement, start with `.ai/AI_CONTROL_CENTER.md`, `.ai/AI_ENGINEERING_SYSTEM.md`, and `node scripts/ai-repo-audit.mjs`.

## 2. AI continuous-improvement control layer

The repository now contains a persistent operating layer intended to prevent regression and hallucinated completion claims:

- `.ai/AI_CONTROL_CENTER.md` — first entry point for open-ended improvement/audit work.
- `.ai/AI_ENGINEERING_SYSTEM.md` — preservation, evidence, anti-hallucination, risk, verification, rollback and performance rules.
- `.ai/FEATURE_LEDGER.md` — canonical living ledger for important product capabilities and evidence.
- `.ai/INTEGRATION_REGISTRY.md` — canonical registry for external APIs, SDKs, providers and repositories.
- `.ai/PERFORMANCE_BASELINES.md` — canonical registry for cross-device performance baselines and regressions.
- `scripts/ai-repo-audit.mjs` — dependency-free static repository inventory and risk-signal audit.
- `npm run ai:audit` / `ai:audit:json` / `ai:audit:strict` — repeatable audit commands.
- CI executes the strict static audit before dependency installation and the normal quality gates.

This layer provides static evidence and guardrails. It does NOT by itself prove production runtime behavior, external-provider delivery, store approval, or device behavior.

## 3. Current repository shape

The repository is a multi-package project containing application code, shared packages, AI governance, documentation, CI/CD and platform-specific code.

The repository currently contains both `apps/mobile` and `apps/web`. Their roles must remain explicit and must not silently drift into two competing production implementations.

## 4. Current technology signals from the repository

The current codebase includes, among other technologies:

- Next.js / React / TypeScript
- Prisma
- PostgreSQL / Supabase integration
- Stripe
- AWS S3 SDK
- Capacitor
- Electron
- Three.js / React Three Fiber
- Sentry
- Zod
- React Hook Form
- Recharts
- Framer Motion

The installed versions and exact package ownership must always be read from the current lockfiles/package manifests before upgrades or architecture changes.

## 5. Major product domains present

The repository contains or references functionality for:

- Coach / trainer workflows
- Athlete / client workflows
- authentication and sessions
- training/program/workout flows
- progress and analytics
- check-ins and messaging
- notifications / PWA
- nutrition
- recovery
- calculators
- 3D / interactive experiences
- AI-related functionality
- payments/subscriptions
- backups
- mobile/desktop platform integration

Presence of code is not equivalent to end-to-end completion.

## 6. Verification policy

The current state of every important subsystem must be classified using:

- `COMPLETE`
- `PARTIAL`
- `MOCK`
- `BROKEN`
- `BLOCKED_EXTERNAL`
- `NOT_IMPLEMENTED`

A state claim requires evidence from current code/tests/build/deployment/runtime as applicable.

## 7. Known governance facts

`AGENTS.md` is the repository-wide engineering constitution for AI and human contributors.

`.ai/INDEX.md` defines the document hierarchy and routing rules.

`.ai/AI_CONTROL_CENTER.md` defines how an agent starts and prioritizes open-ended improvement work.

`.ai/AI_ENGINEERING_SYSTEM.md` defines evidence levels and preservation/verification rules.

`.ai/FEATURE_LEDGER.md` defines the feature evidence ledger.

`.ai/INTEGRATION_REGISTRY.md` defines external dependency governance.

`.ai/PERFORMANCE_BASELINES.md` defines measured performance tracking.

`.ai/DEFINITION_OF_DONE.md` defines completion gates.

`.ai/EXECUTION_PROTOCOL.md` defines the mandatory incremental change workflow.

`.ai/DECISIONS/` is the location for architectural decision records.

## 8. Main branch policy

`main` is intended to represent a stable integration/release state.

Normal feature work should happen on feature branches and enter `main` only after appropriate verification/review.

Repository settings/branch protection must be checked directly; this document does not itself enforce GitHub settings.

## 9. Database policy

PostgreSQL/Supabase is the intended persistent data source for the current architecture.

All production schema changes must use versioned migrations and compatibility-aware deployment steps.

Do not describe database persistence as verified without a real persistence test for the affected path.

## 10. Security policy

Security-sensitive changes must be tested separately from ordinary feature logic.

Critical surfaces include:

- authentication
- sessions
- authorization/ownership
- payments
- webhooks
- storage
- secrets
- database migrations
- offline sync
- native bridges

## 11. Current release gate

A production release is blocked until all release-critical areas have a current evidence-based status and all applicable gates pass.

At minimum:

- build
- typecheck
- lint
- relevant tests
- security tests
- database migration validation
- deployment/preview validation
- critical user journeys

Payment, authorization, secret-management, and deployment failures are release blockers.

## 12. 2026-09-16 change record

### Previously merged
- `/client/tools` category navigation now synchronizes its `?cat=` URL state with browser back/forward and shared category links.
- Web Push activation in `PushCenter` now obtains the VAPID public key, registers the Service Worker subscription, and persists the subscription through `/api/push/subscribe`.
- `/api/push/public-key` exposes only the non-secret VAPID public key and returns `503` when push infrastructure is not configured.
- The global mobile 404 experience follows the KinetixFitt visual system and keeps the primary recovery path accessible.
- Those changes were merged to `main` in commit `663ef2c775523d38d2292c37855ab06a4d03a7ad`.
- Vercel previously reported an external `build-rate-limit`; this must not be confused with a confirmed application build failure.

### Current iteration
- The Service Worker offline mutation queue now uses IndexedDB persistence for a bounded allowlist of same-origin API mutations, retains request bodies/headers needed for replay, registers Background Sync when available, and applies retry limits. This reduces the previous in-memory queue/data-loss risk.
- The client offline outbox in `apps/mobile/src/lib/offline-sync.ts` now uses IndexedDB as its primary store, with migration from the legacy `localStorage` queue and a compatibility cache for synchronous callers.
- Push notification preferences are now interactive in `PushCenter` rather than read-only UI controls. Workout, check-in and coach-message preferences are persisted through `/api/notification-preferences`.
- `NotificationPreference` now has a dedicated `checkinReminders` field and the versioned migration `20260916200000_checkin_notification_preference` adds it with a safe `DEFAULT true`.
- The notification-preferences API now exposes the persisted `enabled` state and maps `checkin_reminder` to the dedicated database field.
- `KinetixFitt AI` provider configuration now distinguishes OpenAI and GLM-style deployments, refuses an incomplete GLM configuration instead of accidentally using a GLM key against the OpenAI default endpoint, bounds output tokens, and explicitly marks database context as data rather than instructions.
- AI client scoping remains protected by `assertTrainerOwnsClient()` before trainer access to client-specific context.

### Verification status for this iteration
- GitHub combined status for commit `e9aa20e17fc477bfcc3fb5cc09cf8d5f910b6314` returned no status entries.
- GitHub workflow lookup for commit `e9aa20e17fc477bfcc3fb5cc09cf8d5f910b6314` returned no workflow runs.
- Therefore this iteration is `UNVERIFIED_RUNTIME` / `PARTIAL` from an evidence perspective: code was updated on `main`, but build, typecheck, tests, migration application and live runtime verification were not executed through the available GitHub interface.
- The next release gate is to run the repository's real typecheck/lint/unit/security/E2E gates, validate the new Prisma migration against the target PostgreSQL database, and perform a deployment/preview smoke test.

## 13. Updating this document

Update this document after material changes to:

- architecture
- database/schema
- authentication/security
- payment systems
- storage
- platforms
- deployment
- major product capabilities
- AI governance or repository verification tooling
- external integrations
- performance baselines

Use exact dates and verifiable statements.

## 14. Principle

**KinetixFitt should gain capabilities over time without losing reliability.**