// storageManager.ts
// Comprehensive storage manager with error handling and fallback mechanisms

import { errorHandler, ErrorType } from './errorHandler';

export interface StorageItem<T = unknown> {
  value: T;
  timestamp: number;
  version?: string;
  checksum?: string;
}

export interface StorageConfig {
  namespace: string;
  version: string;
  enableCompression?: boolean;
  enableEncryption?: boolean;
  maxSize?: number;
  fallbackStorage?: 'memory' | 'sessionStorage' | 'indexedDB';
}

class StorageManager {
  private config: StorageConfig;
  private memoryStorage: Map<string, StorageItem> = new Map();
  private isInitialized: boolean = false;

  constructor(config: StorageConfig) {
    this.config = {
      enableCompression: false,
      enableEncryption: false,
      maxSize: 5 * 1024 * 1024, // 5MB
      fallbackStorage: 'memory',
      ...config
    };
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test storage availability
      await this.testStorage();
      this.isInitialized = true;
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage initialization failed'), {
        type: ErrorType.STORAGE_NOT_AVAILABLE
      });
      throw error;
    }
  }

  private async testStorage(): Promise<void> {
    const testKey = `__test_${this.config.namespace}`;
    const testValue = { test: true, timestamp: Date.now() };

    try {
      // Test localStorage
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (!retrieved || JSON.parse(retrieved).test !== true) {
        throw new Error('localStorage test failed');
      }
    } catch (error) {
      throw new Error('Storage not available');
    }
  }

  private getStorageKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private validateData<T>(data: T): boolean {
    if (data === null || data === undefined) {
      return false;
    }

    // Check size limit
    const dataSize = JSON.stringify(data).length;
    if (dataSize > this.config.maxSize!) {
      errorHandler.handleError(new Error('Data exceeds storage size limit'), {
        type: ErrorType.STORAGE_QUOTA_EXCEEDED,
        context: { dataSize, maxSize: this.config.maxSize }
      });
      return false;
    }

    return true;
  }

  private compressData<T>(data: T): string {
    // Simple compression for now - could be enhanced with actual compression
    return JSON.stringify(data);
  }

  private decompressData<T>(compressed: string): T {
    return JSON.parse(compressed);
  }

  private generateChecksum(data: string): string {
    // Simple checksum - could be enhanced with actual hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  public async set<T>(key: string, value: T): Promise<void> {
    await this.initialize();

    if (!this.validateData(value)) {
      throw new Error('Invalid data for storage');
    }

    try {
      const storageItem: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        version: this.config.version
      };

      const compressed = this.compressData(storageItem);
      storageItem.checksum = this.generateChecksum(compressed);

      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, compressed);

      // Also store in memory for faster access
      this.memoryStorage.set(storageKey, storageItem);

    } catch (error) {
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        errorHandler.handleError(new Error('Storage quota exceeded'), {
          type: ErrorType.STORAGE_QUOTA_EXCEEDED
        });

        // Try to free up space
        await this.cleanup();

        // Retry once
        try {
          const storageKey = this.getStorageKey(key);
          localStorage.setItem(storageKey, this.compressData({ value, timestamp: Date.now(), version: this.config.version }));
        } catch (retryError) {
          throw new Error('Storage quota exceeded even after cleanup');
        }
      } else {
        errorHandler.handleError(error instanceof Error ? error : new Error('Storage write failed'), {
          type: ErrorType.STORAGE_ACCESS_DENIED
        });
        throw error;
      }
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    await this.initialize();

    try {
      const storageKey = this.getStorageKey(key);

      // Check memory first
      const memoryItem = this.memoryStorage.get(storageKey);
      if (memoryItem) {
        return memoryItem.value as T;
      }

      // Check localStorage
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        return null;
      }

      const storageItem: StorageItem<T> = this.decompressData(stored) as StorageItem<T>;

      // Validate checksum
      const expectedChecksum = this.generateChecksum(stored);
      if (storageItem.checksum !== expectedChecksum) {
        errorHandler.handleError(new Error('Data corruption detected'), {
          type: ErrorType.STORAGE_CORRUPTED,
          context: { key, expectedChecksum, actualChecksum: storageItem.checksum }
        });

        // Remove corrupted data
        localStorage.removeItem(storageKey);
        this.memoryStorage.delete(storageKey);
        return null;
      }

      // Validate version
      if (storageItem.version !== this.config.version) {
        errorHandler.logInfo('Storage version mismatch, data may be outdated', {
          key,
          expectedVersion: this.config.version,
          actualVersion: storageItem.version
        });
      }

      // Store in memory for faster future access
      this.memoryStorage.set(storageKey, storageItem);

      return storageItem.value;

    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage read failed'), {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });

      // Try fallback storage
      return this.getFromFallback<T>(key);
    }
  }

  private async getFromFallback<T>(key: string): Promise<T | null> {
    switch (this.config.fallbackStorage) {
      case 'memory':
        return this.memoryStorage.get(this.getStorageKey(key))?.value as T || null;

      case 'sessionStorage':
        try {
          const stored = sessionStorage.getItem(this.getStorageKey(key));
          return stored ? (this.decompressData(stored) as StorageItem<T>).value : null;
        } catch {
          return null;
        }

      default:
        return null;
    }
  }

  public async remove(key: string): Promise<void> {
    await this.initialize();

    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      this.memoryStorage.delete(storageKey);
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage remove failed'), {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });
    }
  }

  public async clear(): Promise<void> {
    await this.initialize();

    try {
      const keys = Object.keys(localStorage);
      const namespaceKeys = keys.filter(key => key.startsWith(this.config.namespace + ':'));

      namespaceKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      this.memoryStorage.clear();
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage clear failed'), {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });
    }
  }

  public async has(key: string): Promise<boolean> {
    await this.initialize();

    try {
      const storageKey = this.getStorageKey(key);
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }

  public async keys(): Promise<string[]> {
    await this.initialize();

    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.config.namespace + ':'))
        .map(key => key.replace(this.config.namespace + ':', ''));
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage keys failed'), {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });
      return [];
    }
  }

  public async size(): Promise<number> {
    await this.initialize();

    try {
      const keys = await this.keys();
      let totalSize = 0;

      for (const key of keys) {
        const storageKey = this.getStorageKey(key);
        const item = localStorage.getItem(storageKey);
        if (item) {
          totalSize += item.length;
        }
      }

      return totalSize;
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage size calculation failed'), {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });
      return 0;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      const keys = await this.keys();
      const items: Array<{ key: string; timestamp: number }> = [];

      // Get all items with timestamps
      for (const key of keys) {
        const item = await this.get(key);
        if (item && typeof item === 'object' && 'timestamp' in (item as Record<string, unknown>)) {
          items.push({ key, timestamp: (item as { timestamp: number }).timestamp });
        }
      }

      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest items until we're under the limit
      const currentSize = await this.size();
      const targetSize = this.config.maxSize! * 0.8; // 80% of max size

      for (const item of items) {
        if (await this.size() <= targetSize) break;
        await this.remove(item.key);
      }
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage cleanup failed'), {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });
    }
  }

  public async export(): Promise<Record<string, unknown>> {
    await this.initialize();

    try {
      const keys = await this.keys();
      const exportData: Record<string, unknown> = {};

      for (const key of keys) {
        const value = await this.get(key);
        if (value !== null) {
          exportData[key] = value;
        }
      }

      return exportData;
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage export failed'), {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });
      return {};
    }
  }

  public async import(data: Record<string, unknown>): Promise<void> {
    await this.initialize();

    try {
      for (const [key, value] of Object.entries(data)) {
        await this.set(key, value);
      }
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error('Storage import failed'), {
        type: ErrorType.STORAGE_ACCESS_DENIED
      });
      throw error;
    }
  }

  public getDebugInfo(): Record<string, unknown> {
    return {
      namespace: this.config.namespace,
      version: this.config.version,
      isInitialized: this.isInitialized,
      memoryStorageSize: this.memoryStorage.size,
      maxSize: this.config.maxSize,
      fallbackStorage: this.config.fallbackStorage
    };
  }
}

// Create default storage manager instance
export const storageManager = new StorageManager({
  namespace: 'samantha-ai',
  version: '1.0.0'
});

// Types are already exported above
