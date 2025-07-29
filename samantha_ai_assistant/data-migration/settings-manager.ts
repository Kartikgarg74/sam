import { StorageManager } from '../utils/storageManager';
import { SettingsExport, ImportResult, ValidationResult } from './types';

/**
 * Settings Manager - Handles settings export, import, and management
 */
export class SettingsManager {
  private storageManager: StorageManager;

  constructor() {
    this.storageManager = new StorageManager();
  }

  /**
   * Export settings
   */
  async exportSettings(includeSensitiveData: boolean = false): Promise<SettingsExport> {
    try {
      // 1. Load all settings
      const settings = await this.loadAllSettings();

      // 2. Filter sensitive data if needed
      const exportSettings = includeSensitiveData ? settings : this.filterSensitiveSettings(settings);

      // 3. Create export structure
      const exportData: SettingsExport = {
        version: await this.storageManager.getVersion(),
        timestamp: Date.now(),
        settings: exportSettings,
        metadata: {
          browser: this.getCurrentBrowser(),
          userAgent: navigator.userAgent,
          extensionVersion: chrome.runtime.getManifest().version,
          includeSensitiveData
        },
        checksum: await this.generateChecksum(JSON.stringify(exportSettings))
      };

      console.log(`Settings exported: ${Object.keys(exportSettings).length} categories`);

      return exportData;

    } catch (error) {
      throw new Error(`Settings export failed: ${error.message}`);
    }
  }

  /**
   * Import settings
   */
  async importSettings(settings: SettingsExport): Promise<ImportResult> {
    try {
      // 1. Validate settings
      const validation = await this.validateSettings(settings);
      if (!validation.isValid) {
        throw new Error(`Settings validation failed: ${validation.errors.join(', ')}`);
      }

      // 2. Check data integrity
      const checksum = await this.generateChecksum(JSON.stringify(settings.settings));
      if (checksum !== settings.checksum) {
        throw new Error('Settings integrity check failed - checksum mismatch');
      }

      // 3. Create backup of current settings
      const backup = await this.exportSettings(true);

      // 4. Merge with existing settings
      const mergedSettings = await this.mergeSettings(backup.settings, settings.settings);

      // 5. Save merged settings
      const importedCount = await this.saveAllSettings(mergedSettings);

      console.log(`Settings imported: ${importedCount} items`);

      return {
        success: true,
        importedCount,
        backupId: backup.timestamp.toString(),
        merged: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate settings
   */
  async validateSettings(settings: SettingsExport): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Check required fields
      if (!settings.version) errors.push('Missing version');
      if (!settings.timestamp) errors.push('Missing timestamp');
      if (!settings.settings) errors.push('Missing settings');
      if (!settings.checksum) errors.push('Missing checksum');

      // 2. Validate settings structure
      if (settings.settings) {
        const structureValidation = await this.validateSettingsStructure(settings.settings);
        errors.push(...structureValidation.errors);
        warnings.push(...structureValidation.warnings);
      }

      // 3. Check version compatibility
      const currentVersion = await this.storageManager.getVersion();
      if (!this.isVersionCompatible(settings.version, currentVersion)) {
        warnings.push(`Settings version ${settings.version} may not be fully compatible with current version ${currentVersion}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Merge settings
   */
  async mergeSettings(existing: any, newSettings: any): Promise<any> {
    const merged = { ...existing };

    // Merge each settings category
    for (const [category, categorySettings] of Object.entries(newSettings)) {
      if (category in merged) {
        // Merge existing category
        merged[category] = this.mergeCategory(merged[category], categorySettings);
      } else {
        // Add new category
        merged[category] = categorySettings;
      }
    }

    return merged;
  }

  /**
   * Load all settings
   */
  private async loadAllSettings(): Promise<any> {
    const settings: any = {};

    // Load preferences
    settings.preferences = await this.storageManager.get('preferences', {});

    // Load voice settings
    settings.voiceSettings = await this.storageManager.get('voiceSettings', {});

    // Load privacy settings
    settings.privacySettings = await this.storageManager.get('privacySettings', {});

    // Load theme settings
    settings.themeSettings = await this.storageManager.get('themeSettings', {});

    // Load custom commands
    settings.customCommands = await this.storageManager.get('customCommands', {});

    // Load keyboard shortcuts
    settings.keyboardShortcuts = await this.storageManager.get('keyboardShortcuts', {});

    // Load analytics settings
    settings.analyticsSettings = await this.storageManager.get('analyticsSettings', {});

    return settings;
  }

  /**
   * Save all settings
   */
  private async saveAllSettings(settings: any): Promise<number> {
    let count = 0;

    // Save each category
    for (const [category, categorySettings] of Object.entries(settings)) {
      await this.storageManager.set(category, categorySettings);
      count++;
    }

    return count;
  }

  /**
   * Filter sensitive settings
   */
  private filterSensitiveSettings(settings: any): any {
    const filtered = { ...settings };

    // Remove sensitive voice training data
    if (filtered.voiceSettings?.trainingData) {
      delete filtered.voiceSettings.trainingData;
    }

    // Remove sensitive analytics data
    if (filtered.analyticsSettings?.userData) {
      delete filtered.analyticsSettings.userData;
    }

    // Remove session-specific data
    if (filtered.preferences?.sessionData) {
      delete filtered.preferences.sessionData;
    }

    // Remove debug information
    if (filtered.debugSettings) {
      delete filtered.debugSettings;
    }

    return filtered;
  }

  /**
   * Validate settings structure
   */
  private async validateSettingsStructure(settings: any): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate preferences
    if (settings.preferences) {
      const prefValidation = this.validatePreferences(settings.preferences);
      errors.push(...prefValidation.errors);
      warnings.push(...prefValidation.warnings);
    }

    // Validate voice settings
    if (settings.voiceSettings) {
      const voiceValidation = this.validateVoiceSettings(settings.voiceSettings);
      errors.push(...voiceValidation.errors);
      warnings.push(...voiceValidation.warnings);
    }

    // Validate privacy settings
    if (settings.privacySettings) {
      const privacyValidation = this.validatePrivacySettings(settings.privacySettings);
      errors.push(...privacyValidation.errors);
      warnings.push(...privacyValidation.warnings);
    }

    // Validate theme settings
    if (settings.themeSettings) {
      const themeValidation = this.validateThemeSettings(settings.themeSettings);
      errors.push(...themeValidation.errors);
      warnings.push(...themeValidation.warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validate preferences
   */
  private validatePreferences(preferences: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Theme validation
    if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
      errors.push('Invalid theme value');
    }

    // Language validation
    if (preferences.language && typeof preferences.language !== 'string') {
      errors.push('Language must be a string');
    }

    // Timeout validation
    if (preferences.timeout && (typeof preferences.timeout !== 'number' || preferences.timeout < 1000)) {
      errors.push('Timeout must be a number >= 1000');
    }

    return { errors, warnings };
  }

  /**
   * Validate voice settings
   */
  private validateVoiceSettings(voiceSettings: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Sensitivity validation
    if (voiceSettings.sensitivity !== undefined) {
      if (typeof voiceSettings.sensitivity !== 'number' || voiceSettings.sensitivity < 0 || voiceSettings.sensitivity > 1) {
        errors.push('Sensitivity must be a number between 0 and 1');
      }
    }

    // Timeout validation
    if (voiceSettings.timeout !== undefined) {
      if (typeof voiceSettings.timeout !== 'number' || voiceSettings.timeout < 1000 || voiceSettings.timeout > 30000) {
        errors.push('Timeout must be a number between 1000 and 30000');
      }
    }

    // Language validation
    if (voiceSettings.language && typeof voiceSettings.language !== 'string') {
      errors.push('Language must be a string');
    }

    return { errors, warnings };
  }

  /**
   * Validate privacy settings
   */
  private validatePrivacySettings(privacySettings: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Analytics consent validation
    if (privacySettings.analyticsConsent !== undefined && typeof privacySettings.analyticsConsent !== 'boolean') {
      errors.push('Analytics consent must be a boolean');
    }

    // Analytics enabled validation
    if (privacySettings.analyticsEnabled !== undefined && typeof privacySettings.analyticsEnabled !== 'boolean') {
      errors.push('Analytics enabled must be a boolean');
    }

    // Data retention validation
    if (privacySettings.dataRetention !== undefined) {
      if (typeof privacySettings.dataRetention !== 'number' || privacySettings.dataRetention < 1 || privacySettings.dataRetention > 365) {
        errors.push('Data retention must be a number between 1 and 365');
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate theme settings
   */
  private validateThemeSettings(themeSettings: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Theme validation
    if (themeSettings.theme && !['light', 'dark', 'auto'].includes(themeSettings.theme)) {
      errors.push('Invalid theme value');
    }

    // Custom colors validation
    if (themeSettings.customColors) {
      if (typeof themeSettings.customColors !== 'object') {
        errors.push('Custom colors must be an object');
      } else {
        for (const [key, value] of Object.entries(themeSettings.customColors)) {
          if (typeof value !== 'string' || !/^#[0-9A-F]{6}$/i.test(value)) {
            errors.push(`Invalid color value for ${key}`);
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Merge category settings
   */
  private mergeCategory(existing: any, newSettings: any): any {
    if (!existing) return newSettings;
    if (!newSettings) return existing;

    // Deep merge objects
    const merged = { ...existing };

    for (const [key, value] of Object.entries(newSettings)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively merge nested objects
          merged[key] = this.mergeCategory(merged[key], value);
        } else {
          // Overwrite primitive values
          merged[key] = value;
        }
      }
    }

    return merged;
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(settingsVersion: string, currentVersion: string): boolean {
    // Simple version compatibility check
    const settingsMajor = parseInt(settingsVersion.split('.')[0]);
    const currentMajor = parseInt(currentVersion.split('.')[0]);

    return settingsMajor === currentMajor;
  }

  /**
   * Generate checksum
   */
  private async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
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
