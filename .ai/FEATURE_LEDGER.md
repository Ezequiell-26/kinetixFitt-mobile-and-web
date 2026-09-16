# KinetixFitt — Feature Truth Ledger

**Purpose:** durable, evidence-based inventory of product capabilities so future AI agents can improve the project without mistaking code presence for working functionality.

## Rules

- This file is a ledger, not a promise.
- Never mark a feature `COMPLETE` without evidence appropriate to its risk.
- After a meaningful change, re-verify affected rows and downgrade stale evidence.
- Prefer linking to exact source/test paths and commands.
- `E2_STATIC` means current source/config inspection.
- `E3_AUTOMATED` means executable tests/build/typecheck/lint/migration evidence.
- `E4_RUNTIME` means real runtime/provider/device/deployment evidence.

## Status vocabulary

`COMPLETE | PARTIAL | MOCK | BROKEN | BLOCKED_EXTERNAL | NOT_IMPLEMENTED`

## Evidence vocabulary

`UNVERIFIED | E2_STATIC | E3_AUTOMATED | E4_RUNTIME`

## Ledger

| Domain | Feature | Entry points | Backend/domain | Persistence | External | Auth boundary | Tests | Status | Evidence | Known gaps | Last verified |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Auth | Login | Current auth routes/screens | Current auth implementation | User/session data | Email/provider config where applicable | Session user | Auth/security + E2E | UNVERIFIED | E2_STATIC | Runtime proof required | 2026-09-17 |
| Training | Programs/workouts | Current training routes/screens | Training domain/API | Prisma/PostgreSQL | None/optional | Client/trainer ownership | Unit + E2E | UNVERIFIED | E2_STATIC | Complete journey + offline proof | 2026-09-17 |
| Progress | Progress/check-ins/measurements | Current progress/check-in/measurement routes | Progress APIs | Prisma/PostgreSQL | Optional notifications | Owner/trainer ownership | Security + E2E | UNVERIFIED | E2_STATIC | Runtime proof required | 2026-09-17 |
| Messaging | Coach/client messages | `apps/mobile/src/app/api/messages/route.ts` + UI | Messages API + delivery trigger | Prisma/PostgreSQL + Notification/PushSubscription | Web Push where configured | Assigned-trainer/client boundary | Security + E2E | UNVERIFIED | E2_STATIC | Runtime proof required; real push delivery | 2026-09-17 |
| Payments | Checkout/subscriptions | Payment UI/API | Payments API/webhooks | Prisma/PostgreSQL | Stripe / Mercado Pago where configured | Auth + provider trust | Webhook/idempotency tests | BLOCKED_EXTERNAL | E2_STATIC | Webhook now binds to exact local payment and validates amount/currency; real provider E2E + deployed callback proof still required | 2026-09-17 |
| Storage | Private assets/uploads | Upload/serve routes | Storage validation + authenticated serve | ProgressPhoto + filesystem/S3-compatible provider | Storage provider where configured | Owner/client/trainer boundary | Upload/security tests | PARTIAL | E2_STATIC | Provider/runtime lifecycle proof; broader asset integration | 2026-09-17 |
| AI | AI capabilities | Current AI routes/UI | AI provider boundary with explicit OpenAI/GLM configuration | Usage/config where applicable | Provider API | Auth + client ownership + rate limit | AI/security tests where present | PARTIAL | E2_STATIC | Runtime provider test, cost accounting, fallback/capability registry | 2026-09-17 |
| Notifications | Push/email/in-app | Current notification routes/UI | Reusable push delivery helper + push sender + preference API + message/check-in triggers | Notification + NotificationPreference + PushSubscription | Web Push where configured | Internal send secret + user-owned preferences | Platform smoke tests | PARTIAL | E2_STATIC | Real device delivery, scheduled automation, email delivery | 2026-09-17 |
| PWA | PWA/service worker | Manifest/service worker routes | Offline outbox + Workbox | IndexedDB + browser cache | Browser APIs | Same-origin mutation allowlist | Platform smoke tests | PARTIAL | E2_STATIC | Browser/device offline runtime proof | 2026-09-17 |
| Native | Windows desktop | Tauri shell + `desktop:build:win`; Electron fallback | Rust/Tauri hardened window | N/A | Deployed KinetixFitt URL | Remote application origin | Native CI | PARTIAL | E2_STATIC | Actual CI installer + installed EXE/update smoke test + signing | 2026-09-17 |
| Native | macOS desktop | Tauri shell + `desktop:build:mac`; Electron fallback | Rust/Tauri hardened window | N/A | Deployed KinetixFitt URL | Remote application origin | Native CI | PARTIAL | E2_STATIC | Actual CI DMG + installed/update smoke test + signing/notarization | 2026-09-17 |
| Native | Android | Capacitor config + Android generation/sync + debug/signed workflows | Capacitor Android bridge | Platform storage | HTTPS `CAPACITOR_SERVER_URL` | Platform permissions + app server session | Native CI | PARTIAL | E2_STATIC | CI APK/AAB result + device smoke test + production signing evidence | 2026-09-17 |
| Native | iOS | Capacitor config + macOS native workflow + iOS Simulator build | Capacitor iOS bridge | Platform storage | HTTPS `CAPACITOR_SERVER_URL` | Platform permissions + app server session | Native CI | PARTIAL | E2_STATIC | CI simulator result + real-device smoke + signed archive/IPA/App Store provisioning | 2026-09-17 |
| Performance | Core web/mobile performance | Critical screens | Client/server runtime | N/A | Browser/device APIs | N/A | Performance checks where present | UNVERIFIED | E2_STATIC | Fresh measured baselines and budgets | 2026-09-17 |

## Deep audit notes — 2026-09-17

- PWA manifest references only assets present in `apps/mobile/public/icons/`.
- Service Worker does not cache private API responses or authenticated dashboard pages and uses a dedicated outbox database.
- `apps/web/app/pwa-config.ts` now rejects unsafe/non-API offline endpoints, enforces a bounded queue and retries only recoverable failures.
- The web TypeScript project now includes `app/pwa-config.ts` in verification instead of explicitly excluding it.
- Obsolete `apps/web/app/page.tsx.new` was removed; the active landing entrypoint is `apps/web/app/page.tsx` → `components/landing-pro`.
- Measurements API uses strict validation and server-side ownership resolution.
- Payment webhook settlement is scoped to the exact local payment record and checks provider amount/currency before settlement.
- Audit event IDs now use valid UUIDs so they satisfy `AuditEventSchema` instead of failing validation before persistence.
- Web analytics client/server payloads are aligned (`event` + ISO `timestamp`), page-view initialization is browser-only, and workout completion metrics no longer assume exactly ten exercises.
- AI repository guard no longer treats comment-only `fake`/`falso` wording as a blocking high-risk finding; actual source-code findings remain blocking.
- `apps/web` development uses port 3002 while `apps/mobile` uses 3001.
- Windows/macOS now use Tauri as the primary desktop shell; Electron remains an explicit fallback.
- Capacitor native builds use a minimal `native-shell` instead of packaging the heavy `public/` asset tree.
- Prisma schema was restored from the last known complete model and then amended only with the migration-backed `checkinReminders` field after detecting an accidental destructive overwrite in commit `80cd3651e2d6fb42fe252185be75d927b9e328e1`.

## Verification caveat

Current source/configuration is still `E2_STATIC` until the latest GitHub Actions run becomes green and provider/device/deployment checks are executed. The most recent CI run for the analytics fix was still pending at the time of this audit. Vercel status checks are currently failing with a `build-rate-limit` target, so deployment/build verification is externally constrained. Do not mark affected domains complete merely because code paths exist.
