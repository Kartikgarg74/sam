// Voice Processing Performance Monitor
// Tracks performance metrics across different browsers and provides optimization recommendations

export interface PerformanceMetrics {
  latency: {
    recognition: number;      // Speech recognition latency
    processing: number;       // AI processing latency
    synthesis: number;        // TTS synthesis latency
    playback: number;         // Audio playback latency
    total: number;           // Total end-to-end latency
  };
  accuracy: {
    transcription: number;    // Transcription accuracy
    intent: number;          // Intent classification accuracy
    execution: number;       // Command execution success rate
  };
  resources: {
    memory: number;          // Memory usage in MB
    cpu: number;             // CPU usage percentage
    battery: number;         // Battery impact (estimated)
  };
  browser: {
    type: string;
    version: string;
    capabilities: string[];
  };
  timestamp: number;
}

export interface OptimizationRecommendation {
  type: 'latency' | 'accuracy' | 'resources' | 'browser';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private browserInfo: any = {};
  private maxMetricsHistory = 100;

  constructor() {
    this.initializeBrowserInfo();
  }

  private initializeBrowserInfo(): void {
    const userAgent = navigator.userAgent;
    const browserInfo = this.parseUserAgent(userAgent);

    this.browserInfo = {
      type: browserInfo.browser,
      version: browserInfo.version,
      capabilities: this.getBrowserCapabilities()
    };
  }

  private parseUserAgent(userAgent: string): { browser: string; version: string } {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { browser: 'Chrome', version: match ? match[1] : 'unknown' };
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { browser: 'Firefox', version: match ? match[1] : 'unknown' };
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      return { browser: 'Safari', version: match ? match[1] : 'unknown' };
    } else if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      return { browser: 'Edge', version: match ? match[1] : 'unknown' };
    }
    return { browser: 'Unknown', version: 'unknown' };
  }

  private getBrowserCapabilities(): string[] {
    const capabilities: string[] = [];

    if ('webkitSpeechRecognition' in window) capabilities.push('webkitSpeechRecognition');
    if ('SpeechRecognition' in window) capabilities.push('SpeechRecognition');
    if ('AudioContext' in window) capabilities.push('AudioContext');
    if ('getUserMedia' in navigator.mediaDevices) capabilities.push('getUserMedia');
    if ('MediaRecorder' in window) capabilities.push('MediaRecorder');
    if ('speechSynthesis' in window) capabilities.push('speechSynthesis');
    if ('serviceWorker' in navigator) capabilities.push('serviceWorker');
    if ('caches' in window) capabilities.push('caches');

    return capabilities;
  }

  startMeasurement(): void {
    this.startTime = performance.now();
  }

  recordRecognitionLatency(): number {
    const latency = performance.now() - this.startTime;
    return latency;
  }

  recordProcessingLatency(): number {
    const latency = performance.now() - this.startTime;
    return latency;
  }

  recordSynthesisLatency(): number {
    const latency = performance.now() - this.startTime;
    return latency;
  }

  recordPlaybackLatency(): number {
    const latency = performance.now() - this.startTime;
    return latency;
  }

  async measureMemoryUsage(): Promise<number> {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }

  async measureCPUUsage(): Promise<number> {
    // Simple CPU usage estimation based on processing time
    const start = performance.now();
    await this.busyWait(1); // 1ms busy wait
    const end = performance.now();
    const actualTime = end - start;

    // Estimate CPU usage based on how long 1ms of work actually took
    return Math.min(100, (actualTime / 1) * 100);
  }

  private async busyWait(ms: number): Promise<void> {
    const start = performance.now();
    while (performance.now() - start < ms) {
      // Busy wait
    }
  }

  recordMetrics(partialMetrics: Partial<PerformanceMetrics>): void {
    const metrics: PerformanceMetrics = {
      latency: {
        recognition: 0,
        processing: 0,
        synthesis: 0,
        playback: 0,
        total: 0,
        ...partialMetrics.latency
      },
      accuracy: {
        transcription: 0,
        intent: 0,
        execution: 0,
        ...partialMetrics.accuracy
      },
      resources: {
        memory: 0,
        cpu: 0,
        battery: 0,
        ...partialMetrics.resources
      },
      browser: this.browserInfo,
      timestamp: Date.now(),
      ...partialMetrics
    };

    this.metrics.push(metrics);

    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }
  }

  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const avgMetrics: PerformanceMetrics = {
      latency: {
        recognition: 0,
        processing: 0,
        synthesis: 0,
        playback: 0,
        total: 0
      },
      accuracy: {
        transcription: 0,
        intent: 0,
        execution: 0
      },
      resources: {
        memory: 0,
        cpu: 0,
        battery: 0
      },
      browser: this.browserInfo,
      timestamp: Date.now()
    };

    // Calculate averages
    this.metrics.forEach(metric => {
      avgMetrics.latency.recognition += metric.latency.recognition;
      avgMetrics.latency.processing += metric.latency.processing;
      avgMetrics.latency.synthesis += metric.latency.synthesis;
      avgMetrics.latency.playback += metric.latency.playback;
      avgMetrics.latency.total += metric.latency.total;

      avgMetrics.accuracy.transcription += metric.accuracy.transcription;
      avgMetrics.accuracy.intent += metric.accuracy.intent;
      avgMetrics.accuracy.execution += metric.accuracy.execution;

      avgMetrics.resources.memory += metric.resources.memory;
      avgMetrics.resources.cpu += metric.resources.cpu;
      avgMetrics.resources.battery += metric.resources.battery;
    });

    const count = this.metrics.length;
    avgMetrics.latency.recognition /= count;
    avgMetrics.latency.processing /= count;
    avgMetrics.latency.synthesis /= count;
    avgMetrics.latency.playback /= count;
    avgMetrics.latency.total /= count;

    avgMetrics.accuracy.transcription /= count;
    avgMetrics.accuracy.intent /= count;
    avgMetrics.accuracy.execution /= count;

    avgMetrics.resources.memory /= count;
    avgMetrics.resources.cpu /= count;
    avgMetrics.resources.battery /= count;

    return avgMetrics;
  }

  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const avgMetrics = this.getAverageMetrics();

    if (!avgMetrics) return recommendations;

    // Latency optimizations
    if (avgMetrics.latency.total > 500) {
      recommendations.push({
        type: 'latency',
        priority: 'high',
        description: 'Total latency is too high (>500ms)',
        impact: 'High - User experience degradation',
        implementation: 'Implement streaming recognition and parallel processing'
      });
    }

    if (avgMetrics.latency.recognition > 200) {
      recommendations.push({
        type: 'latency',
        priority: 'medium',
        description: 'Speech recognition latency is high (>200ms)',
        impact: 'Medium - Delayed response to voice commands',
        implementation: 'Use continuous recognition and optimize audio capture'
      });
    }

    // Accuracy optimizations
    if (avgMetrics.accuracy.transcription < 0.9) {
      recommendations.push({
        type: 'accuracy',
        priority: 'high',
        description: 'Transcription accuracy is low (<90%)',
        impact: 'High - Commands may be misunderstood',
        implementation: 'Improve audio quality and add noise reduction'
      });
    }

    if (avgMetrics.accuracy.intent < 0.85) {
      recommendations.push({
        type: 'accuracy',
        priority: 'medium',
        description: 'Intent classification accuracy is low (<85%)',
        impact: 'Medium - Wrong actions may be executed',
        implementation: 'Improve AI model and add context awareness'
      });
    }

    // Resource optimizations
    if (avgMetrics.resources.memory > 50) {
      recommendations.push({
        type: 'resources',
        priority: 'medium',
        description: 'Memory usage is high (>50MB)',
        impact: 'Medium - May affect other browser tabs',
        implementation: 'Implement audio streaming and reduce buffer sizes'
      });
    }

    if (avgMetrics.resources.cpu > 20) {
      recommendations.push({
        type: 'resources',
        priority: 'medium',
        description: 'CPU usage is high (>20%)',
        impact: 'Medium - May drain battery and slow system',
        implementation: 'Use Web Workers and optimize audio processing'
      });
    }

    // Browser-specific optimizations
    if (this.browserInfo.type === 'Safari') {
      recommendations.push({
        type: 'browser',
        priority: 'low',
        description: 'Safari has limited Web Audio API support',
        impact: 'Low - Some features may not work optimally',
        implementation: 'Use Safari-specific audio optimizations'
      });
    }

    if (this.browserInfo.type === 'Firefox') {
      recommendations.push({
        type: 'browser',
        priority: 'low',
        description: 'Firefox uses different API namespace',
        impact: 'Low - Code compatibility issues',
        implementation: 'Use browser.* namespace instead of chrome.*'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  getPerformanceReport(): any {
    const avgMetrics = this.getAverageMetrics();
    const recommendations = this.getOptimizationRecommendations();

    return {
      summary: {
        totalMeasurements: this.metrics.length,
        browser: this.browserInfo,
        lastUpdated: new Date().toISOString()
      },
      metrics: avgMetrics,
      recommendations,
      trends: this.calculateTrends(),
      benchmarks: this.getBenchmarks()
    };
  }

  private calculateTrends(): any {
    if (this.metrics.length < 2) return {};

    const recent = this.metrics.slice(-10);
    const older = this.metrics.slice(0, -10);

    if (older.length === 0) return {};

    const recentAvg = this.calculateAverageLatency(recent);
    const olderAvg = this.calculateAverageLatency(older);

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    return {
      latencyChange: change,
      trend: change > 0 ? 'worsening' : 'improving',
      confidence: this.metrics.length > 20 ? 'high' : 'low'
    };
  }

  private calculateAverageLatency(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.latency.total, 0);
    return total / metrics.length;
  }

  private getBenchmarks(): any {
    return {
      chrome: {
        latency: { target: 100, acceptable: 200 },
        accuracy: { target: 0.95, acceptable: 0.9 },
        memory: { target: 30, acceptable: 50 },
        cpu: { target: 10, acceptable: 20 }
      },
      firefox: {
        latency: { target: 200, acceptable: 300 },
        accuracy: { target: 0.9, acceptable: 0.85 },
        memory: { target: 40, acceptable: 60 },
        cpu: { target: 15, acceptable: 25 }
      },
      safari: {
        latency: { target: 300, acceptable: 500 },
        accuracy: { target: 0.85, acceptable: 0.8 },
        memory: { target: 50, acceptable: 70 },
        cpu: { target: 20, acceptable: 30 }
      }
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}
