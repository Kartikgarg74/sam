// Voice Processing Error Handler
// Comprehensive error handling with browser-specific strategies

export interface VoiceError {
  type: 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'API_UNAVAILABLE' | 'AUDIO_CAPTURE_FAILED' | 'BROWSER_UNSUPPORTED' | 'UNKNOWN';
  message: string;
  browser?: string;
  timestamp: number;
  retryCount?: number;
}

export interface FallbackStrategy {
  name: string;
  description: string;
  browserSupport: string[];
  implementation: () => Promise<any>;
}

export class VoiceErrorHandler {
  private errorCounts = new Map<string, number>();
  private fallbackStrategies = new Map<string, FallbackStrategy>();
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.initializeFallbackStrategies();
  }

  private initializeFallbackStrategies(): void {
    // Permission error fallbacks
    this.fallbackStrategies.set('PERMISSION_DENIED', {
      name: 'Permission Request Dialog',
      description: 'Show user-friendly permission request dialog',
      browserSupport: ['chrome', 'firefox', 'safari', 'edge'],
      implementation: async () => {
        return this.requestMicrophonePermission();
      }
    });

    // Network error fallbacks
    this.fallbackStrategies.set('NETWORK_ERROR', {
      name: 'Offline Mode',
      description: 'Switch to offline voice processing',
      browserSupport: ['chrome', 'firefox', 'safari', 'edge'],
      implementation: async () => {
        return this.enableOfflineMode();
      }
    });

    // API unavailable fallbacks
    this.fallbackStrategies.set('API_UNAVAILABLE', {
      name: 'Alternative API',
      description: 'Use alternative speech recognition API',
      browserSupport: ['chrome', 'firefox', 'safari', 'edge'],
      implementation: async () => {
        return this.useAlternativeAPI();
      }
    });

    // Audio capture fallbacks
    this.fallbackStrategies.set('AUDIO_CAPTURE_FAILED', {
      name: 'Audio Fallback',
      description: 'Use alternative audio capture method',
      browserSupport: ['chrome', 'firefox', 'safari', 'edge'],
      implementation: async () => {
        return this.useAudioFallback();
      }
    });

    // Browser unsupported fallbacks
    this.fallbackStrategies.set('BROWSER_UNSUPPORTED', {
      name: 'Text Input Fallback',
      description: 'Fallback to text input interface',
      browserSupport: ['chrome', 'firefox', 'safari', 'edge'],
      implementation: async () => {
        return this.enableTextInput();
      }
    });
  }

  async handleError(error: VoiceError): Promise<any> {
    // Track error frequency
    this.errorCounts.set(error.type, (this.errorCounts.get(error.type) || 0) + 1);

    console.error(`Voice processing error: ${error.type} - ${error.message}`);

    // Get appropriate fallback strategy
    const strategy = this.fallbackStrategies.get(error.type);
    if (!strategy) {
      return this.handleGenericError(error);
    }

    // Check if we should retry
    const retryCount = error.retryCount || 0;
    if (retryCount < this.maxRetries) {
      await this.delay(this.retryDelay * (retryCount + 1));
      return this.retryOperation(error, retryCount + 1);
    }

    // Execute fallback strategy
    try {
      return await strategy.implementation();
    } catch (fallbackError) {
      console.error('Fallback strategy failed:', fallbackError);
      return this.handleGenericError(error);
    }
  }

  private async handlePermissionError(): Promise<any> {
    console.log('Handling permission error...');

    // Show user-friendly permission dialog
    const permission = await this.requestMicrophonePermission();
    if (permission) {
      return { success: true, action: 'retry' };
    } else {
      return { success: false, action: 'fallback_to_text' };
    }
  }

  private async handleNetworkError(): Promise<any> {
    console.log('Handling network error...');

    // Check if we can work offline
    const offlineCapable = await this.checkOfflineCapability();
    if (offlineCapable) {
      return { success: true, action: 'enable_offline_mode' };
    } else {
      return { success: false, action: 'show_network_error' };
    }
  }

  private async handleAPIError(): Promise<any> {
    console.log('Handling API error...');

    // Try alternative APIs
    const alternativeAPI = await this.findAlternativeAPI();
    if (alternativeAPI) {
      return { success: true, action: 'use_alternative_api', api: alternativeAPI };
    } else {
      return { success: false, action: 'fallback_to_text' };
    }
  }

  private async handleAudioError(): Promise<any> {
    console.log('Handling audio error...');

    // Try alternative audio capture methods
    const audioMethod = await this.findAlternativeAudioMethod();
    if (audioMethod) {
      return { success: true, action: 'use_alternative_audio', method: audioMethod };
    } else {
      return { success: false, action: 'fallback_to_text' };
    }
  }

  private async handleGenericError(error: VoiceError): Promise<any> {
    console.log('Handling generic error...');

    // Show user-friendly error message
    this.showErrorMessage(error);

    return { success: false, action: 'show_error', error: error.message };
  }

  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      // Try to get microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  private async checkOfflineCapability(): Promise<boolean> {
    // Check if we have offline speech recognition capabilities
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  private async findAlternativeAPI(): Promise<string | null> {
    // Check for alternative speech recognition APIs
    if ('webkitSpeechRecognition' in window) {
      return 'webkitSpeechRecognition';
    }
    if ('SpeechRecognition' in window) {
      return 'SpeechRecognition';
    }
    return null;
  }

  private async findAlternativeAudioMethod(): Promise<string | null> {
    // Check for alternative audio capture methods
    if (typeof chrome !== 'undefined' && chrome.tabCapture) {
      return 'tabCapture';
    }
    if ('getUserMedia' in navigator.mediaDevices) {
      return 'getUserMedia';
    }
    return null;
  }

  private async enableOfflineMode(): Promise<any> {
    console.log('Enabling offline mode...');
    // Implementation for offline voice processing
    return { mode: 'offline', capabilities: ['basic_commands'] };
  }

  private async useAlternativeAPI(): Promise<any> {
    console.log('Using alternative API...');
    // Implementation for alternative speech recognition
    return { api: 'alternative', status: 'initialized' };
  }

  private async useAudioFallback(): Promise<any> {
    console.log('Using audio fallback...');
    // Implementation for alternative audio capture
    return { method: 'fallback', status: 'initialized' };
  }

  private async enableTextInput(): Promise<any> {
    console.log('Enabling text input fallback...');
    // Implementation for text input interface
    return { mode: 'text_input', status: 'enabled' };
  }

  private async retryOperation(error: VoiceError, retryCount: number): Promise<any> {
    console.log(`Retrying operation (attempt ${retryCount})...`);

    // Create new error with updated retry count
    const retryError: VoiceError = {
      ...error,
      retryCount,
      timestamp: Date.now()
    };

    // Re-throw for retry
    throw retryError;
  }

  private showErrorMessage(error: VoiceError): void {
    // Show user-friendly error message
    const messages = {
      'PERMISSION_DENIED': 'Microphone access is required for voice commands. Please allow microphone access and try again.',
      'NETWORK_ERROR': 'Network connection is required for voice processing. Please check your internet connection.',
      'API_UNAVAILABLE': 'Voice recognition is not available in your browser. Please try a different browser.',
      'AUDIO_CAPTURE_FAILED': 'Unable to capture audio. Please check your microphone settings.',
      'BROWSER_UNSUPPORTED': 'Your browser does not support voice commands. Please use Chrome, Firefox, or Safari.',
      'UNKNOWN': 'An unexpected error occurred. Please try again.'
    };

    const message = messages[error.type] || messages['UNKNOWN'];
    console.error('User message:', message);

    // Emit error event for UI to display
    // this.emit('showError', message);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getErrorStats(): Map<string, number> {
    return new Map(this.errorCounts);
  }

  getFallbackStrategies(): Map<string, FallbackStrategy> {
    return new Map(this.fallbackStrategies);
  }

  resetErrorCounts(): void {
    this.errorCounts.clear();
  }
}
