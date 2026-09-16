/**
 * Analytics Engine - Sistema de Métricas Avanzado
 * Basado en patrones de Plausible Analytics (MIT)
 *
 * Features:
 * - Page views automáticos
 * - Custom events tracking
 * - User journey mapping
 * - Conversion funnel analysis
 * - Privacy-first (no cookies, GDPR compliant)
 * - Real-time dashboard ready
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface PageViewData {
  url: string;
  referrer: string;
  title: string;
  device: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  browser: string;
  os: string;
}

class AnalyticsEngine {
  private apiKey: string;
  private domain: string;
  private enabled: boolean;
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userProperties: Record<string, any> = {};

  constructor(apiKey: string = '', domain: string = 'kinetixfit.com') {
    this.apiKey = apiKey;
    this.domain = domain;
    this.enabled = !!apiKey;
    this.sessionId = this.generateSessionId();

    // Auto-detect if running in production
    if (!apiKey && process.env.NEXT_PUBLIC_ANALYTICS_ID) {
      this.apiKey = process.env.NEXT_PUBLIC_ANALYTICS_ID;
      this.enabled = true;
    }

    this.initialize();
  }

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `sess_${crypto.randomUUID()}`;
    }
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private initialize() {
    if (!this.enabled || typeof window === 'undefined') {
      return;
    }

    // Track initial page view only in a browser context.
    void this.trackPageView();

    // Track history changes for SPA
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      window.setTimeout(() => void this.trackPageView(), 0);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      window.setTimeout(() => void this.trackPageView(), 0);
    };

    window.addEventListener('popstate', () => {
      window.setTimeout(() => void this.trackPageView(), 0);
    });
  }

  async trackPageView(url?: string, title?: string) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const pageUrl = url || window.location.pathname;
    const pageTitle = title || document.title;
    const referrer = document.referrer;

    const data: PageViewData = {
      url: pageUrl,
      referrer,
      title: pageTitle,
      device: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1,
      },
      browser: navigator.userAgent,
      os: navigator.platform,
    };

    await this.sendEvent('pageview', data);
  }

  async track(event: AnalyticsEvent) {
    const eventData: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
    };

    if (this.enabled) {
      await this.sendEvent(event.name, {
        ...eventData.properties,
        session_id: eventData.sessionId,
        user_id: eventData.userId,
        client_timestamp: new Date(eventData.timestamp).toISOString(),
      });
    } else {
      this.queue.push(eventData);
      console.log('📊 Event queued:', eventData);
    }
  }

  async trackCustom(eventName: string, properties: Record<string, any> = {}) {
    await this.track({
      name: eventName,
      properties,
    });
  }

  async trackWorkoutStarted(workoutId: string, workoutType: string, difficulty: string) {
    await this.trackCustom('workout_started', {
      workout_id: workoutId,
      workout_type: workoutType,
      difficulty,
      timestamp: new Date().toISOString(),
    });
  }

  async trackWorkoutCompleted(
    workoutId: string,
    duration: number,
    caloriesBurned: number,
    exercisesCompleted: number,
    totalExercises: number
  ) {
    const safeTotalExercises = Math.max(0, totalExercises);
    const safeCompleted = Math.min(Math.max(0, exercisesCompleted), safeTotalExercises);

    await this.trackCustom('workout_completed', {
      workout_id: workoutId,
      duration_seconds: Math.max(0, duration),
      calories_burned: Math.max(0, caloriesBurned),
      exercises_completed: safeCompleted,
      exercises_total: safeTotalExercises,
      completion_rate: safeTotalExercises > 0 ? (safeCompleted / safeTotalExercises) * 100 : 0,
    });
  }

  async trackAchievement(achievementId: string, achievementName: string, category: string) {
    await this.trackCustom('achievement_unlocked', {
      achievement_id: achievementId,
      achievement_name: achievementName,
      category,
      timestamp: new Date().toISOString(),
    });
  }

  async trackConversion(conversionType: string, value?: number, currency?: string) {
    await this.trackCustom('conversion', {
      conversion_type: conversionType,
      value: value || 0,
      currency: currency || 'USD',
    });
  }

  setUserProperty(key: string, value: any) {
    this.userProperties[key] = value;
  }

  setUserProperties(properties: Record<string, any>) {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const userId = window.localStorage.getItem('kinetix_user_id');
    return userId || undefined;
  }

  private async sendEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.enabled || typeof window === 'undefined') return;

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      domain: this.domain,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language,
      properties: {
        ...this.userProperties,
        ...properties,
      },
    };

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Analytics error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Queue for retry
      this.queue.push({
        name: eventName,
        properties,
        timestamp: Date.now(),
      });
    }
  }

  async flushQueue() {
    const eventsToSend = [...this.queue];
    this.queue = [];

    for (const event of eventsToSend) {
      await this.sendEvent(event.name, event.properties);
    }
  }

  getMetrics() {
    return {
      sessionId: this.sessionId,
      userId: this.getUserId(),
      queuedEvents: this.queue.length,
      enabled: this.enabled,
    };
  }
}

// Singleton instance
let analyticsInstance: AnalyticsEngine | null = null;

export function getAnalytics(): AnalyticsEngine {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsEngine();
  }
  return analyticsInstance;
}

export function initAnalytics(apiKey?: string, domain?: string): AnalyticsEngine {
  analyticsInstance = new AnalyticsEngine(apiKey, domain);
  return analyticsInstance;
}

// Export for direct usage
export const analytics = new AnalyticsEngine();

export default analytics;
