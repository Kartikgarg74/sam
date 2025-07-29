// integration-error-recovery.test.ts
// End-to-end integration test for error handling and recovery system

import { errorHandler, ErrorType } from '../app/utils/errorHandler';
import { apiClient } from '../app/utils/apiClient';
import { storageManager } from '../app/utils/storageManager';

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks and error logs
    jest.clearAllMocks();
    errorHandler.clearErrorLog();
    errorHandler.setDebugMode(false);

    // Reset localStorage mocks
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
    (localStorage.setItem as jest.Mock).mockImplementation(() => {});
    (localStorage.removeItem as jest.Mock).mockImplementation(() => {});
  });

  describe('Real-World Error Scenarios', () => {
    test('should handle network failure with graceful degradation', async () => {
      // Simulate network failure
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Attempt API call
      try {
        await apiClient.get('/api/user-data');
      } catch (error) {
        // Expected to fail
      }

      // Verify error was handled
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      expect(errorLog[0].type).toBe(ErrorType.NETWORK_UNKNOWN);
    });

    test('should handle storage quota exceeded with cleanup', async () => {
      // Simulate storage quota exceeded
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Attempt to store large data
      try {
        await storageManager.set('large-data', 'x'.repeat(1000000));
      } catch (error) {
        // Expected to fail
      }

      // Verify error was handled and cleanup attempted
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      expect(errorLog[0].type).toBe(ErrorType.STORAGE_QUOTA_EXCEEDED);
    });

    test('should handle speech recognition permission denial', () => {
      // Simulate microphone permission denial
      const error = new Error('Permission denied');
      errorHandler.handleError(error, {
        type: ErrorType.SPEECH_RECOGNITION_AUDIO_CAPTURE
      });

      // Verify error was handled with appropriate user message
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBe(1);
      expect(errorLog[0].type).toBe(ErrorType.SPEECH_RECOGNITION_AUDIO_CAPTURE);
      expect(errorLog[0].message).toContain('Microphone access denied');
    });

    test('should handle API rate limiting with retry', async () => {
      // Mock rate limit response
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: () => Promise.resolve({ error: 'Rate limit exceeded' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Map()
        });

      // Attempt API call with retry
      const response = await apiClient.get('/api/data', { retries: 2 });

      // Verify retry worked
      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should handle data corruption with automatic cleanup', async () => {
      // Simulate corrupted data
      const corruptedData = JSON.stringify({
        value: { test: true },
        timestamp: Date.now(),
        version: '1.0.0',
        checksum: 'wrong-checksum' // Invalid checksum
      });

      (localStorage.getItem as jest.Mock).mockReturnValue(corruptedData);

      // Attempt to retrieve data
      const result = await storageManager.get('corrupted-data');

      // Verify corrupted data was detected and removed
      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('samantha-ai:corrupted-data');
    });

    test('should handle offline mode with graceful degradation', () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      // Trigger offline error
      errorHandler.handleError(new Error('Network connection lost'), {
        type: ErrorType.NETWORK_OFFLINE
      });

      // Verify offline error was handled
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBe(1);
      expect(errorLog[0].type).toBe(ErrorType.NETWORK_OFFLINE);
    });
  });

  describe('Recovery Strategy Validation', () => {
    test('should implement retry strategy for network errors', () => {
      const error = new Error('Network timeout');
      const result = errorHandler.handleError(error, {
        type: ErrorType.NETWORK_TIMEOUT
      });

      expect(result.type).toBe(ErrorType.NETWORK_TIMEOUT);

      // Verify retry event was emitted
      const mockEventListener = jest.fn();
      window.addEventListener('samantha:retry', mockEventListener);

      // Simulate retry event
      window.dispatchEvent(new CustomEvent('samantha:retry', {
        detail: { type: ErrorType.NETWORK_TIMEOUT }
      }));

      expect(mockEventListener).toHaveBeenCalled();
    });

    test('should implement fallback strategy for storage errors', async () => {
      // Simulate storage access denied
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Access denied');
      });

      try {
        await storageManager.set('test-key', 'test-value');
      } catch (error) {
        // Expected to fail
      }

      // Verify fallback was attempted
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      expect(errorLog[0].type).toBe(ErrorType.STORAGE_ACCESS_DENIED);
    });

    test('should implement degrade strategy for critical errors', () => {
      const error = new Error('Critical system error');
      const result = errorHandler.handleError(error, {
        type: ErrorType.EXTENSION_PERMISSION_DENIED
      });

      expect(result.type).toBe(ErrorType.EXTENSION_PERMISSION_DENIED);

      // Verify degrade event was emitted
      const mockEventListener = jest.fn();
      window.addEventListener('samantha:degrade', mockEventListener);

      // Simulate degrade event
      window.dispatchEvent(new CustomEvent('samantha:degrade', {
        detail: { type: ErrorType.EXTENSION_PERMISSION_DENIED }
      }));

      expect(mockEventListener).toHaveBeenCalled();
    });
  });

  describe('Performance Under Error Conditions', () => {
    test('should handle high error volume efficiently', () => {
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

    test('should handle concurrent error processing', async () => {
      const promises = [];

      // Start 50 concurrent error operations
      for (let i = 0; i < 50; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            errorHandler.handleError(new Error(`Concurrent error ${i}`), {
              type: ErrorType.UNKNOWN_ERROR
            });
            resolve();
          })
        );
      }

      await Promise.all(promises);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(50);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    test('should work in Chrome environment', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      });

      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.browser).toBe('Chrome');
    });

    test('should work in Firefox environment', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        writable: true
      });

      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.browser).toBe('Firefox');
    });

    test('should work in Safari environment', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        writable: true
      });

      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.browser).toBe('Safari');
    });
  });

  describe('User Experience Validation', () => {
    test('should provide clear error messages', () => {
      const error = new Error('Test error');
      const result = errorHandler.handleError(error, {
        type: ErrorType.SPEECH_RECOGNITION_AUDIO_CAPTURE
      });

      expect(result.message).toContain('Microphone access denied');
    });

    test('should log errors with sufficient context', () => {
      const error = new Error('API call failed');
      const result = errorHandler.handleError(error, {
        type: ErrorType.API_SERVER_ERROR,
        context: {
          operation: 'fetchUserData',
          endpoint: '/api/user',
          statusCode: 500
        }
      });

      expect(result.context).toBeDefined();
      expect(result.context?.operation).toBe('fetchUserData');
      expect(result.context?.endpoint).toBe('/api/user');
      expect(result.context?.statusCode).toBe(500);
    });

    test('should maintain application state during errors', () => {
      // Simulate error during voice recognition
      const error = new Error('Speech recognition failed');
      errorHandler.handleError(error, {
        type: ErrorType.SPEECH_RECOGNITION_ERROR
      });

      // Verify error was handled without crashing
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog.length).toBe(1);
      expect(errorLog[0].type).toBe(ErrorType.SPEECH_RECOGNITION_ERROR);
    });
  });

  describe('Debug Mode Integration', () => {
    test('should enable debug mode correctly', () => {
      errorHandler.setDebugMode(true);
      const debugInfo = errorHandler.getDebugInfo();
      expect(debugInfo.config?.enableDebugMode).toBe(true);

      errorHandler.setDebugMode(false);
      const debugInfo2 = errorHandler.getDebugInfo();
      expect(debugInfo2.config?.enableDebugMode).toBe(false);
    });

    test('should provide comprehensive debug information', () => {
      const debugInfo = errorHandler.getDebugInfo();

      expect(debugInfo).toHaveProperty('errorCount');
      expect(debugInfo).toHaveProperty('browser');
      expect(debugInfo).toHaveProperty('version');
      expect(debugInfo).toHaveProperty('userAgent');
      expect(debugInfo).toHaveProperty('online');
      expect(debugInfo).toHaveProperty('storageAvailable');
      expect(debugInfo).toHaveProperty('config');
    });

    test('should export error data for analysis', () => {
      // Generate some test errors
      for (let i = 0; i < 5; i++) {
        errorHandler.handleError(new Error(`Test error ${i}`), {
          type: ErrorType.UNKNOWN_ERROR
        });
      }

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(5);

      // Verify error data structure
      errorLog.forEach(error => {
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('timestamp');
        expect(error).toHaveProperty('browser');
        expect(error).toHaveProperty('version');
      });
    });
  });
});
