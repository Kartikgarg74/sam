// apiClient.ts
// Comprehensive API client with error handling and retry logic

import { errorHandler, ErrorType } from './errorHandler';

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTimeout?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  ok: boolean;
}

export interface ApiError {
  type: ErrorType;
  message: string;
  status?: number;
  statusText?: string;
  response?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 10000; // 10 seconds
  private defaultRetries: number = 3;
  private defaultRetryDelay: number = 1000; // 1 second
  private cache: Map<string, { data: unknown; timestamp: number; timeout: number }> = new Map();

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    url: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      cache = false,
      cacheTimeout = 300000 // 5 minutes
    } = config;

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const cacheKey = `${method}:${fullUrl}:${JSON.stringify(body || '')}`;

    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.timeout) {
        return cached.data as ApiResponse<T>;
      }
    }

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestConfig: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          signal: controller.signal
        };

        if (body) {
          requestConfig.body = JSON.stringify(body);
        }

        const response = await fetch(fullUrl, requestConfig);
        clearTimeout(timeoutId);

        if (!response.ok) {
                     const errorType = this.getErrorType(response.status);
           const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
           const error: ApiError = {
             type: errorType,
             message: errorMessage,
             status: response.status,
             statusText: response.statusText
           };

           // Don't retry on client errors (4xx) except 429 (rate limit)
           if (response.status >= 400 && response.status < 500 && response.status !== 429) {
             errorHandler.handleError(new Error(errorMessage), { type: errorType });
             throw error;
           }

           // Retry on server errors (5xx) and rate limits
           if (attempt < retries) {
             lastError = error;
             await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
             continue;
           }

           errorHandler.handleError(new Error(errorMessage), { type: errorType });
           throw error;
        }

        const data = await response.json();
        const apiResponse: ApiResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          ok: response.ok
        };

        // Cache successful GET responses
        if (cache && method === 'GET') {
          this.cache.set(cacheKey, {
            data: apiResponse,
            timestamp: Date.now(),
            timeout: cacheTimeout
          });
        }

        return apiResponse;

      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            const timeoutError: ApiError = {
              type: ErrorType.API_TIMEOUT,
              message: `Request timed out after ${timeout}ms`
            };
            errorHandler.handleError(new Error(timeoutError.message), { type: timeoutError.type });
            throw timeoutError;
          }

          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const networkError: ApiError = {
              type: ErrorType.NETWORK_UNKNOWN,
              message: 'Network error - check your connection'
            };
            errorHandler.handleError(new Error(networkError.message), { type: networkError.type });
            throw networkError;
          }
        }

                 if (error instanceof Error && 'type' in error) {
           errorHandler.handleError(error);
           throw error;
         }

         lastError = {
           type: ErrorType.API_SERVER_ERROR,
           message: error instanceof Error ? error.message : 'Unknown API error'
         };

         if (attempt < retries) {
           await this.delay(retryDelay * Math.pow(2, attempt));
           continue;
         }

         errorHandler.handleError(new Error(lastError.message), { type: lastError.type });
         throw lastError;
      }
    }

    throw lastError || {
      type: ErrorType.API_SERVER_ERROR,
      message: 'Request failed after all retries'
    };
  }

  private getErrorType(status: number): ErrorType {
    switch (status) {
      case 400:
        return ErrorType.API_VALIDATION;
      case 401:
        return ErrorType.API_AUTHENTICATION;
      case 403:
        return ErrorType.API_AUTHORIZATION;
      case 404:
        return ErrorType.NETWORK_404;
      case 429:
        return ErrorType.API_RATE_LIMIT;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorType.API_SERVER_ERROR;
      default:
        return ErrorType.API_SERVER_ERROR;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  public async get<T>(url: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'GET' });
  }

  public async post<T>(url: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'POST', body: data });
  }

  public async put<T>(url: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'PUT', body: data });
  }

  public async delete<T>(url: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'DELETE' });
  }

  public async patch<T>(url: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'PATCH', body: data });
  }

  // Cache management
  public clearCache(): void {
    this.cache.clear();
  }

  public removeFromCache(url: string): void {
    const keysToRemove = Array.from(this.cache.keys()).filter(key => key.includes(url));
    keysToRemove.forEach(key => this.cache.delete(key));
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000, retries: 1 });
      return true;
    } catch {
      return false;
    }
  }

  // Batch requests
  public async batch<T>(requests: Array<{ url: string; config?: ApiRequestConfig }>): Promise<ApiResponse<T>[]> {
    const promises = requests.map(({ url, config }) => this.makeRequest<T>(url, config));
    return Promise.all(promises);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Types are already exported above
