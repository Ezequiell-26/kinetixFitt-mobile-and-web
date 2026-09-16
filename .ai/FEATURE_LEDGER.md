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
| Auth | Login | Current auth routes/screens | Current auth implementation | User/session data | Email/provider config where applicable | Session user | Auth/security + E2E | UNVERIFIED | E2_STATIC | Runtime proof required | 2026-09-16 |
| Training | Programs/workouts | Current training routes/screens | Training domain/API | Prisma/PostgreSQL | None/optional | Client/trainer ownership | Unit + E2E | UNVERIFIED | E2_STATIC | Complete journey + offline proof | 2026-09-16 |
| Progress | Progress/check-ins | Current progress/check-in routes | Progress APIs | Prisma/PostgreSQL | Optional notifications | Owner/trainer ownership | Security + E2E | UNVERIFIED | E2_STATIC | Runtime proof required | 2026-09-16 |
| Messaging | Coach/client messages | `apps/mobile/src/app/api/messages/route.ts` + UI | Messages API + delivery trigger | Prisma/PostgreSQL + Notification/PushSubscription | Web Push where configured | Assigned-trainer/client boundary | Security + E2E | UNVERIFIED | E2_STATIC | Runtime proof required; real push delivery | 2026-09-16 |
| Payments | Checkout/subscriptions | Payment UI/API | Payments API/webhooks | Prisma/PostgreSQL | Stripe / Mercado Pago where configured | Auth + provider trust | Webhook/idempotency tests | BLOCKED_EXTERNAL | E2_STATIC | Real provider E2E + deployed webhook proof | 2026-09-16 |
| Storage | Private assets/uploads | Upload/serve routes | Storage validation + authenticated serve | ProgressPhoto + filesystem/S3-compatible provider | Storage provider where configured | Owner/client/trainer boundary | Upload/security tests | PARTIAL | E2_STATIC | Provider/runtime lifecycle proof; broader asset integration | 2026-09-16 |
| AI | AI capabilities | Current AI routes/UI | AI provider boundary with explicit OpenAI/GLM configuration | Usage/config where applicable | Provider API | Auth + client ownership + rate limit | AI/security tests where present | PARTIAL | E2_STATIC | Runtime provider test, cost accounting, fallback/capability registry | 2026-09-16 |
| Notifications | Push/email/in-app | Current notification routes/UI | Reusable push delivery helper + push sender + preference API + message/check-in triggers | Notification + NotificationPreference + PushSubscription | VAPID/Web Push | Internal send secret + user-owned preferences | Platform smoke tests | PARTIAL | E2_STATIC | Real device delivery, scheduled automation, email delivery | 2026-09-16 |
| PWA | PWA/service worker | Manifest/service worker routes | Offline outbox + Workbox | IndexedDB + browser cache | Browser APIs | Same-origin mutation allowlist | Platform smoke tests | PARTIAL | E2_STATIC | Browser/device offline runtime proof | 2026-09-16 |
| Native | Android/iOS/desktop | Native projects/workflows | Native bridges | Platform storage | Device services | Platform permissions | Native CI/smoke tests | PARTIAL | E2_STATIC | Real builds/signing/device verification | 2026-09-16 |
| Performance | Core web/mobile performance | Critical screens | Client/server runtime | N/A | Browser/device APIs | N/A | Performance checks where present | UNVERIFIED | E2_STATIC | Fresh measured baselines and budgets | 2026-09-16 |

## Current evidence notes

- Push registration and delivery use the Prisma `PushSubscription` persistence layer rather than an independent Supabase subscription table.
- `apps/mobile/src/lib/push-server.ts` centralizes server-side Web Push delivery and applies category preferences plus timezone-aware quiet hours.
- Message creation and check-in creation/review now trigger Push asynchronously while retaining in-app notifications.
- Message sends, check-in writes/reviews and uploads are rate limited through the existing Upstash/fallback limiter.
- Upload serving now binds avatars to their owner or their assigned trainer, while progress/check-in/message assets continue to enforce resource ownership.
- Upload creation uses strict MIME/magic-byte validation, bounded size, server-generated filenames and exclusive file creation to reduce overwrite risk.
- Source-level presence of these integrations is `E2_STATIC`; real browser/device delivery, provider behavior and deployed storage remain unverified until exercised in runtime.

## How to extend

When adding a feature, add its ledger row in the same change when practical. Do not copy an old row's status blindly.
