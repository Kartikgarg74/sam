import { EventEmitter } from 'events';

// Types for content script security
export interface SecureMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  signature: string;
  origin: string;
}

export interface MessageValidation {
  isValid: boolean;
  error?: string;
  sanitizedData?: unknown;
}

export interface SecurityConfig {
  allowedOrigins: string[];
  maxMessageSize: number;
  requireSignature: boolean;
  timeout: number;
}

export class ContentScriptSecurity extends EventEmitter {
  private config: SecurityConfig;
  private messageHandlers: Map<string, (data: unknown) => Promise<unknown>> = new Map();
  private pendingMessages: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }> = new Map();

  constructor(config: SecurityConfig) {
    super();
    this.config = {
      ...config,
      allowedOrigins: config.allowedOrigins || ['chrome-extension://*', 'moz-extension://*', 'safari-extension://*'],
      maxMessageSize: config.maxMessageSize || 1024 * 1024, // 1MB
      requireSignature: config.requireSignature !== undefined ? config.requireSignature : true,
      timeout: config.timeout || 30000,
    };

    this.setupMessageListeners();
  }

  /**
   * Setup secure message listeners
   */
  private setupMessageListeners(): void {
    // Listen for messages from content scripts
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleIncomingMessage(message, sender, sendResponse);
        return true; // Keep message channel open
      });
    }

    // Listen for messages from background scripts
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        this.handleWindowMessage(event);
      });
    }
  }

  /**
   * Handle incoming messages from content scripts
   */
  private async handleIncomingMessage(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void): Promise<void> {
    try {
      // Validate message
      const validation = this.validateMessage(message, sender);

      if (!validation.isValid) {
        console.error('Invalid message received:', validation.error);
        sendResponse({ success: false, error: validation.error });
        return;
      }

      // Process message
      const response = await this.processMessage(validation.sanitizedData!, sender);
      sendResponse({ success: true, data: response });

    } catch (error) {
      console.error('Error handling incoming message:', error);
      sendResponse({ success: false, error: 'Internal error' });
    }
  }

  /**
   * Handle window messages (for cross-origin communication)
   */
  private async handleWindowMessage(event: MessageEvent): Promise<void> {
    try {
      // Validate origin
      if (!this.isAllowedOrigin(event.origin)) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }

      // Validate message
      const validation = this.validateMessage(event.data, { origin: event.origin });

      if (!validation.isValid) {
        console.error('Invalid window message:', validation.error);
        return;
      }

      // Process message
      await this.processMessage(validation.sanitizedData!, { origin: event.origin });

    } catch (error) {
      console.error('Error handling window message:', error);
    }
  }

  /**
   * Validate incoming message
   */
  private validateMessage(message: unknown, sender: { origin?: string }): MessageValidation {
    try {
      // Check if message is an object
      if (!message || typeof message !== 'object') {
        return { isValid: false, error: 'Invalid message format' };
      }

      const msg = message as SecureMessage;

      // Validate required fields
      if (!msg.id || !msg.type || !msg.timestamp || !msg.signature) {
        return { isValid: false, error: 'Missing required fields' };
      }

      // Check message size
      const messageSize = JSON.stringify(message).length;
      if (messageSize > this.config.maxMessageSize) {
        return { isValid: false, error: 'Message too large' };
      }

      // Validate timestamp (prevent replay attacks)
      const now = Date.now();
      const messageAge = now - msg.timestamp;
      if (messageAge > this.config.timeout || messageAge < -60000) { // Allow 1 minute clock skew
        return { isValid: false, error: 'Message timestamp invalid' };
      }

      // Validate signature if required
      if (this.config.requireSignature) {
        const isValidSignature = this.validateSignature(msg);
        if (!isValidSignature) {
          return { isValid: false, error: 'Invalid message signature' };
        }
      }

      // Sanitize data
      const sanitizedData = this.sanitizeData(msg.data);

      return {
        isValid: true,
        sanitizedData
      };

    } catch (error) {
      return { isValid: false, error: 'Message validation failed' };
    }
  }

  /**
   * Validate message signature
   */
  private validateSignature(message: SecureMessage): boolean {
    try {
      const payload = `${message.id}${message.type}${JSON.stringify(message.data)}${message.timestamp}`;
      const expectedSignature = this.generateSignature(payload);
      return message.signature === expectedSignature;
    } catch (error) {
      console.error('Signature validation failed:', error);
      return false;
    }
  }

  /**
   * Generate message signature
   */
  private generateSignature(payload: string): string {
    // In a real implementation, this would use a proper cryptographic signature
    // For now, we'll use a simple hash
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Sanitize message data
   */
  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Sanitize strings
      return this.sanitizeString(data);
    } else if (typeof data === 'object' && data !== null) {
      // Sanitize objects
      return this.sanitizeObject(data as Record<string, unknown>);
    }
    return data;
  }

  /**
   * Sanitize string data
   */
  private sanitizeString(str: string): string {
    // Remove potentially dangerous characters
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .trim();
  }

  /**
   * Sanitize object data
   */
  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = this.sanitizeString(key);

      // Sanitize value
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if origin is allowed
   */
  private isAllowedOrigin(origin: string): boolean {
    return this.config.allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });
  }

  /**
   * Process validated message
   */
  private async processMessage(data: unknown, sender: chrome.runtime.MessageSender): Promise<unknown> {
    const message = data as SecureMessage;

    // Check if we have a handler for this message type
    const handler = this.messageHandlers.get(message.type);
    if (!handler) {
      throw new Error(`No handler for message type: ${message.type}`);
    }

    // Execute handler
    try {
      const result = await handler(message.data);
      this.emit('messageProcessed', { type: message.type, success: true });
      return result;
    } catch (error) {
      this.emit('messageProcessed', { type: message.type, success: false, error });
      throw error;
    }
  }

  /**
   * Register message handler
   */
  registerHandler(type: string, handler: (data: unknown) => Promise<unknown>): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Send secure message to content script
   */
  async sendMessage(tabId: number, type: string, data: unknown): Promise<unknown> {
    const message: SecureMessage = {
      id: this.generateMessageId(),
      type,
      data,
      timestamp: Date.now(),
      signature: '',
      origin: 'extension'
    };

    // Generate signature
    const payload = `${message.id}${message.type}${JSON.stringify(message.data)}${message.timestamp}`;
    message.signature = this.generateSignature(payload);

    try {
      const response = await chrome.tabs.sendMessage(tabId, message);

      if (response && response.success === false) {
        throw new Error(response.error || 'Message failed');
      }

      return response?.data;
    } catch (error) {
      console.error('Failed to send message to content script:', error);
      throw error;
    }
  }

  /**
   * Send secure message to background script
   */
  async sendToBackground(type: string, data: unknown): Promise<unknown> {
    const message: SecureMessage = {
      id: this.generateMessageId(),
      type,
      data,
      timestamp: Date.now(),
      signature: '',
      origin: 'content-script'
    };

    // Generate signature
    const payload = `${message.id}${message.type}${JSON.stringify(message.data)}${message.timestamp}`;
    message.signature = this.generateSignature(payload);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(message.id);
        reject(new Error('Message timeout'));
      }, this.config.timeout);

      this.pendingMessages.set(message.id, { resolve, reject, timeout });

      chrome.runtime.sendMessage(message, (response) => {
        const pending = this.pendingMessages.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingMessages.delete(message.id);

          if (chrome.runtime.lastError) {
            pending.reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success === false) {
            pending.reject(new Error(response.error || 'Message failed'));
          } else {
            pending.resolve(response?.data);
          }
        }
      });
    });
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get security statistics
   */
  getStats(): {
    handlersCount: number;
    pendingMessages: number;
    allowedOrigins: string[];
  } {
    return {
      handlersCount: this.messageHandlers.size,
      pendingMessages: this.pendingMessages.size,
      allowedOrigins: this.config.allowedOrigins
    };
  }

  /**
   * Clear pending messages
   */
  clearPendingMessages(): void {
    for (const [id, pending] of this.pendingMessages) {
      clearTimeout(pending.timeout);
    }
    this.pendingMessages.clear();
  }
}

// Export singleton instance
export const contentScriptSecurity = new ContentScriptSecurity({
  allowedOrigins: ['chrome-extension://*', 'moz-extension://*', 'safari-extension://*'],
  maxMessageSize: 1024 * 1024,
  requireSignature: true,
  timeout: 30000
});
