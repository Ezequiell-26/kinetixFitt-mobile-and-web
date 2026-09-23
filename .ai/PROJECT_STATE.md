# KinetixFitt — Project State

**Status:** Living document / evidence-based  
**Last verified:** 2026-09-22  
**Repository:** `Ezequiell-26/kinetixFitt-mobile-and-web`

## 1. Evidence rule

This document is context, not proof. Current source, tests, CI, deployment and runtime evidence are authoritative. Never carry old completion claims forward without re-verification.

## 2. AI improvement control layer

The repository contains durable AI governance under `.ai/` plus `.github/agents` and `.github/skills`, including audit, evidence, feature ledger, integration registry, performance baselines, definition of done and execution protocol.

## 3. Architecture state

The repository contains `apps/mobile` and `apps/web` with explicit roles. Current production/deployment topology still needs verification so the deployed surface matches the intended architecture.

Technology includes Next.js, React, TypeScript, Prisma/PostgreSQL, Stripe, Mercado Pago, S3-compatible storage, Capacitor, Electron, Three.js/R3F, Sentry, Zod, Recharts, Framer Motion, Web Push/VAPID and Upstash rate limiting.

## 4. 2026-09-22 hardening on `main`

### Notifications / accessibility and UX
- The notification trigger exposes `aria-controls` pointing to the rendered dialog panel ID.
- The notification control restores focus to the trigger after Escape, backdrop dismissal or any other close state transition.
- The notification dialog uses `aria-modal="true"` and traps `Tab`/`Shift+Tab` focus within its interactive controls while open.
- Focus restoration no longer runs on initial component mount; it only runs after an actual open → close transition, avoiding an unintended focus jump for keyboard and assistive-technology users.
- Existing polling guards, live-region behavior and notification actions are preserved.
- These are small source-level accessibility improvements; browser, assistive-technology and mobile viewport verification remain unverified.

## 5. Existing verified/partial areas

- Notification mutation input validation, ownership checks and focused unit coverage are implemented.
- Registration transaction integrity, measurement ownership validation, webhook signature/amount checks, upload hardening and bounded offline retry behavior are implemented at source level.
- PWA caching rules, native packaging workflows, payments, push, storage, AI provider behavior and deployment topology remain partial or externally dependent until runtime evidence exists.

## 6. Verification state

The focus-restoration accessibility change was integrated into `main` in commit `7c74d4622c4cc7932021c7a9b6e91f60f8c29aef`. The keyboard focus-trap change was integrated into `main` in commit `80da0ce289f61dfd66358105c9b772b627868a44`. The mount-focus regression fix was integrated into `main` in commit `c3a6fd735fc01a992366a0660b498f2fdd3dc25e`. Source-level verification was performed by reviewing the updated component. CI/runtime/browser/assistive-technology verification for the latest commit is not yet visible and is therefore not claimed.

## 7. Remaining release blockers

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

## 8. Operating principle

**KinetixFitt should gain capabilities without losing reliability.**
