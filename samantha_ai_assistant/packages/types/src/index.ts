// [CONTEXT] Defines common types used across the Samantha AI Assistant monorepo.

export interface AudioFormat {
    data: Int16Array;
    sampleRate: number;
    channels: number;
    mimeType: string;
    duration?: number;
}
export interface TranscriptionResult {
    text: string;
    language?: string;
    duration?: number;
    confidence?: number;
    words?: Array<{ word: string; start: number; end: number; confidence?: number }>;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userPreferences: Record<string, any>;
}
export interface CommandResult {
    intent: string;
    parameters: Record<string, any>;
    confidence?: number;
    responseText?: string;
}

export interface IntentClassificationResult {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}

export interface CommandRoute {
  intent: string;
  service: string;
  command: string;
  parameters: Record<string, any>;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  networkActivity: number;
}

export interface ExecutionResult {
  success: boolean;
  message?: string;
  details?: Record<string, any>;
  data?: any;
}