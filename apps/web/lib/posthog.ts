"use client";

import posthog from "posthog-js";

/**
 * PostHog Analytics — KinetixFitt Web
 * Centraliza init + capture para retención. No romper si no hay key / SSR.
 */

export type PostHogEvent =
  | "pageview"
  | "cta_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_plan_selected"
  | "onboarding_started"
  | "onboarding_step"
  | "onboarding_step_viewed"
  | "onboarding_funnel_step"
  | "onboarding_abandoned"
  | "onboarding_completed"
  | "workout_completed"
  | "workout_started"
  | "checkin_completed"
  | "checkin_sent"
  | "subscription_started"
  | "subscription_cancelled"
  | "payment_started"
  | "payment_completed"
  | "payment_failed"
  | "revenue_tracked"
  | "revenue_mrr_updated"
  | "revenue_dashboard_viewed"
  | "mrr_dashboard_viewed"
  | "feature_discovered"
  | "lead_captured"
  | "pricing_viewed"
  | "$web_vitals"
  | "web_vitals";

let _initialized = false;

export function initPostHog(): void {
  if (_initialized) return;
  if (typeof window === "undefined") return;

  const configuredKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!configuredKey || configuredKey.startsWith("phc_placeholder")) {
    _initialized = false;
    if (process.env.NODE_ENV === "development") {
      console.info("[PostHog:web] Disabled — NEXT_PUBLIC_POSTHOG_KEY is not configured.");
    }
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
            console.info("[PostHog:web] Placeholder key — capturing opt-out. Set NEXT_PUBLIC_POSTHOG_KEY to enable.");
          }
        }
      },
    });
    _initialized = true;
    if (process.env.NODE_ENV === "development") {
      console.info("[PostHog:web] Initialized", { host, keyPrefix: key.slice(0, 8) + "..." });
    }
  } catch (e) {
    console.warn("[PostHog:web] init failed", e);
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
        source: "web",
        timestamp: new Date().toISOString(),
      });
    } else if (process.env.NODE_ENV === "development") {
      console.log(`[PostHog:web capture] ${event}`, properties);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[PostHog:web] capture error", e);
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

export function trackPageView(url?: string, props?: Record<string, unknown>): void {
  const path = url || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");
  capture("pageview", {
    $current_url: typeof window !== "undefined" ? window.location.href : path,
    path,
    title: typeof document !== "undefined" ? document.title : undefined,
    ...props,
  });
}

export function trackCtaClicked(cta: string, location?: string, props?: Record<string, unknown>): void {
  capture("cta_clicked", { cta, location, ...props });
}

export const ONBOARDING_FUNNEL_STEPS = [
  { step: 1, id: "welcome", name: "Bienvenida" },
  { step: 2, id: "goal", name: "Objetivo" },
  { step: 3, id: "days", name: "Días por semana" },
  { step: 4, id: "place", name: "Lugar de entreno" },
] as const;

export type OnboardingFunnelStepId = (typeof ONBOARDING_FUNNEL_STEPS)[number]["id"];

export function trackCheckoutStarted(params: {
  plan: string;
  provider: "stripe" | "mp" | string;
  price?: number;
  currency?: string;
  location?: string;
}): void {
  capture("checkout_started", {
    plan_id: params.plan,
    plan: params.plan,
    provider: params.provider,
    price: params.price,
    currency: params.currency || "USD",
    location: params.location,
    revenue: params.price,
  });
}

export function trackCheckoutCompleted(params: { plan: string; provider: string; price?: number; currency?: string }): void {
  capture("checkout_completed", {
    plan_id: params.plan,
    plan: params.plan,
    provider: params.provider,
    price: params.price,
    currency: params.currency || "USD",
    revenue: params.price,
    $revenue: params.price,
  });
}

export function trackOnboardingStarted(props?: Record<string, unknown>): void {
  capture("onboarding_started", { funnel: "onboarding_main", total_steps: 4, ...props });
}

export function trackOnboardingStep(step: number | string, props?: Record<string, unknown>): void {
  capture("onboarding_step", { step, funnel: "onboarding_main", ...props });
  if (typeof step === "number" && step >= 1 && step <= 4) {
    const def = ONBOARDING_FUNNEL_STEPS.find((s) => s.step === step);
    capture("onboarding_step_viewed", {
      step,
      step_name: def?.id ?? String(step),
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

export function trackOnboardingFunnelStep(step: 1 | 2 | 3 | 4, props?: Record<string, unknown>): void {
  const def = ONBOARDING_FUNNEL_STEPS.find((s) => s.step === step);
  capture("onboarding_step_viewed", {
    step,
    step_name: def?.id ?? String(step),
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
  capture("onboarding_step", { step, step_name: def?.id ?? String(step), funnel: "onboarding_main", ...props });
}

export function trackOnboardingCompleted(data: Record<string, unknown>): void {
  capture("onboarding_completed", { funnel: "onboarding_main", funnel_order: 5, ...data });
}

export function trackPaymentCompleted(params: {
  amount: number;
  currency?: string;
  plan: string;
  provider: string;
  mrr?: number;
}): void {
  const currency = params.currency || "USD";
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
  });
  capture("revenue_tracked", { plan: params.plan, revenue: params.amount, currency, mrr });
  capture("revenue_mrr_updated", { mrr, currency, plan: params.plan, delta_mrr: mrr });
}

export function trackMRRViewed(params: { mrr: number; currency?: string; source?: string }): void {
  capture("mrr_dashboard_viewed", { mrr: params.mrr, currency: params.currency || "USD", source: params.source || "web" });
  capture("revenue_dashboard_viewed", { mrr: params.mrr, currency: params.currency || "USD", source: params.source || "web" });
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

export function trackCheckin(params: { mood: number; fatigue: number; notes?: string }): void {
  capture("checkin_completed", {
    mood_rating: params.mood,
    fatigue_rating: params.fatigue,
    notes: params.notes,
  });
  capture("checkin_sent", {
    mood_rating: params.mood,
    fatigue_rating: params.fatigue,
  });
}

export type WebVitalMetric = {
  name: "CLS" | "LCP" | "FCP" | "INP" | "TTFB" | string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType: string;
};

export function trackWebVital(metric: WebVitalMetric): void {
  const props = {
    metric_name: metric.name,
    metric_value: metric.value,
    metric_rating: metric.rating,
    metric_delta: metric.delta,
    metric_id: metric.id,
    navigation_type: metric.navigationType,
    $web_vitals_score: metric.value,
    $web_vitals_rating: metric.rating,
    value: metric.value,
    rating: metric.rating,
  };
  capture("$web_vitals", props as Record<string, unknown>);
  capture("web_vitals", props as Record<string, unknown>);
}

export function initWebVitals(): void {
  if (typeof window === "undefined") return;
  import("web-vitals")
    .then((mod: unknown) => {
      const m = mod as Record<string, (cb: (metric: WebVitalMetric) => void) => void>;
      try {
        if (m.onCLS) m.onCLS(trackWebVital);
        if (m.onLCP) m.onLCP(trackWebVital);
        if (m.onFID) m.onFID(trackWebVital);
        if (m.onINP) m.onINP(trackWebVital);
        if (m.onFCP) m.onFCP(trackWebVital);
        if (m.onTTFB) m.onTTFB(trackWebVital);
      } catch (e) {
        if (process.env.NODE_ENV === "development") console.warn("[PostHog:web] WebVitals registration failed", e);
      }
    })
    .catch(() => {});
}

export { posthog };
