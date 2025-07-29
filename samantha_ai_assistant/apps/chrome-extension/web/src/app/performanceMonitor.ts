// performanceMonitor.ts
// Utility for browser extension performance monitoring

export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';

export interface PerformanceEntry {
  type: 'api' | 'memory' | 'network';
  name: string;
  startTime: number;
  duration?: number;
  details?: unknown;
  browser: BrowserType;
}

export class PerformanceMonitor {
  private entries: PerformanceEntry[] = [];
  private browser: BrowserType;

  constructor() {
    this.browser = this.detectBrowser();
  }

  detectBrowser(): BrowserType {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
    if (ua.includes('Edg')) return 'edge';
    return 'unknown';
  }

  startApiCall(name: string): number {
    const start = performance.now();
    this.entries.push({ type: 'api', name, startTime: start, browser: this.browser });
    return start;
  }

  endApiCall(name: string, start: number, details?: unknown): void {
    const end = performance.now();
    const duration = end - start;
    this.entries.push({ type: 'api', name, startTime: start, duration, details, browser: this.browser });
    // Optionally: log or send to backend
  }

  logMemoryUsage(): void {
    if ('memory' in performance) {
      // Chrome only
      const mem = (performance as Performance & { memory?: unknown }).memory;
      this.entries.push({
        type: 'memory',
        name: 'memory-usage',
        startTime: performance.now(),
        details: mem,
        browser: this.browser
      });
    }
  }

  logNetworkRequest(url: string, start: number, end: number, details?: unknown): void {
    this.entries.push({
      type: 'network',
      name: url,
      startTime: start,
      duration: end - start,
      details,
      browser: this.browser
    });
  }

  getEntries(): PerformanceEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
