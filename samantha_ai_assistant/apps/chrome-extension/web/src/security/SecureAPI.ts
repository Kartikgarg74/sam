import { EventEmitter } from 'events';

// Types for secure API communication
export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  headers: Record<string, string>;
}

export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  rateLimit: {
    requests: number;
    window: number; // milliseconds
  };
}

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export class SecureAPI extends EventEmitter {
  private config: APIConfig;
  private requestQueue: Array<() => Promise<void>> = [];
  private rateLimitInfo: RateLimitInfo = {
    remaining: 100,
    reset: Date.now() + 60000,
    limit: 100
  };
  private isProcessing = false;

  constructor(config: APIConfig) {
    super();
    this.config = {
      ...config,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      rateLimit: {
        requests: config.rateLimit?.requests || 100,
        window: config.rateLimit?.window || 60000
      },
    };
  }

  /**
   * Make a secure API request with authentication and rate limiting
   */
  async request<T = unknown>(request: APIRequest): Promise<APIResponse<T>> {
    try {
      // Validate request
      this.validateRequest(request);

      // Check rate limiting
      await this.checkRateLimit();

      // Add to queue if processing
      if (this.isProcessing) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push(async () => {
            try {
              const response = await this.executeRequest<T>(request);
              resolve(response);
            } catch (error) {
              reject(error);
            }
          });
        });
      }

      return await this.executeRequest<T>(request);

    } catch (error) {
      console.error('API request failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Execute the actual API request
   */
  private async executeRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    this.isProcessing = true;

    try {
      // Prepare request
      const preparedRequest = await this.prepareRequest(request);

      // Execute with retry logic
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
        try {
          const response = await this.makeRequest<T>(preparedRequest);

          // Update rate limit info
          this.updateRateLimit(response.headers);

          this.isProcessing = false;
          this.processQueue();

          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Don't retry on client errors (4xx)
          if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
            break;
          }

          // Wait before retry
          if (attempt < this.config.retryAttempts) {
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }

      throw lastError || new Error('Request failed after all retry attempts');

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Prepare request with authentication and headers
   */
  private async prepareRequest(request: APIRequest): Promise<APIRequest> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Samantha-AI-Extension/1.0',
      'X-API-Key': this.config.apiKey,
      'X-Request-ID': this.generateRequestId(),
      'X-Timestamp': Date.now().toString(),
      ...request.headers
    };

    // Add signature for security
    const signature = await this.generateSignature(request);
    headers['X-Signature'] = signature;

    return {
      ...request,
      headers,
      timeout: request.timeout || this.config.timeout
    };
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeout || this.config.timeout);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.data ? JSON.stringify(request.data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await this.parseResponse<T>(response);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseData.error || 'Request failed'}`);
      }

      return responseData;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Parse API response
   */
  private async parseResponse<T>(response: Response): Promise<APIResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let data: T | undefined;
    let error: string | undefined;

    try {
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as unknown as T;
      }
    } catch (parseError) {
      error = 'Failed to parse response';
    }

    return {
      success: response.ok,
      data,
      error,
      status: response.status,
      headers
    };
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: APIRequest): void {
    if (!request.url) {
      throw new Error('URL is required');
    }

    if (!request.method) {
      throw new Error('HTTP method is required');
    }

    // Validate URL format
    try {
      new URL(request.url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Check for sensitive data in URL
    if (request.url.includes('password') || request.url.includes('token')) {
      throw new Error('Sensitive data should not be included in URL');
    }

    // Validate data size
    if (request.data && JSON.stringify(request.data).length > 1024 * 1024) {
      throw new Error('Request data too large (max 1MB)');
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset rate limit if window has passed
    if (now > this.rateLimitInfo.reset) {
      this.rateLimitInfo = {
        remaining: this.config.rateLimit.requests,
        reset: now + this.config.rateLimit.window,
        limit: this.config.rateLimit.requests
      };
    }

    // Check if we have remaining requests
    if (this.rateLimitInfo.remaining <= 0) {
      const waitTime = this.rateLimitInfo.reset - now;
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`);
    }

    // Decrement remaining requests
    this.rateLimitInfo.remaining--;
  }

  /**
   * Update rate limit info from response headers
   */
  private updateRateLimit(headers: Record<string, string>): void {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    const limit = headers['x-ratelimit-limit'];

    if (remaining) {
      this.rateLimitInfo.remaining = parseInt(remaining, 10);
    }

    if (reset) {
      this.rateLimitInfo.reset = parseInt(reset, 10) * 1000;
    }

    if (limit) {
      this.rateLimitInfo.limit = parseInt(limit, 10);
    }
  }

  /**
   * Generate request signature for security
   */
  private async generateSignature(request: APIRequest): Promise<string> {
    const timestamp = Date.now().toString();
    const payload = `${request.method}${request.url}${JSON.stringify(request.data || '')}${timestamp}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.config.apiKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    if (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit info
   */
  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Clear request queue
   */
  clearQueue(): void {
    this.requestQueue = [];
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request({
        method: 'GET',
        url: `${this.config.baseUrl}/health`
      });
      return response.success;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API statistics
   */
  getStats(): {
    queueLength: number;
    rateLimitInfo: RateLimitInfo;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.requestQueue.length,
      rateLimitInfo: this.getRateLimitInfo(),
      isProcessing: this.isProcessing
    };
  }
}

// Export singleton instance
export const secureAPI = new SecureAPI({
  baseUrl: 'https://api.samantha-ai.com',
  apiKey: process.env.SAMANTHA_API_KEY || '',
  timeout: 30000,
  retryAttempts: 3,
  rateLimit: {
    requests: 100,
    window: 60000
  }
});
