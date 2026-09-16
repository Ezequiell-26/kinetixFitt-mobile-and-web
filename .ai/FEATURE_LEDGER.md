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
| Progress | Progress/check-ins | Current progress/check-in routes | Progress APIs | Prisma/PostgreSQL | Optional notifications | Owner/trainer ownership | Security + E2E | UNVERIFIED | E2_STATIC | Runtime proof required | 2026-09-17 |
| Messaging | Coach/client messages | `apps/mobile/src/app/api/messages/route.ts` + UI | Messages API + delivery trigger | Prisma/PostgreSQL + Notification/PushSubscription | Web Push where configured | Assigned-trainer/client boundary | Security + E2E | UNVERIFIED | E2_STATIC | Runtime proof required; real push delivery | 2026-09-17 |
| Payments | Checkout/subscriptions | Payment UI/API | Payments API/webhooks | Prisma/PostgreSQL | Stripe / Mercado Pago where configured | Auth + provider trust | Webhook/idempotency tests | BLOCKED_EXTERNAL | E2_STATIC | Real provider E2E + deployed webhook proof | 2026-09-17 |
| Storage | Private assets/uploads | Upload/serve routes | Storage validation + authenticated serve | ProgressPhoto + filesystem/S3-compatible provider | Storage provider where configured | Owner/client/trainer boundary | Upload/security tests | PARTIAL | E2_STATIC | Provider/runtime lifecycle proof; broader asset integration | 2026-09-17 |
| AI | AI capabilities | Current AI routes/UI | AI provider boundary with explicit OpenAI/GLM configuration | Usage/config where applicable | Provider API | Auth + client ownership + rate limit | AI/security tests where present | PARTIAL | E2_STATIC | Runtime provider test, cost accounting, fallback/capability registry | 2026-09-17 |
| Notifications | Push/email/in-app | Current notification routes/UI | Reusable push delivery helper + push sender + preference API + message/check-in triggers | Notification + NotificationPreference + PushSubscription | VAPID/Web Push | Internal send secret + user-owned preferences | Platform smoke tests | PARTIAL | E2_STATIC | Real device delivery, scheduled automation, email delivery | 2026-09-17 |
| PWA | PWA/service worker | Manifest/service worker routes | Offline outbox + Workbox | IndexedDB + browser cache | Browser APIs | Same-origin mutation allowlist | Platform smoke tests | PARTIAL | E2_STATIC | Browser/device offline runtime proof | 2026-09-17 |
| Native | Windows desktop | Electron shell + `desktop:build:win` + native workflow | Electron hardened renderer | N/A | Deployed KinetixFitt URL | Same-origin renderer navigation | Native CI | PARTIAL | E2_STATIC | CI build result + installed EXE/update smoke test | 2026-09-17 |
| Native | macOS desktop | Electron shell + `desktop:build:mac` + native workflow | Electron hardened renderer | N/A | Deployed KinetixFitt URL | Same-origin renderer navigation | Native CI | PARTIAL | E2_STATIC | CI build result + installed DMG/update smoke test | 2026-09-17 |
| Native | Android | Capacitor config + Android generation/sync + debug/signed workflows | Capacitor Android bridge | Platform storage | HTTPS `CAPACITOR_SERVER_URL` | Platform permissions + app server session | Native CI | PARTIAL | E2_STATIC | CI APK/AAB result + device smoke test + production signing evidence | 2026-09-17 |
| Native | iOS | Capacitor config + macOS native workflow + iOS Simulator build | Capacitor iOS bridge | Platform storage | HTTPS `CAPACITOR_SERVER_URL` | Platform permissions + app server session | Native CI | PARTIAL | E2_STATIC | CI simulator result + real-device smoke + signed archive/IPA/App Store provisioning | 2026-09-17 |
| Performance | Core web/mobile performance | Critical screens | Client/server runtime | N/A | Browser/device APIs | N/A | Performance checks where present | UNVERIFIED | E2_STATIC | Fresh measured baselines and budgets | 2026-09-17 |

## Current evidence notes

- Push registration and delivery use the Prisma `PushSubscription` persistence layer rather than an independent Supabase subscription table.
- `apps/mobile/src/lib/push-server.ts` centralizes server-side Web Push delivery and applies category preferences plus timezone-aware quiet hours.
- Message creation and check-in creation/review now trigger Push asynchronously while retaining in-app notifications.
- Message sends, check-in writes/reviews and uploads are rate limited through the existing Upstash/fallback limiter.
- Upload serving binds avatars to their owner or their assigned trainer, while progress/check-in/message assets continue to enforce resource ownership.
- Upload creation uses strict MIME/magic-byte validation, bounded size, server-generated filenames and exclusive file creation to reduce overwrite risk.
- Windows and macOS use the hardened Electron shell with context isolation, renderer sandboxing, disabled Node integration and same-origin navigation enforcement.
- Android uses the declared Capacitor Android package and native generation/sync pipeline. iOS is generated reproducibly in CI by installing `@capacitor/ios@8.5.2` without mutating the repository lockfile; this keeps the current lockfile stable but means iOS platform setup is intentionally a build-time platform dependency.
- Native builds explicitly require an HTTPS `CAPACITOR_SERVER_URL`, preventing accidental packaged apps from relying on the incomplete static `public` directory.
- Source/configuration presence is `E2_STATIC`; actual runner execution, device behavior, provider delivery and production deployment remain unverified until CI/runtime evidence exists.

## How to extend

When adding a feature, add its ledger row in the same change when practical. Do not copy an old row's status blindly.
