"use client";

import posthog from "posthog-js";

/**
 * PostHog Analytics — KinetixFitt Mobile
 * Centraliza init + capture para retención. No romper si no hay key / SSR.
 */

export type PostHogEvent =
  | "pageview"
  | "workout_started"
  | "workout_completed"
  | "workout_paused"
  | "workout_abandoned"
  | "exercise_completed"
  | "set_completed"
  | "checkin_completed"
  | "checkin_sent"
  | "onboarding_started"
  | "onboarding_step"
  | "onboarding_step_viewed"
  | "onboarding_funnel_step"
  | "onboarding_cta_clicked"
  | "onboarding_goal_selected"
  | "onboarding_days_selected"
  | "onboarding_place_selected"
  | "onboarding_next"
  | "onboarding_back"
  | "onboarding_abandoned"
  | "onboarding_completed"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_plan_selected"
  | "payment_started"
  | "payment_completed"
  | "payment_failed"
  | "revenue_tracked"
  | "revenue_mrr_updated"
  | "revenue_dashboard_viewed"
  | "mrr_dashboard_viewed"
  | "trainer_payments_viewed"
  | "subscription_started"
  | "subscription_cancelled"
  | "achievement_unlocked"
  | "level_up"
  | "pr_achieved"
  | "cta_clicked"
  | "feature_discovered";

let _initialized = false;

export function initPostHog(): void {
  if (_initialized) return;
  if (typeof window === "undefined") return;

  const configuredKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!configuredKey || configuredKey.startsWith("phc_placeholder")) {
    if (process.env.NODE_ENV === "development") {
      console.info("[PostHog] Disabled — NEXT_PUBLIC_POSTHOG_KEY is not configured.");
    }
    _initialized = false;
    return;
  }

  const key = configuredKey;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  try {
    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage",
      autocapture: false,
      loaded: (ph) => {
        if (key.startsWith("phc_placeholder")) {
          ph.opt_out_capturing();
          if (process.env.NODE_ENV === "development") {
            console.info("[PostHog] Placeholder key — capturing opt-out (dev). Set NEXT_PUBLIC_POSTHOG_KEY to enable.");
          }
        }
      },
    });
    _initialized = true;
    if (process.env.NODE_ENV === "development") {
      console.info("[PostHog] Initialized", { host, keyPrefix: key.slice(0, 8) + "..." });
    }
  } catch (e) {
    console.warn("[PostHog] init failed", e);
  }
}

export function isPostHogReady(): boolean {
  return _initialized && typeof window !== "undefined" && !!posthog;
}

export function capture(event: PostHogEvent | string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (isPostHogReady() && !posthog.has_opted_out_capturing()) {
      posthog.capture(event, {
        ...properties,
        source: "mobile",
        timestamp: new Date().toISOString(),
      });
    } else if (process.env.NODE_ENV === "development") {
      console.log(`[PostHog capture] ${event}`, properties);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[PostHog] capture error", e);
  }
}

export function identify(userId: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (isPostHogReady()) posthog.identify(userId, properties);
  } catch {}
}

export function reset(): void {
  if (typeof window === "undefined") return;
  try {
    if (isPostHogReady()) posthog.reset();
  } catch {}
}

export function setPersonProperties(properties: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (isPostHogReady()) posthog.setPersonProperties(properties as unknown as Record<string, string>);
  } catch {}
}

export function trackPageView(url?: string, props?: Record<string, unknown>): void {
  const path = url || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");
  capture("pageview", {
    $current_url: typeof window !== "undefined" ? window.location.href : path,
    path,
    title: typeof document !== "undefined" ? document.title : undefined,
    ...props,
  });
}

export function trackWorkoutCompleted(params: {
  workoutId: string;
  workoutName?: string;
  durationMinutes: number;
  exercisesCount?: number;
  totalVolumeKg?: number;
}): void {
  capture("workout_completed", {
    workout_id: params.workoutId,
    workout_name: params.workoutName,
    duration_minutes: params.durationMinutes,
    exercises_count: params.exercisesCount,
    total_volume_kg: params.totalVolumeKg,
  });
}

export function trackWorkoutStarted(workoutId: string, workoutName?: string): void {
  capture("workout_started", { workout_id: workoutId, workout_name: workoutName });
}

export function trackCheckin(params: { mood: number; fatigue: number; notes?: string; type?: string }): void {
  capture("checkin_completed", {
    mood_rating: params.mood,
    fatigue_rating: params.fatigue,
    notes: params.notes,
    checkin_type: params.type,
  });
  capture("checkin_sent", {
    mood_rating: params.mood,
    fatigue_rating: params.fatigue,
  });
}

export const ONBOARDING_FUNNEL_STEPS = [
  { step: 1, id: "welcome", name: "Bienvenida", name_en: "Welcome" },
  { step: 2, id: "goal", name: "Objetivo", name_en: "Goal" },
  { step: 3, id: "days", name: "Días por semana", name_en: "Days per week" },
  { step: 4, id: "place", name: "Lugar de entreno", name_en: "Place" },
] as const;

export type OnboardingFunnelStepId = (typeof ONBOARDING_FUNNEL_STEPS)[number]["id"];

export function trackOnboardingStarted(props?: Record<string, unknown>): void {
  capture("onboarding_started", {
    funnel: "onboarding_main",
    total_steps: 4,
    ...props,
  });
}

export function trackOnboardingStep(step: number | string, props?: Record<string, unknown>): void {
  capture("onboarding_step", { step, funnel: "onboarding_main", ...props });
  if (typeof step === "number" && step >= 1 && step <= 4) {
    const def = ONBOARDING_FUNNEL_STEPS.find((s) => s.step === step);
    capture("onboarding_step_viewed", {
      step,
      step_name: def?.id ?? String(step),
      step_label: def?.name ?? String(step),
      funnel: "onboarding_main",
      funnel_order: step,
      ...props,
    });
    capture("onboarding_funnel_step", {
      step,
      step_name: def?.id ?? String(step),
      funnel: "onboarding_main",
      funnel_order: step,
      ...props,
    });
  }
}

export function trackOnboardingFunnelStep(
  step: 1 | 2 | 3 | 4,
  props?: Record<string, unknown>
): void {
  const def = ONBOARDING_FUNNEL_STEPS.find((s) => s.step === step);
  capture("onboarding_step_viewed", {
    step,
    step_name: def?.id ?? String(step),
    step_label: def?.name ?? String(step),
    funnel: "onboarding_main",
    funnel_order: step,
    ...props,
  });
  capture("onboarding_funnel_step", {
    step,
    step_name: def?.id ?? String(step),
    funnel: "onboarding_main",
    funnel_order: step,
    ...props,
  });
  capture("onboarding_step", {
    step,
    step_name: def?.id ?? String(step),
    funnel: "onboarding_main",
    ...props,
  });
}

export function trackOnboardingAbandoned(step: number | string, props?: Record<string, unknown>): void {
  capture("onboarding_abandoned", { step, funnel: "onboarding_main", ...props });
}

export function trackOnboardingCompleted(data: {
  goal?: string;
  days?: number;
  place?: string;
  role?: string;
  total_steps?: number;
  source?: string;
  [k: string]: unknown;
}): void {
  capture("onboarding_completed", {
    goal: data.goal,
    days: data.days,
    place: data.place,
    role: data.role,
    funnel: "onboarding_main",
    funnel_order: 5,
    ...data,
  });
}

export function trackCheckoutStarted(params: {
  plan: string;
  provider: "stripe" | "mp" | string;
  price?: number;
  currency?: string;
  email?: string;
}): void {
  capture("checkout_started", {
    plan_id: params.plan,
    plan: params.plan,
    provider: params.provider,
    price: params.price,
    currency: params.currency || "ARS",
    email: params.email,
  });
}

export function trackCheckoutCompleted(params: {
  plan: string;
  provider: string;
  price?: number;
  currency?: string;
}): void {
  capture("checkout_completed", {
    plan_id: params.plan,
    plan: params.plan,
    provider: params.provider,
    price: params.price,
    currency: params.currency || "ARS",
    revenue: params.price,
    $revenue: params.price,
  });
}

export function trackPaymentCompleted(params: {
  amount: number;
  currency?: string;
  plan: string;
  provider: string;
  email?: string;
  mrr?: number;
  billing_period?: string;
}): void {
  const currency = params.currency || "ARS";
  const mrr = params.mrr ?? params.amount;
  capture("payment_completed", {
    plan_id: params.plan,
    plan: params.plan,
    provider: params.provider,
    price: params.amount,
    amount: params.amount,
    revenue: params.amount,
    $revenue: params.amount,
    currency,
    mrr,
    monthly_recurring_revenue: mrr,
    billing_period: params.billing_period || "monthly",
    email: params.email,
  });
  capture("revenue_tracked", {
    plan: params.plan,
    provider: params.provider,
    revenue: params.amount,
    $revenue: params.amount,
    currency,
    mrr,
    event_source: "payment_completed",
  });
  capture("revenue_mrr_updated", {
    mrr,
    currency,
    plan: params.plan,
    provider: params.provider,
    revenue: params.amount,
    delta_mrr: mrr,
  });
}

export function trackPaymentFailed(params: {
  plan: string;
  provider: string;
  reason?: string;
  price?: number;
  currency?: string;
}): void {
  capture("payment_failed", {
    plan_id: params.plan,
    plan: params.plan,
    provider: params.provider,
    reason: params.reason,
    price: params.price,
    currency: params.currency || "ARS",
  });
}

export function trackSubscriptionStarted(plan: string, price: number, currency = "ARS"): void {
  capture("subscription_started", { plan, plan_type: plan, price, currency, revenue: price, $revenue: price, mrr: price });
  capture("payment_completed", { plan, price, currency, revenue: price, $revenue: price, mrr: price });
  capture("revenue_mrr_updated", { mrr: price, currency, plan, delta_mrr: price, revenue: price });
}

export function trackSubscriptionCancelled(plan: string, reason?: string): void {
  capture("subscription_cancelled", { plan, plan_type: plan, reason });
  capture("revenue_mrr_updated", { mrr: 0, plan, delta_mrr: 0, reason, churn: true });
}

export function trackMRRViewed(params: { mrr: number; currency?: string; source?: string }): void {
  capture("mrr_dashboard_viewed", {
    mrr: params.mrr,
    currency: params.currency || "ARS",
    source: params.source || "revenue_analytics",
  });
  capture("revenue_dashboard_viewed", {
    mrr: params.mrr,
    currency: params.currency || "ARS",
    source: params.source || "revenue_analytics",
  });
}

export function trackRevenueDashboardViewed(props?: Record<string, unknown>): void {
  capture("revenue_dashboard_viewed", { source: "trainer_analytics", ...props });
  capture("mrr_dashboard_viewed", { source: "trainer_analytics", ...props });
}

export function trackTrainerPaymentsViewed(props?: Record<string, unknown>): void {
  capture("trainer_payments_viewed", { source: "trainer_payments", ...props });
}

export { posthog };
