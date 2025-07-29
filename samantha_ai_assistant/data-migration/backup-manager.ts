import { StorageManager } from '../utils/storageManager';
import { BackupData, BackupInfo, RestoreResult, ExportedBackup } from './types';

/**
 * Backup Manager - Handles data backup and restore operations
 */
export class BackupManager {
  private storageManager: StorageManager;
  private maxBackups: number = 10;

  constructor() {
    this.storageManager = new StorageManager();
  }

  /**
   * Create a new backup
   */
  async createBackup(includeSensitiveData: boolean = false): Promise<BackupData> {
    const timestamp = Date.now();
    const backupId = `backup_${timestamp}`;

    try {
      // 1. Collect all data
      const data = await this.storageManager.loadAllData();

      // 2. Filter sensitive data if needed
      const backupData = includeSensitiveData ? data : this.filterSensitiveData(data);

      // 3. Compress data
      const compressed = await this.compressData(backupData);

      // 4. Encrypt backup
      const encrypted = await this.encryptData(compressed, backupId);

      // 5. Create backup metadata
      const backup: BackupData = {
        id: backupId,
        timestamp,
        version: await this.storageManager.getVersion(),
        size: encrypted.length,
        checksum: await this.generateChecksum(encrypted),
        data: encrypted,
        metadata: {
          browser: this.getCurrentBrowser(),
          userAgent: navigator.userAgent,
          extensionVersion: chrome.runtime.getManifest().version,
          includeSensitiveData
        }
      };

      // 6. Save backup
      await this.saveBackup(backup);

      // 7. Clean up old backups
      await this.cleanupOldBackups();

      console.log(`Backup created: ${backupId} (${backup.size} bytes)`);

      return backup;

    } catch (error) {
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backup: BackupData): Promise<RestoreResult> {
    try {
      // 1. Validate backup
      const validation = await this.validateBackup(backup);
      if (!validation.isValid) {
        throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`);
      }

      // 2. Decrypt backup
      const decrypted = await this.decryptData(backup.data, backup.id);

      // 3. Decompress backup
      const decompressed = await this.decompressData(decrypted);

      // 4. Validate data structure
      const dataValidation = await this.validateData(decompressed, backup.version);
      if (!dataValidation.isValid) {
        throw new Error(`Backup data validation failed: ${dataValidation.errors.join(', ')}`);
      }

      // 5. Create restore backup
      const restoreBackup = await this.createBackup(true);

      // 6. Restore data
      await this.storageManager.saveAllData(decompressed);
      await this.storageManager.setVersion(backup.version);

      console.log(`Backup restored: ${backup.id} → ${restoreBackup.id}`);

      return {
        success: true,
        backupId: backup.id,
        restoredVersion: backup.version,
        dataSize: backup.size,
        restoreBackupId: restoreBackup.id
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        backupId: backup.id
      };
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const backups: BackupInfo[] = [];

      // Get all backup keys
      const keys = await this.storageManager.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith('backup_'));

      // Load backup metadata
      for (const key of backupKeys) {
        try {
          const backup = await this.storageManager.get(key);
          if (backup && backup.id) {
            backups.push({
              id: backup.id,
              timestamp: backup.timestamp,
              version: backup.version,
              size: backup.size,
              browser: backup.metadata?.browser || 'unknown',
              includeSensitiveData: backup.metadata?.includeSensitiveData || false
            });
          }
        } catch (error) {
          console.warn(`Failed to load backup ${key}: ${error.message}`);
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      console.error(`Failed to list backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const key = `backup_${backupId}`;
      await this.storageManager.remove(key);
      console.log(`Backup deleted: ${backupId}`);
    } catch (error) {
      throw new Error(`Failed to delete backup: ${error.message}`);
    }
  }

  /**
   * Export backup
   */
  async exportBackup(backupId: string): Promise<ExportedBackup> {
    try {
      const key = `backup_${backupId}`;
      const backup = await this.storageManager.get(key);

      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Create export file
      const exportData: ExportedBackup = {
        ...backup,
        exportTimestamp: Date.now(),
        exportVersion: '1.0.0'
      };

      return exportData;

    } catch (error) {
      throw new Error(`Failed to export backup: ${error.message}`);
    }
  }

  /**
   * Import backup from export
   */
  async importBackup(exportedBackup: ExportedBackup): Promise<RestoreResult> {
    try {
      // 1. Validate export format
      if (!exportedBackup.id || !exportedBackup.data) {
        throw new Error('Invalid export format');
      }

      // 2. Check if backup already exists
      const existingBackups = await this.listBackups();
      const existingBackup = existingBackups.find(b => b.id === exportedBackup.id);

      if (existingBackup) {
        // Create new backup with timestamp
        exportedBackup.id = `imported_${exportedBackup.id}_${Date.now()}`;
      }

      // 3. Save imported backup
      const key = `backup_${exportedBackup.id}`;
      await this.storageManager.set(key, exportedBackup);

      // 4. Restore from imported backup
      const restoreResult = await this.restoreBackup(exportedBackup);

      return {
        ...restoreResult,
        imported: true,
        originalId: exportedBackup.id
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        imported: false
      };
    }
  }

  /**
   * Filter sensitive data from backup
   */
  private filterSensitiveData(data: any): any {
    const filtered = { ...data };

    // Remove sensitive fields
    if (filtered.preferences?.voiceSettings?.trainingData) {
      delete filtered.preferences.voiceSettings.trainingData;
    }

    if (filtered.cache?.voiceTraining) {
      delete filtered.cache.voiceTraining;
    }

    if (filtered.analytics?.userData) {
      delete filtered.analytics.userData;
    }

    // Remove debug logs
    if (filtered.debugLogs) {
      delete filtered.debugLogs;
    }

    // Remove session-specific data
    if (filtered.state?.sessionData) {
      delete filtered.state.sessionData;
    }

    return filtered;
  }

  /**
   * Validate backup
   */
  private async validateBackup(backup: BackupData): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!backup.id) errors.push('Missing backup ID');
    if (!backup.timestamp) errors.push('Missing timestamp');
    if (!backup.version) errors.push('Missing version');
    if (!backup.data) errors.push('Missing backup data');
    if (!backup.checksum) errors.push('Missing checksum');

    // Check data integrity
    if (backup.data && backup.checksum) {
      const calculatedChecksum = await this.generateChecksum(backup.data);
      if (calculatedChecksum !== backup.checksum) {
        errors.push('Checksum mismatch');
      }
    }

    // Check version compatibility
    const currentVersion = await this.storageManager.getVersion();
    if (!this.isVersionCompatible(backup.version, currentVersion)) {
      errors.push(`Backup version ${backup.version} is not compatible with current version ${currentVersion}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate data structure
   */
  private async validateData(data: any, version: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic structure validation
    if (!data || typeof data !== 'object') {
      errors.push('Invalid data structure');
      return { isValid: false, errors };
    }

    // Check required top-level fields
    const requiredFields = ['preferences', 'cache', 'state'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Version-specific validation
    const schema = await this.getSchema(version);
    if (schema) {
      const schemaValidation = await this.validateAgainstSchema(data, schema);
      errors.push(...schemaValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate against schema
   */
  private async validateAgainstSchema(data: any, schema: any): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    for (const [field, fieldSchema] of Object.entries(schema)) {
      if (!(field in data)) {
        if (fieldSchema.required !== false) {
          errors.push(`Missing required field: ${field}`);
        }
        continue;
      }

      const fieldValidation = this.validateField(data[field], fieldSchema);
      errors.push(...fieldValidation.errors.map(err => `${field}.${err}`));
    }

    return { errors };
  }

  /**
   * Validate individual field
   */
  private validateField(value: any, schema: any): { errors: string[] } {
    const errors: string[] = [];

    // Type validation
    if (schema.type && typeof value !== schema.type) {
      errors.push(`Expected ${schema.type}, got ${typeof value}`);
    }

    // Required validation
    if (schema.required && (value === undefined || value === null)) {
      errors.push('Field is required');
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
    }

    // Range validation
    if (schema.min !== undefined && value < schema.min) {
      errors.push(`Value must be >= ${schema.min}`);
    }
    if (schema.max !== undefined && value > schema.max) {
      errors.push(`Value must be <= ${schema.max}`);
    }

    return { errors };
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(backupVersion: string, currentVersion: string): boolean {
    // Simple version compatibility check
    // In production, implement more sophisticated version compatibility logic
    const backupMajor = parseInt(backupVersion.split('.')[0]);
    const currentMajor = parseInt(currentVersion.split('.')[0]);

    return backupMajor === currentMajor;
  }

  /**
   * Get schema for version
   */
  private async getSchema(version: string): Promise<any> {
    const schemas = {
      '1.0.0': require('./schemas/v1.0.0').default,
      '1.1.0': require('./schemas/v1.1.0').default,
      '1.2.0': require('./schemas/v1.2.0').default,
      '1.3.0': require('./schemas/v1.3.0').default,
      '2.0.0': require('./schemas/v2.0.0').default
    };

    return schemas[version] || null;
  }

  /**
   * Save backup
   */
  private async saveBackup(backup: BackupData): Promise<void> {
    const key = `backup_${backup.id}`;
    await this.storageManager.set(key, backup);
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();

    if (backups.length > this.maxBackups) {
      const backupsToDelete = backups.slice(this.maxBackups);

      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.id);
      }

      console.log(`Cleaned up ${backupsToDelete.length} old backups`);
    }
  }

  /**
   * Compress data
   */
  private async compressData(data: any): Promise<Uint8Array> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);

    // Simple compression - in production, use a proper compression library
    return dataBuffer;
  }

  /**
   * Decompress data
   */
  private async decompressData(data: Uint8Array): Promise<any> {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(data);

    return JSON.parse(jsonString);
  }

  /**
   * Encrypt data
   */
  private async encryptData(data: Uint8Array, key: string): Promise<Uint8Array> {
    // Simple encryption - in production, use proper encryption
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key);

    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ keyBuffer[i % keyBuffer.length];
    }

    return encrypted;
  }

  /**
   * Decrypt data
   */
  private async decryptData(data: Uint8Array, key: string): Promise<Uint8Array> {
    // Simple decryption - in production, use proper decryption
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key);

    const decrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      decrypted[i] = data[i] ^ keyBuffer[i % keyBuffer.length];
    }

    return decrypted;
  }

  /**
   * Generate checksum
   */
  private async generateChecksum(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current browser
   */
  private getCurrentBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';

    return 'unknown';
  }
}
