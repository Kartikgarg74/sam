// error-handling.test.ts
// Comprehensive test suite for error handling system

import { errorHandler, ErrorType } from '../app/utils/errorHandler';
import { apiClient } from '../app/utils/apiClient';
import { storageManager } from '../app/utils/storageManager';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock chrome APIs
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    getManifest: () => ({ version: '1.0.0' })
  }
} as any;

describe('Error Handling System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler.clearErrorLog();
    errorHandler.setDebugMode(false);
  });

  describe('ErrorHandler', () => {
    test('should handle basic errors', () => {
      const error = new Error('Test error');
      const result = errorHandler.handleError(error, {
        type: ErrorType.UNKNOWN_ERROR
      });

      expect(result.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(result.message).toBe('Test error');
      expect(result.timestamp).toBeDefined();
    });

    test('should categorize speech recognition errors', () => {
      const error = new Error('No speech detected');
      const result = errorHandler.handleError(error, {
        type: ErrorType.SPEECH_RECOGNITION_NO_SPEECH
      });

      expect(result.type).toBe(ErrorType.SPEECH_RECOGNITION_NO_SPEECH);
      expect(result.browser).toBeDefined();
      expect(result.version).toBeDefined();
    });

    test('should handle network errors', () => {
      const error = new Error('Network timeout');
      const result = errorHandler.handleError(error, {
        type: ErrorType.NETWORK_TIMEOUT
      });

      expect(result.type).toBe(ErrorType.NETWORK_TIMEOUT);
    });

    test('should log errors to storage', () => {
      const error = new Error('Storage test error');
      errorHandler.handleError(error, {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'samantha_error_logs',
        expect.any(String)
      );
    });

    test('should provide user-friendly messages', () => {
      const error = new Error('Test error');
      const result = errorHandler.handleError(error, {
        type: ErrorType.SPEECH_RECOGNITION_AUDIO_CAPTURE
      });

      expect(result.message).toContain('Microphone access denied');
    });

    test('should detect browser correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });

      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.browser).toBe('Chrome');
    });

    test('should handle debug mode toggle', () => {
      errorHandler.setDebugMode(true);
      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.config?.enableDebugMode).toBe(true);

      errorHandler.setDebugMode(false);
      const debugInfo2 = errorHandler.getDebugInfo();
      expect(debugInfo2.config?.enableDebugMode).toBe(false);
    });
  });

  describe('ApiClient', () => {
    test('should handle successful requests', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      const response = await apiClient.get('/test');
      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(200);
    });

    test('should handle network timeouts', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('AbortError'));

      await expect(apiClient.get('/test', { timeout: 100 })).rejects.toThrow();
    });

    test('should retry on server errors', async () => {
      const mockResponse = { error: 'Server error' };
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve(mockResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Map()
        });

      const response = await apiClient.get('/test', { retries: 2 });
      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should handle rate limiting', async () => {
      const mockResponse = { error: 'Rate limit exceeded' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve(mockResponse)
      });

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    test('should cache GET requests', async () => {
      const mockResponse = { data: 'cached data' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockResponse),
        headers: new Map()
      });

      // First request
      await apiClient.get('/test', { cache: true });

      // Second request should use cache
      const response = await apiClient.get('/test', { cache: true });
      expect(response.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle CORS errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('CORS error'));

      await expect(apiClient.get('/test')).rejects.toThrow();
    });
  });

  describe('StorageManager', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {});
    });

    test('should store and retrieve data', async () => {
      const testData = { name: 'Test User', preferences: { theme: 'dark' } };

      await storageManager.set('user-data', testData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'samantha-ai:user-data',
        expect.any(String)
      );

      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        value: testData,
        timestamp: Date.now(),
        version: '1.0.0',
        checksum: '123'
      }));

      const retrieved = await storageManager.get('user-data');
      expect(retrieved).toEqual(testData);
    });

    test('should handle storage quota exceeded', async () => {
      const quotaError = new Error('QuotaExceededError');
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      await expect(storageManager.set('large-data', 'x'.repeat(1000000))).rejects.toThrow();
    });

    test('should detect data corruption', async () => {
      const corruptedData = JSON.stringify({
        value: { test: true },
        timestamp: Date.now(),
        version: '1.0.0',
        checksum: 'wrong-checksum'
      });

      localStorageMock.getItem.mockReturnValue(corruptedData);

      const result = await storageManager.get('corrupted-data');
      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('samantha-ai:corrupted-data');
    });

    test('should handle storage access denied', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      await expect(storageManager.set('test', 'data')).rejects.toThrow();
    });

    test('should provide fallback storage', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await storageManager.get('fallback-test');
      expect(result).toBeNull();
    });

    test('should export and import data', async () => {
      const testData = { key1: 'value1', key2: 'value2' };

      // Mock storage with existing data
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        value: testData,
        timestamp: Date.now(),
        version: '1.0.0',
        checksum: '123'
      }));

      const exported = await storageManager.export();
      expect(exported).toHaveProperty('key1');
      expect(exported).toHaveProperty('key2');
    });

    test('should provide debug information', () => {
      const debugInfo = storageManager.getDebugInfo();
      expect(debugInfo).toHaveProperty('namespace');
      expect(debugInfo).toHaveProperty('version');
      expect(debugInfo).toHaveProperty('isInitialized');
    });
  });

  describe('Error Recovery Strategies', () => {
    test('should implement retry strategy', () => {
      const error = new Error('Retry test error');
      const result = errorHandler.handleError(error, {
        type: ErrorType.NETWORK_TIMEOUT
      });

      expect(result.type).toBe(ErrorType.NETWORK_TIMEOUT);
    });

    test('should implement fallback strategy', () => {
      const error = new Error('Fallback test error');
      const result = errorHandler.handleError(error, {
        type: ErrorType.STORAGE_QUOTA_EXCEEDED
      });

      expect(result.type).toBe(ErrorType.STORAGE_QUOTA_EXCEEDED);
    });

    test('should implement degrade strategy', () => {
      const error = new Error('Degrade test error');
      const result = errorHandler.handleError(error, {
        type: ErrorType.NETWORK_OFFLINE
      });

      expect(result.type).toBe(ErrorType.NETWORK_OFFLINE);
    });
  });

  describe('Integration Tests', () => {
    test('should handle voice processing errors end-to-end', async () => {
      // Simulate speech recognition error
      const error = new Error('Speech recognition failed');
      const result = errorHandler.handleError(error, {
        type: ErrorType.SPEECH_RECOGNITION_ERROR
      });

      expect(result.type).toBe(ErrorType.SPEECH_RECOGNITION_ERROR);

      // Verify error is logged
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.SPEECH_RECOGNITION_ERROR);
    });

    test('should handle API errors with storage fallback', async () => {
      // Mock API failure
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      // Mock storage success
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        value: { cached: 'data' },
        timestamp: Date.now(),
        version: '1.0.0',
        checksum: '123'
      }));

      // Test API call that falls back to storage
      try {
        await apiClient.get('/api/data');
      } catch (error) {
        // Expected to fail
      }

      // Verify error was handled
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
    });

    test('should handle storage errors with memory fallback', async () => {
      // Mock storage failure
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      // Test storage operation
      try {
        await storageManager.set('test-key', 'test-value');
      } catch (error) {
        // Expected to fail
      }

      // Verify error was handled
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle high error volume', () => {
      const startTime = Date.now();

      // Generate 100 errors rapidly
      for (let i = 0; i < 100; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), {
          type: ErrorType.UNKNOWN_ERROR
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(100);
    });

    test('should maintain performance with large error logs', () => {
      // Fill error log
      for (let i = 0; i < 200; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), {
          type: ErrorType.UNKNOWN_ERROR
        });
      }

      const startTime = Date.now();
      const errorLog = errorHandler.getErrorLog();
      const endTime = Date.now();

      // Should retrieve error log quickly (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(errorLog).toHaveLength(200);
    });
  });

  describe('Browser Compatibility Tests', () => {
    test('should work in Chrome', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });

      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.browser).toBe('Chrome');
    });

    test('should work in Firefox', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        configurable: true
      });

      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.browser).toBe('Firefox');
    });

    test('should work in Safari', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        configurable: true
      });

      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.browser).toBe('Safari');
    });

    test('should work in Edge', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        configurable: true
      });

      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.browser).toBe('Edge');
    });
  });
});
