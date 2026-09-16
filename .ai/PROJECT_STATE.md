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

The repository contains a persistent operating layer intended to prevent regression and hallucinated completion claims:

- `.ai/AI_CONTROL_CENTER.md` — first entry point for open-ended improvement/audit work.
- `.ai/AI_ENGINEERING_SYSTEM.md` — preservation, evidence, anti-hallucination, risk, verification, rollback and performance rules.
- `.ai/FEATURE_LEDGER.md` — canonical living ledger for important product capabilities and evidence.
- `.ai/INTEGRATION_REGISTRY.md` — canonical registry for external APIs, SDKs, providers and repositories.
- `.ai/PERFORMANCE_BASELINES.md` — canonical registry for cross-device performance baselines and regressions.
- `scripts/ai-repo-audit.mjs` — repeatable static repository inventory and risk-signal audit.
- `npm run ai:audit` / `ai:audit:json` / `ai:audit:strict` — repeatable audit commands.
- CI executes the strict static audit before dependency installation and the normal quality gates.
- `.github/agents/manifest.json` + `.github/skills/agent-orchestration/SKILL.md` define specialized agent routing and safe improvement loops.

This layer provides static evidence and guardrails. It does NOT by itself prove production runtime behavior, external-provider delivery, store approval, or device behavior.

## 3. Current repository shape

The current repository is a multi-package project containing application code, shared packages, AI governance, documentation, CI/CD and platform-specific code.

The repository contains both `apps/mobile` and `apps/web`. Their roles must remain explicit and must not silently drift into two competing production implementations.

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
- Web Push / VAPID
- Upstash Redis rate limiting

Installed versions and exact package ownership must always be read from the current lockfiles/package manifests before upgrades or architecture changes.

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

## 8. Main branch policy and current control state

`main` is intended to represent a stable integration/release state.

Current GitHub branch inspection shows `main` is not protected and has no required status checks configured. This is a repository-control gap, not a code defect, and should be enabled in GitHub before treating `main` as a fully gated release branch.

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
- notification delivery

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

Payment, authorization, secret-management, deployment and branch-governance failures are release blockers.

## 12. 2026-09-16 hardening record

### Existing hardening retained
- `/client/tools` category navigation synchronizes its `?cat=` URL state with browser back/forward and shared category links.
- Web Push activation in `PushCenter` obtains the VAPID public key, registers the Service Worker subscription, and persists the subscription through `/api/push/subscribe`.
- `/api/push/public-key` exposes only the non-secret VAPID public key and returns `503` when push infrastructure is not configured.
- The global mobile 404 experience follows the KinetixFitt visual system and keeps the primary recovery path accessible.
- Service Worker mutation outbox uses persistent IndexedDB storage, bounded same-origin allowlisted API routes, preserved request bodies/headers and retry handling.
- `apps/mobile/src/lib/offline-sync.ts` uses IndexedDB as the primary client outbox with legacy `localStorage` migration.
- Notification preferences persist global enablement and a dedicated `checkinReminders` flag via a versioned Prisma migration.
- Push sending reads the same `PushSubscription` persistence layer as registration, filters recipients against `NotificationPreference`, and supports a typed notification category.
- KinetixFitt AI provider configuration distinguishes OpenAI and GLM-style deployments and rejects incomplete GLM configuration rather than sending a GLM key to the OpenAI default endpoint.
- AI context handling explicitly marks database-derived context as data, while trainer client scoping remains protected by `assertTrainerOwnsClient()`.
- `apps/mobile/tests/e2e/platform-smoke.spec.ts` covers public health boundaries, notification/push auth boundaries, unsigned webhook rejection and VAPID public-key exposure.
- `.ai/FEATURE_LEDGER.md` is maintained as the evidence-oriented feature state rather than relying on historical completion claims.

### New changes in the current pass
- Added `apps/mobile/src/lib/push-server.ts` as a reusable server-side Web Push delivery boundary.
- The delivery helper enforces notification preferences, push opt-in and quiet hours using the user's configured timezone; it deactivates expired 404/410 subscriptions.
- New check-ins now create an in-app trainer notification and asynchronously trigger a typed Push notification.
- Trainer check-in replies now create an in-app client notification and asynchronously trigger Push using the message-preference category.
- New coach/client messages are now rate limited through the existing distributed/fallback limiter and asynchronously trigger Push using the `coach_message` preference category.
- Check-in creation/review writes are rate limited to reduce abuse and accidental flooding.

## 13. Verification status

Current source has been inspected through GitHub and the latest `main` commit is `d83a5952be1502cee0cb13487c91bde5fb4b5e5c` (`fix: rate limit checkin writes`).

GitHub currently reports a pending Vercel status for this commit, but no completed CI/build evidence has been established in this session. A direct Vercel inspection attempt was denied by the connected account permissions. Therefore this work remains `PARTIAL / E2_STATIC` from an evidence perspective.

The repository CI already contains automated gates for AI static auditing, typecheck, lint, Prisma migration/seed, unit tests, build, security HTTP tests, Playwright E2E and web build.

## 14. Remaining release blockers / external verification

1. Obtain a completed CI/build/typecheck/lint/test result for the latest `main` commit.
2. Apply and validate all pending Prisma migrations against the target PostgreSQL environment.
3. Run real Stripe and Mercado Pago checkout/webhook tests with sandbox credentials and public webhook URLs.
4. Run real Web Push delivery on supported browsers/devices and validate preference enforcement and quiet hours.
5. Validate offline workout/check-in flows through browser termination/restart and reconnect synchronization.
6. Run Android, iOS and desktop packaging/smoke validation, including signing where required.
7. Establish fresh performance budgets and measured baselines on representative devices/network profiles.
8. Validate private asset upload/serve/delete lifecycle and cross-user access denial.
9. Review and correct the Vercel deployment topology so the deployed production surface matches the intended `apps/web` / `apps/mobile` architecture.
10. Enable GitHub branch protection/required checks for `main`.
11. Replace historical/documentary performance claims with current measured evidence.
12. Record release evidence in the feature ledger before marking release-critical domains `COMPLETE`.

## 15. Principle

**KinetixFitt should gain capabilities over time without losing reliability.**
