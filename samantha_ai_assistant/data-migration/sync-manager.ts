import { StorageManager } from '../utils/storageManager';
import { ValidationResult, SyncResult, ExportedData, ImportResult, CompatibilityResult } from './types';

/**
 * Cross-Browser Sync Manager - Handles data synchronization between browsers
 */
export class SyncManager {
  private storageManager: StorageManager;
  private supportedBrowsers: Browser[] = ['chrome', 'firefox', 'safari', 'edge'];

  constructor() {
    this.storageManager = new StorageManager();
  }

  /**
   * Sync data between browsers
   */
  async syncData(sourceBrowser: Browser, targetBrowser: Browser): Promise<SyncResult> {
    console.log(`Starting sync from ${sourceBrowser} to ${targetBrowser}`);

    try {
      // 1. Validate browser compatibility
      const compatibility = await this.validateSyncCompatibility(sourceBrowser, targetBrowser);
      if (!compatibility.compatible) {
        throw new Error(`Browsers not compatible: ${compatibility.reasons.join(', ')}`);
      }

      // 2. Export data from source browser
      const sourceData = await this.exportData(sourceBrowser);
      console.log(`Exported data from ${sourceBrowser}: ${sourceData.size} bytes`);

      // 3. Transform data for target browser
      const transformedData = await this.transformData(sourceData, sourceBrowser, targetBrowser);
      console.log(`Transformed data for ${targetBrowser}`);

      // 4. Import data to target browser
      const importResult = await this.importData(transformedData, targetBrowser);
      console.log(`Imported data to ${targetBrowser}: ${importResult.importedCount} items`);

      return {
        success: true,
        sourceBrowser,
        targetBrowser,
        dataSize: sourceData.size,
        importedItems: importResult.importedCount,
        transformedItems: transformedData.items.length
      };

    } catch (error) {
      console.error(`Sync failed: ${error.message}`);

      return {
        success: false,
        error: error.message,
        sourceBrowser,
        targetBrowser
      };
    }
  }

  /**
   * Export data from a specific browser
   */
  async exportData(browser: Browser): Promise<ExportedData> {
    try {
      // 1. Load all data from storage
      const data = await this.storageManager.loadAllData();

      // 2. Get browser-specific metadata
      const metadata = await this.getBrowserMetadata(browser);

      // 3. Create export structure
      const exportData: ExportedData = {
        version: await this.storageManager.getVersion(),
        browser,
        timestamp: Date.now(),
        data,
        metadata,
        checksum: await this.generateChecksum(JSON.stringify(data))
      };

      // 4. Compress export data
      const compressed = await this.compressData(exportData);

      return {
        ...exportData,
        compressed,
        size: compressed.length
      };

    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Import data to a specific browser
   */
  async importData(data: ExportedData, browser: Browser): Promise<ImportResult> {
    try {
      // 1. Validate export data
      const validation = await this.validateExportData(data);
      if (!validation.isValid) {
        throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
      }

      // 2. Check data integrity
      const checksum = await this.generateChecksum(JSON.stringify(data.data));
      if (checksum !== data.checksum) {
        throw new Error('Data integrity check failed - checksum mismatch');
      }

      // 3. Transform data for target browser
      const transformedData = await this.transformData(data, data.browser, browser);

      // 4. Validate transformed data
      const transformedValidation = await this.validateData(transformedData, browser);
      if (!transformedValidation.isValid) {
        throw new Error(`Transformed data validation failed: ${transformedValidation.errors.join(', ')}`);
      }

      // 5. Backup existing data
      const backup = await this.createBackup(browser);
      console.log(`Backup created: ${backup.id}`);

      // 6. Import data
      const importedCount = await this.storageManager.saveAllData(transformedData);
      await this.storageManager.setVersion(data.version);

      // 7. Update browser metadata
      await this.updateBrowserMetadata(browser, data.metadata);

      return {
        success: true,
        importedCount,
        backupId: backup.id,
        version: data.version
      };

    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Validate sync compatibility between browsers
   */
  async validateSyncCompatibility(browser1: Browser, browser2: Browser): Promise<CompatibilityResult> {
    const reasons: string[] = [];

    // Check if browsers are supported
    if (!this.supportedBrowsers.includes(browser1)) {
      reasons.push(`${browser1} is not a supported browser`);
    }
    if (!this.supportedBrowsers.includes(browser2)) {
      reasons.push(`${browser2} is not a supported browser`);
    }

    // Check browser-specific compatibility
    const compatibility = this.getBrowserCompatibility(browser1, browser2);
    if (!compatibility.compatible) {
      reasons.push(...compatibility.reasons);
    }

    // Check data structure compatibility
    const dataCompatibility = await this.checkDataStructureCompatibility(browser1, browser2);
    if (!dataCompatibility.compatible) {
      reasons.push(...dataCompatibility.reasons);
    }

    return {
      compatible: reasons.length === 0,
      reasons
    };
  }

  /**
   * Transform data between browsers
   */
  async transformData(data: ExportedData, sourceBrowser: Browser, targetBrowser: Browser): Promise<ExportedData> {
    let transformedData = { ...data.data };

    // Apply browser-specific transformations
    const transformations = this.getBrowserTransformations(sourceBrowser, targetBrowser);

    for (const transformation of transformations) {
      transformedData = await transformation.apply(transformedData);
    }

    // Update metadata for target browser
    const targetMetadata = await this.getBrowserMetadata(targetBrowser);

    return {
      ...data,
      browser: targetBrowser,
      data: transformedData,
      metadata: targetMetadata,
      checksum: await this.generateChecksum(JSON.stringify(transformedData))
    };
  }

  /**
   * Get browser metadata
   */
  private async getBrowserMetadata(browser: Browser): Promise<BrowserMetadata> {
    return {
      browser,
      userAgent: navigator.userAgent,
      extensionVersion: chrome.runtime.getManifest().version,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Update browser metadata
   */
  private async updateBrowserMetadata(browser: Browser, metadata: BrowserMetadata): Promise<void> {
    await this.storageManager.set('browserMetadata', {
      ...metadata,
      lastSync: Date.now()
    });
  }

  /**
   * Validate export data
   */
  private async validateExportData(data: ExportedData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!data.version) errors.push('Missing version');
    if (!data.browser) errors.push('Missing browser');
    if (!data.timestamp) errors.push('Missing timestamp');
    if (!data.data) errors.push('Missing data');
    if (!data.checksum) errors.push('Missing checksum');

    // Check data structure
    if (data.data) {
      const dataValidation = await this.validateData(data.data, data.browser);
      errors.push(...dataValidation.errors);
      warnings.push(...dataValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate data for specific browser
   */
  private async validateData(data: any, browser: Browser): Promise<ValidationResult> {
    const schema = await this.getBrowserSchema(browser);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate against browser-specific schema
    for (const [field, fieldSchema] of Object.entries(schema)) {
      if (!(field in data)) {
        if (fieldSchema.required !== false) {
          errors.push(`Missing required field: ${field}`);
        }
        continue;
      }

      const fieldValidation = this.validateField(data[field], fieldSchema);
      errors.push(...fieldValidation.errors.map(err => `${field}.${err}`));
      warnings.push(...fieldValidation.warnings.map(warn => `${field}.${warn}`));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get browser compatibility rules
   */
  private getBrowserCompatibility(browser1: Browser, browser2: Browser): CompatibilityResult {
    const compatibilityMatrix = {
      chrome: ['edge', 'firefox'],
      edge: ['chrome', 'firefox'],
      firefox: ['chrome', 'edge'],
      safari: ['chrome', 'edge'] // Safari has limited compatibility
    };

    const compatibleBrowsers = compatibilityMatrix[browser1] || [];

    if (browser1 === browser2) {
      return { compatible: false, reasons: ['Cannot sync to same browser'] };
    }

    if (!compatibleBrowsers.includes(browser2)) {
      return {
        compatible: false,
        reasons: [`${browser1} is not compatible with ${browser2}`]
      };
    }

    return { compatible: true, reasons: [] };
  }

  /**
   * Check data structure compatibility
   */
  private async checkDataStructureCompatibility(browser1: Browser, browser2: Browser): Promise<CompatibilityResult> {
    const reasons: string[] = [];

    // Check if both browsers support the same data structures
    const schema1 = await this.getBrowserSchema(browser1);
    const schema2 = await this.getBrowserSchema(browser2);

    // Compare required fields
    for (const [field, fieldSchema] of Object.entries(schema1)) {
      if (fieldSchema.required && !(field in schema2)) {
        reasons.push(`Required field '${field}' not supported in ${browser2}`);
      }
    }

    return {
      compatible: reasons.length === 0,
      reasons
    };
  }

  /**
   * Get browser-specific transformations
   */
  private getBrowserTransformations(sourceBrowser: Browser, targetBrowser: Browser): DataTransformation[] {
    const transformations: DataTransformation[] = [];

    // Chrome to Firefox transformations
    if (sourceBrowser === 'chrome' && targetBrowser === 'firefox') {
      transformations.push(
        this.chromeToFirefoxTransformation(),
        this.standardizeStorageTransformation()
      );
    }

    // Firefox to Chrome transformations
    if (sourceBrowser === 'firefox' && targetBrowser === 'chrome') {
      transformations.push(
        this.firefoxToChromeTransformation(),
        this.standardizeStorageTransformation()
      );
    }

    // Safari transformations
    if (sourceBrowser === 'safari' || targetBrowser === 'safari') {
      transformations.push(this.safariTransformation(sourceBrowser, targetBrowser));
    }

    // Edge transformations
    if (sourceBrowser === 'edge' || targetBrowser === 'edge') {
      transformations.push(this.edgeTransformation(sourceBrowser, targetBrowser));
    }

    return transformations;
  }

  /**
   * Chrome to Firefox transformation
   */
  private chromeToFirefoxTransformation(): DataTransformation {
    return {
      name: 'chrome-to-firefox',
      apply: async (data: any) => {
        const transformed = { ...data };

        // Transform storage structure
        if (transformed.storage) {
          transformed.storage = {
            local: transformed.storage,
            sync: transformed.storage,
            managed: {}
          };
        }

        // Transform API calls
        if (transformed.apiCalls) {
          transformed.apiCalls = transformed.apiCalls.map((call: any) => ({
            ...call,
            browser: 'firefox'
          }));
        }

        return transformed;
      }
    };
  }

  /**
   * Firefox to Chrome transformation
   */
  private firefoxToChromeTransformation(): DataTransformation {
    return {
      name: 'firefox-to-chrome',
      apply: async (data: any) => {
        const transformed = { ...data };

        // Transform storage structure
        if (transformed.storage?.local) {
          transformed.storage = transformed.storage.local;
        }

        // Transform API calls
        if (transformed.apiCalls) {
          transformed.apiCalls = transformed.apiCalls.map((call: any) => ({
            ...call,
            browser: 'chrome'
          }));
        }

        return transformed;
      }
    };
  }

  /**
   * Safari transformation
   */
  private safariTransformation(sourceBrowser: Browser, targetBrowser: Browser): DataTransformation {
    return {
      name: 'safari-transformation',
      apply: async (data: any) => {
        const transformed = { ...data };

        // Safari-specific transformations
        if (sourceBrowser === 'safari') {
          // Transform from Safari format
          if (transformed.webkitStorage) {
            transformed.storage = transformed.webkitStorage.local;
            delete transformed.webkitStorage;
          }
        } else if (targetBrowser === 'safari') {
          // Transform to Safari format
          transformed.webkitStorage = {
            local: transformed.storage,
            session: {}
          };
          delete transformed.storage;
        }

        return transformed;
      }
    };
  }

  /**
   * Edge transformation
   */
  private edgeTransformation(sourceBrowser: Browser, targetBrowser: Browser): DataTransformation {
    return {
      name: 'edge-transformation',
      apply: async (data: any) => {
        const transformed = { ...data };

        // Edge is mostly compatible with Chrome, but may need minor adjustments
        if (transformed.apiCalls) {
          transformed.apiCalls = transformed.apiCalls.map((call: any) => ({
            ...call,
            browser: targetBrowser
          }));
        }

        return transformed;
      }
    };
  }

  /**
   * Standardize storage transformation
   */
  private standardizeStorageTransformation(): DataTransformation {
    return {
      name: 'standardize-storage',
      apply: async (data: any) => {
        const transformed = { ...data };

        // Ensure consistent storage structure
        if (!transformed.storage) {
          transformed.storage = {
            preferences: transformed.preferences || {},
            cache: transformed.cache || {},
            state: transformed.state || {},
            localStorage: transformed.localStorage || {}
          };
        }

        return transformed;
      }
    };
  }

  /**
   * Validate individual field
   */
  private validateField(value: any, schema: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

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

    return { errors, warnings };
  }

  /**
   * Get browser-specific schema
   */
  private async getBrowserSchema(browser: Browser): Promise<any> {
    const schemas = {
      chrome: require('./schemas/chrome').default,
      firefox: require('./schemas/firefox').default,
      safari: require('./schemas/safari').default,
      edge: require('./schemas/edge').default
    };

    return schemas[browser] || schemas.chrome;
  }

  /**
   * Generate checksum for data
   */
  private async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
   * Create backup
   */
  private async createBackup(browser: Browser): Promise<{ id: string }> {
    const backupId = `backup_${browser}_${Date.now()}`;
    const data = await this.storageManager.loadAllData();

    await this.storageManager.set(`backup_${backupId}`, {
      id: backupId,
      browser,
      timestamp: Date.now(),
      data
    });

    return { id: backupId };
  }
}

/**
 * Type definitions
 */
export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge';

export interface BrowserMetadata {
  browser: Browser;
  userAgent: string;
  extensionVersion: string;
  platform: string;
  language: string;
  timezone: string;
}

export interface DataTransformation {
  name: string;
  apply(data: any): Promise<any>;
}
