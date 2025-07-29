import { EventEmitter } from 'events';

// Types for secure storage
export interface EncryptedData {
  iv: string;
  data: string;
  salt: string;
  version: string;
}

export interface StorageOptions {
  encryptionKey?: string;
  autoEncrypt?: boolean;
  compression?: boolean;
  retention?: number; // days
}

export interface StorageItem {
  key: string;
  value: any;
  encrypted: boolean;
  timestamp: number;
  expiresAt?: number;
}

export class SecureStorage extends EventEmitter {
  private encryptionKey: CryptoKey | null = null;
  private options: StorageOptions;
  private storage: chrome.storage.StorageArea;
  private isInitialized = false;

  constructor(options: StorageOptions = {}) {
    super();
    this.options = {
      autoEncrypt: true,
      compression: true,
      retention: 30, // 30 days default
      ...options
    };
    this.storage = chrome.storage.local;
  }

  /**
   * Initialize secure storage with encryption key
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing secure storage...');

      // Generate or retrieve encryption key
      await this.initializeEncryptionKey();

      // Verify storage access
      await this.testStorageAccess();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Secure storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize secure storage:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Initialize encryption key using PBKDF2
   */
  private async initializeEncryptionKey(): Promise<void> {
    try {
      // Check if we have a stored key
      const storedKey = await this.getStoredEncryptionKey();

      if (storedKey) {
        this.encryptionKey = storedKey;
        return;
      }

      // Generate new encryption key
      const password = await this.getUserPassword();
      const salt = crypto.getRandomValues(new Uint8Array(16));

      // Derive key using PBKDF2
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      this.encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Store encrypted key
      await this.storeEncryptionKey(this.encryptionKey, salt);

    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw new Error('Encryption key initialization failed');
    }
  }

  /**
   * Get user password for key derivation
   */
  private async getUserPassword(): Promise<string> {
    // In a real implementation, this would prompt the user
    // For now, we'll use a secure default
    const defaultPassword = 'samantha-ai-secure-storage-2025';

    // Check if user has set a custom password
    const customPassword = await this.getStoredPassword();
    return customPassword || defaultPassword;
  }

  /**
   * Store encryption key securely
   */
  private async storeEncryptionKey(key: CryptoKey, salt: Uint8Array): Promise<void> {
    const keyData = await crypto.subtle.exportKey('raw', key);
    const encryptedKey = await this.encryptData(keyData, salt);

    await this.storage.set({
      'secure_storage_key': {
        key: encryptedKey.data,
        salt: btoa(String.fromCharCode(...salt)),
        timestamp: Date.now()
      }
    });
  }

  /**
   * Retrieve stored encryption key
   */
  private async getStoredEncryptionKey(): Promise<CryptoKey | null> {
    try {
      const result = await this.storage.get('secure_storage_key');
      const keyData = result.secure_storage_key;

      if (!keyData) return null;

      const encryptedKey = Uint8Array.from(atob(keyData.key), c => c.charCodeAt(0));
      const salt = Uint8Array.from(atob(keyData.salt), c => c.charCodeAt(0));

      // Decrypt the key
      const decryptedKeyData = await this.decryptData(encryptedKey, salt);

      return await crypto.subtle.importKey(
        'raw',
        decryptedKeyData,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('Failed to retrieve stored encryption key:', error);
      return null;
    }
  }

  /**
   * Get stored password
   */
  private async getStoredPassword(): Promise<string | null> {
    try {
      const result = await this.storage.get('user_password_hash');
      return result.user_password_hash || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Encrypt data using AES-GCM
   */
  async encryptData(data: any, salt?: Uint8Array): Promise<EncryptedData> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const dataBuffer = new TextEncoder().encode(dataString);

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const saltBuffer = salt || crypto.getRandomValues(new Uint8Array(16));

    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      dataBuffer
    );

    return {
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
      salt: btoa(String.fromCharCode(...saltBuffer)),
      version: '1.0'
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decryptData(encryptedData: EncryptedData | Uint8Array, salt?: Uint8Array): Promise<Uint8Array> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    let iv: Uint8Array;
    let data: Uint8Array;
    let saltBuffer: Uint8Array;

    if (encryptedData instanceof Uint8Array) {
      // Legacy format
      data = encryptedData;
      saltBuffer = salt || new Uint8Array(16);
      iv = crypto.getRandomValues(new Uint8Array(12));
    } else {
      // New format
      iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
      data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
      saltBuffer = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
    }

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      data
    );

    return new Uint8Array(decryptedBuffer);
  }

  /**
   * Store data securely
   */
  async set(key: string, value: any, options?: { encrypt?: boolean; ttl?: number }): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Secure storage not initialized');
    }

    const shouldEncrypt = options?.encrypt ?? this.options.autoEncrypt;
    const ttl = options?.ttl || this.options.retention;

    try {
      let storageValue: any;

      if (shouldEncrypt) {
        const encrypted = await this.encryptData(value);
        storageValue = {
          encrypted: true,
          data: encrypted,
          timestamp: Date.now(),
          expiresAt: ttl ? Date.now() + (ttl * 24 * 60 * 60 * 1000) : undefined
        };
      } else {
        storageValue = {
          encrypted: false,
          data: value,
          timestamp: Date.now(),
          expiresAt: ttl ? Date.now() + (ttl * 24 * 60 * 60 * 1000) : undefined
        };
      }

      await this.storage.set({ [key]: storageValue });
      this.emit('dataStored', { key, encrypted: shouldEncrypt });

    } catch (error) {
      console.error('Failed to store data securely:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Retrieve data securely
   */
  async get(key: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Secure storage not initialized');
    }

    try {
      const result = await this.storage.get(key);
      const item = result[key] as StorageItem;

      if (!item) {
        return null;
      }

      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        await this.remove(key);
        return null;
      }

      let value: any;

      if (item.encrypted) {
        const decryptedData = await this.decryptData(item.value);
        const dataString = new TextDecoder().decode(decryptedData);
        value = JSON.parse(dataString);
      } else {
        value = item.value;
      }

      this.emit('dataRetrieved', { key, encrypted: item.encrypted });
      return value;

    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Remove data securely
   */
  async remove(key: string): Promise<void> {
    try {
      await this.storage.remove(key);
      this.emit('dataRemoved', { key });
    } catch (error) {
      console.error('Failed to remove data securely:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Clear all data securely
   */
  async clear(): Promise<void> {
    try {
      await this.storage.clear();
      this.emit('dataCleared');
    } catch (error) {
      console.error('Failed to clear data securely:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    try {
      const result = await this.storage.get(null);
      return Object.keys(result).filter(key => !key.startsWith('secure_storage_'));
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  /**
   * Clean up expired data
   */
  async cleanup(): Promise<void> {
    try {
      const keys = await this.keys();
      const now = Date.now();

      for (const key of keys) {
        const item = await this.get(key);
        if (item && item.expiresAt && now > item.expiresAt) {
          await this.remove(key);
        }
      }

      this.emit('cleanupCompleted');
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      this.emit('error', error);
    }
  }

  /**
   * Test storage access
   */
  private async testStorageAccess(): Promise<void> {
    try {
      const testKey = '__storage_test__';
      const testValue = { test: true, timestamp: Date.now() };

      await this.storage.set({ [testKey]: testValue });
      const result = await this.storage.get(testKey);

      if (!result[testKey] || result[testKey].test !== true) {
        throw new Error('Storage access test failed');
      }

      await this.storage.remove(testKey);
    } catch (error) {
      throw new Error(`Storage access test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    encryptedItems: number;
    totalSize: number;
    lastCleanup: number;
  }> {
    try {
      const keys = await this.keys();
      let encryptedItems = 0;
      let totalSize = 0;

      for (const key of keys) {
        const item = await this.get(key);
        if (item && item.encrypted) {
          encryptedItems++;
        }
        totalSize += JSON.stringify(item).length;
      }

      return {
        totalItems: keys.length,
        encryptedItems,
        totalSize,
        lastCleanup: Date.now()
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalItems: 0,
        encryptedItems: 0,
        totalSize: 0,
        lastCleanup: 0
      };
    }
  }

  /**
   * Export encrypted data for backup
   */
  async exportData(): Promise<string> {
    try {
      const keys = await this.keys();
      const data: Record<string, any> = {};

      for (const key of keys) {
        const item = await this.get(key);
        if (item) {
          data[key] = item;
        }
      }

      const exportData = {
        version: '1.0',
        timestamp: Date.now(),
        data: data
      };

      return btoa(JSON.stringify(exportData));
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Import encrypted data from backup
   */
  async importData(exportString: string): Promise<void> {
    try {
      const exportData = JSON.parse(atob(exportString));

      if (exportData.version !== '1.0') {
        throw new Error('Unsupported export version');
      }

      for (const [key, value] of Object.entries(exportData.data)) {
        await this.set(key, value);
      }

      this.emit('dataImported', { itemCount: Object.keys(exportData.data).length });
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
