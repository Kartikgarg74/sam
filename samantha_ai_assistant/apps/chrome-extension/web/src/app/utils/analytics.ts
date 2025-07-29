// analytics.ts
// Cross-browser analytics utility for Samantha AI extension

import { ErrorType } from './errorHandler';

export type AnalyticsEventType =
  | 'feature_usage'
  | 'error'
  | 'performance'
  | 'user_pattern';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  feature?: string;
  errorType?: ErrorType | string;
  metric?: string;
  value?: number;
  details?: Record<string, unknown>;
  timestamp: number;
  browser: string;
  version: string;
  sessionId: string;
}

export interface AnalyticsConfig {
  endpoint: string;
  batchSize?: number;
  flushInterval?: number;
  enabled: boolean;
  privacyConsent: boolean;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  endpoint: '/api/analytics',
  batchSize: 10,
  flushInterval: 10000, // 10 seconds
  enabled: true,
  privacyConsent: false
};

class Analytics {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionId: string;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.loadConsent();
    this.startFlushTimer();
  }

  private generateSessionId(): string {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 10)
    );
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    return 'Unknown';
  }

  private detectVersion(): string {
    const ua = navigator.userAgent;
    const match = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private loadConsent(): void {
    const consent = localStorage.getItem('samantha_analytics_consent');
    this.config.privacyConsent = consent === 'true';
    const enabled = localStorage.getItem('samantha_analytics_enabled');
    if (enabled !== null) this.config.enabled = enabled === 'true';
  }

  public setConsent(consent: boolean): void {
    this.config.privacyConsent = consent;
    localStorage.setItem('samantha_analytics_consent', consent ? 'true' : 'false');
    if (!consent) this.clearQueue();
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    localStorage.setItem('samantha_analytics_enabled', enabled ? 'true' : 'false');
    if (!enabled) this.clearQueue();
  }

  private startFlushTimer(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setInterval(() => this.flushEvents(), this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = null;
  }

  public trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'browser' | 'version' | 'sessionId'>): void {
    if (!this.config.enabled || !this.config.privacyConsent) return;
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      browser: this.detectBrowser(),
      version: this.detectVersion(),
      sessionId: this.sessionId
    };
    this.eventQueue.push(analyticsEvent);
    if (this.eventQueue.length >= this.config.batchSize!) {
      this.flushEvents();
    }
  }

  public trackFeatureUsage(feature: string, details?: Record<string, unknown>): void {
    this.trackEvent({ type: 'feature_usage', feature, details });
  }

  public trackError(errorType: ErrorType | string, details?: Record<string, unknown>): void {
    this.trackEvent({ type: 'error', errorType, details });
  }

  public trackPerformance(metric: string, value: number, details?: Record<string, unknown>): void {
    this.trackEvent({ type: 'performance', metric, value, details });
  }

  public trackUserPattern(pattern: string, details?: Record<string, unknown>): void {
    this.trackEvent({ type: 'user_pattern', feature: pattern, details });
  }

  public async flushEvents(): Promise<void> {
    if (!this.config.enabled || !this.config.privacyConsent) {
      this.eventQueue = [];
      return;
    }
    if (this.eventQueue.length === 0) return;
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend })
      });
    } catch (error) {
      // If failed, re-queue events for next flush
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  public clearQueue(): void {
    this.eventQueue = [];
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  public getQueue(): AnalyticsEvent[] {
    return [...this.eventQueue];
  }
}

// Singleton instance
export const analytics = new Analytics();

// Types are already exported above
