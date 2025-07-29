// errorHandler.ts
// Comprehensive error handling system for Samantha AI browser extension

import { analytics } from './analytics';

export enum ErrorType {
  // Voice Processing Errors
  SPEECH_RECOGNITION_NOT_SUPPORTED = 'SPEECH_RECOGNITION_NOT_SUPPORTED',
  SPEECH_RECOGNITION_ERROR = 'SPEECH_RECOGNITION_ERROR',
  SPEECH_RECOGNITION_TIMEOUT = 'SPEECH_RECOGNITION_TIMEOUT',
  SPEECH_RECOGNITION_NO_SPEECH = 'SPEECH_RECOGNITION_NO_SPEECH',
  SPEECH_RECOGNITION_AUDIO_CAPTURE = 'SPEECH_RECOGNITION_AUDIO_CAPTURE',
  SPEECH_RECOGNITION_NETWORK = 'SPEECH_RECOGNITION_NETWORK',
  SPEECH_RECOGNITION_ABORTED = 'SPEECH_RECOGNITION_ABORTED',

  // Network Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_CORS = 'NETWORK_CORS',
  NETWORK_404 = 'NETWORK_404',
  NETWORK_500 = 'NETWORK_500',
  NETWORK_UNKNOWN = 'NETWORK_UNKNOWN',

  // API Errors
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_AUTHENTICATION = 'API_AUTHENTICATION',
  API_AUTHORIZATION = 'API_AUTHORIZATION',
  API_VALIDATION = 'API_VALIDATION',
  API_SERVER_ERROR = 'API_SERVER_ERROR',

  // Storage Errors
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED = 'STORAGE_ACCESS_DENIED',
  STORAGE_CORRUPTED = 'STORAGE_CORRUPTED',
  STORAGE_NOT_AVAILABLE = 'STORAGE_NOT_AVAILABLE',

  // Browser Extension Errors
  EXTENSION_PERMISSION_DENIED = 'EXTENSION_PERMISSION_DENIED',
  EXTENSION_API_NOT_AVAILABLE = 'EXTENSION_API_NOT_AVAILABLE',
  EXTENSION_CONTEXT_INVALID = 'EXTENSION_CONTEXT_INVALID',

  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  code?: string;
  timestamp: number;
  context?: Record<string, unknown>;
  stack?: string;
  userAgent?: string;
  browser?: string;
  version?: string;
}

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'degrade' | 'abort';
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: () => void;
  userMessage?: string;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableUserFeedback: boolean;
  enableDebugMode: boolean;
  maxRetries: number;
  retryDelay: number;
  logToConsole: boolean;
  logToStorage: boolean;
  logToRemote?: string;
}

class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLog: ErrorDetails[] = [];
  private retryCounts: Map<string, number> = new Map();
  private isDebugMode: boolean = false;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableUserFeedback: true,
      enableDebugMode: false,
      maxRetries: 3,
      retryDelay: 1000,
      logToConsole: true,
      logToStorage: true,
      ...config
    };

    this.isDebugMode = this.config.enableDebugMode;
    this.initializeErrorHandling();
  }

  private initializeErrorHandling(): void {
    // Global error handlers
    window.addEventListener('error', (event) => {
      this.handleError(new Error(event.message), {
        type: ErrorType.UNKNOWN_ERROR,
        context: { filename: event.filename, lineno: event.lineno, colno: event.colno }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        type: ErrorType.UNKNOWN_ERROR,
        context: { isPromise: true }
      });
    });

    // Network status monitoring
    window.addEventListener('online', () => {
      this.logInfo('Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.handleError(new Error('Network connection lost'), {
        type: ErrorType.NETWORK_OFFLINE
      });
    });
  }

  public handleError(
    error: Error | string,
    details: Partial<ErrorDetails> = {}
  ): ErrorDetails {
    const errorDetails: ErrorDetails = {
      type: ErrorType.UNKNOWN_ERROR,
      message: typeof error === 'string' ? error : error.message,
      timestamp: Date.now(),
      stack: error instanceof Error ? error.stack : undefined,
      userAgent: navigator.userAgent,
      browser: this.detectBrowser(),
      version: this.detectVersion(),
      ...details
    };

    // Analytics tracking for error
    analytics.trackError(errorDetails.type, { ...errorDetails });

    // Log the error
    if (this.config.enableLogging) {
      this.logError(errorDetails);
    }

    // Show user feedback
    if (this.config.enableUserFeedback) {
      this.showUserFeedback(errorDetails);
    }

    // Attempt recovery
    const recoveryStrategy = this.getRecoveryStrategy(errorDetails);
    if (recoveryStrategy) {
      this.attemptRecovery(errorDetails, recoveryStrategy);
    }

    return errorDetails;
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

  private logError(errorDetails: ErrorDetails): void {
    // Add to in-memory log
    this.errorLog.push(errorDetails);

    // Console logging
    if (this.config.logToConsole) {
      const logMessage = `[${errorDetails.type}] ${errorDetails.message}`;
      if (this.isDebugMode) {
        console.error(logMessage, errorDetails);
      } else {
        console.error(logMessage);
      }
    }

    // Storage logging
    if (this.config.logToStorage) {
      this.saveErrorToStorage(errorDetails);
    }

    // Remote logging (if configured)
    if (this.config.logToRemote) {
      this.sendErrorToRemote(errorDetails);
    }
  }

  private saveErrorToStorage(errorDetails: ErrorDetails): void {
    try {
      const existingLogs = localStorage.getItem('samantha_error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      // Keep only last 100 errors
      logs.push(errorDetails);
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem('samantha_error_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to save error to storage:', error);
    }
  }

  private async sendErrorToRemote(errorDetails: ErrorDetails): Promise<void> {
    if (!this.config.logToRemote) return;

    try {
      await fetch(this.config.logToRemote, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorDetails)
      });
    } catch (error) {
      console.warn('Failed to send error to remote:', error);
    }
  }

    private showUserFeedback(errorDetails: ErrorDetails): void {
    const userMessage = this.getUserMessage(errorDetails);

    // Use notification system if available
    if (typeof window !== 'undefined' && (window as typeof window & { samanthaNotifications?: { showError: (title: string, message: string) => void } }).samanthaNotifications) {
      (window as typeof window & { samanthaNotifications?: { showError: (title: string, message: string) => void } }).samanthaNotifications?.showError('Error', userMessage);
    } else {
      // Fallback to alert in debug mode
      if (this.isDebugMode) {
        alert(`Error: ${userMessage}`);
      }
    }
  }

  private getUserMessage(errorDetails: ErrorDetails): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.SPEECH_RECOGNITION_NOT_SUPPORTED]: 'Voice recognition is not supported in this browser. Please try Chrome or Edge.',
      [ErrorType.SPEECH_RECOGNITION_ERROR]: 'Voice recognition failed. Please try again.',
      [ErrorType.SPEECH_RECOGNITION_TIMEOUT]: 'Voice recognition timed out. Please try again.',
      [ErrorType.SPEECH_RECOGNITION_NO_SPEECH]: 'No speech detected. Please speak clearly and try again.',
      [ErrorType.SPEECH_RECOGNITION_AUDIO_CAPTURE]: 'Microphone access denied. Please allow microphone access and try again.',
      [ErrorType.SPEECH_RECOGNITION_NETWORK]: 'Network error during voice recognition. Please check your connection.',
      [ErrorType.SPEECH_RECOGNITION_ABORTED]: 'Voice recognition was cancelled.',

      [ErrorType.NETWORK_TIMEOUT]: 'Request timed out. Please check your connection and try again.',
      [ErrorType.NETWORK_OFFLINE]: 'You are offline. Please check your internet connection.',
      [ErrorType.NETWORK_CORS]: 'Network access denied. Please try again later.',
      [ErrorType.NETWORK_404]: 'Resource not found. Please try again later.',
      [ErrorType.NETWORK_500]: 'Server error. Please try again later.',
      [ErrorType.NETWORK_UNKNOWN]: 'Network error. Please try again.',

      [ErrorType.API_TIMEOUT]: 'API request timed out. Please try again.',
      [ErrorType.API_RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
      [ErrorType.API_AUTHENTICATION]: 'Authentication failed. Please log in again.',
      [ErrorType.API_AUTHORIZATION]: 'Access denied. Please check your permissions.',
      [ErrorType.API_VALIDATION]: 'Invalid request. Please check your input.',
      [ErrorType.API_SERVER_ERROR]: 'Server error. Please try again later.',

      [ErrorType.STORAGE_QUOTA_EXCEEDED]: 'Storage limit reached. Some features may not work properly.',
      [ErrorType.STORAGE_ACCESS_DENIED]: 'Storage access denied. Some features may not work properly.',
      [ErrorType.STORAGE_CORRUPTED]: 'Storage data corrupted. Settings have been reset.',
      [ErrorType.STORAGE_NOT_AVAILABLE]: 'Storage not available. Some features may not work properly.',

      [ErrorType.EXTENSION_PERMISSION_DENIED]: 'Extension permission denied. Please check your browser settings.',
      [ErrorType.EXTENSION_API_NOT_AVAILABLE]: 'Extension API not available. Please update your browser.',
      [ErrorType.EXTENSION_CONTEXT_INVALID]: 'Extension context invalid. Please refresh the page.',

      [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
      [ErrorType.VALIDATION_ERROR]: 'Invalid input. Please check your data and try again.',
      [ErrorType.TIMEOUT_ERROR]: 'Operation timed out. Please try again.',
    };

    return messages[errorDetails.type] || messages[ErrorType.UNKNOWN_ERROR];
  }

  private getRecoveryStrategy(errorDetails: ErrorDetails): RecoveryStrategy | null {
    const strategies: Partial<Record<ErrorType, RecoveryStrategy>> = {
      [ErrorType.SPEECH_RECOGNITION_ERROR]: {
        type: 'retry',
        maxRetries: 2,
        retryDelay: 1000,
        userMessage: 'Retrying voice recognition...'
      },
      [ErrorType.SPEECH_RECOGNITION_TIMEOUT]: {
        type: 'retry',
        maxRetries: 1,
        retryDelay: 2000,
        userMessage: 'Retrying voice recognition...'
      },
      [ErrorType.NETWORK_TIMEOUT]: {
        type: 'retry',
        maxRetries: 3,
        retryDelay: 2000,
        userMessage: 'Retrying network request...'
      },
      [ErrorType.NETWORK_OFFLINE]: {
        type: 'degrade',
        userMessage: 'Working offline. Some features may be limited.'
      },
      [ErrorType.API_RATE_LIMIT]: {
        type: 'retry',
        maxRetries: 1,
        retryDelay: 5000,
        userMessage: 'Rate limit reached. Retrying in 5 seconds...'
      },
      [ErrorType.STORAGE_QUOTA_EXCEEDED]: {
        type: 'degrade',
        userMessage: 'Storage limit reached. Using fallback storage.'
      },
      [ErrorType.EXTENSION_PERMISSION_DENIED]: {
        type: 'abort',
        userMessage: 'Permission denied. Please check browser settings.'
      }
    };

    return strategies[errorDetails.type] || null;
  }

  private async attemptRecovery(
    errorDetails: ErrorDetails,
    strategy: RecoveryStrategy
  ): Promise<void> {
    const errorKey = `${errorDetails.type}_${errorDetails.timestamp}`;
    const currentRetries = this.retryCounts.get(errorKey) || 0;

    switch (strategy.type) {
      case 'retry':
        if (currentRetries < (strategy.maxRetries || this.config.maxRetries)) {
          this.retryCounts.set(errorKey, currentRetries + 1);

          if (strategy.userMessage) {
            this.showUserFeedback({
              ...errorDetails,
              message: strategy.userMessage
            });
          }

          setTimeout(() => {
            // Trigger retry logic (implemented by calling code)
            this.emitRetryEvent(errorDetails);
          }, strategy.retryDelay || this.config.retryDelay);
        }
        break;

      case 'fallback':
        if (strategy.fallbackAction) {
          strategy.fallbackAction();
        }
        break;

      case 'degrade':
        // Implement graceful degradation
        this.emitDegradeEvent(errorDetails);
        break;

      case 'abort':
        // Stop all operations
        this.emitAbortEvent(errorDetails);
        break;
    }
  }

  private emitRetryEvent(errorDetails: ErrorDetails): void {
    const event = new CustomEvent('samantha:retry', { detail: errorDetails });
    window.dispatchEvent(event);
  }

  private emitDegradeEvent(errorDetails: ErrorDetails): void {
    const event = new CustomEvent('samantha:degrade', { detail: errorDetails });
    window.dispatchEvent(event);
  }

  private emitAbortEvent(errorDetails: ErrorDetails): void {
    const event = new CustomEvent('samantha:abort', { detail: errorDetails });
    window.dispatchEvent(event);
  }

  public logInfo(message: string, context?: Record<string, unknown>): void {
    if (this.config.logToConsole) {
      console.log(`[Samantha AI] ${message}`, context);
    }
  }

  public getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
    this.retryCounts.clear();
  }

  public setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  public getDebugInfo(): Record<string, unknown> {
    return {
      errorCount: this.errorLog.length,
      browser: this.detectBrowser(),
      version: this.detectVersion(),
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      storageAvailable: this.checkStorageAvailability(),
      config: this.config
    };
  }

  private checkStorageAvailability(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Types are already exported above
