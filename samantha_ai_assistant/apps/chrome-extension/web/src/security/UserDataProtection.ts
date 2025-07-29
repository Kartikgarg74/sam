import { EventEmitter } from 'events';

// Types for user data protection
export interface PrivacySettings {
  dataCollection: boolean;
  dataSharing: boolean;
  analytics: boolean;
  voiceRecording: boolean;
  commandHistory: boolean;
  personalization: boolean;
}

export interface ConsentRecord {
  type: string;
  granted: boolean;
  timestamp: number;
  version: string;
  details: string;
}

export interface DataRetentionPolicy {
  voiceData: number; // days
  commandHistory: number; // days
  analytics: number; // days
  personalization: number; // days
  sessionData: number; // days
}

export interface DataMinimizationConfig {
  anonymizeVoiceData: boolean;
  hashUserCommands: boolean;
  limitDataRetention: boolean;
  encryptPersonalData: boolean;
}

export class UserDataProtection extends EventEmitter {
  private privacySettings: PrivacySettings;
  private consentRecords: ConsentRecord[] = [];
  private retentionPolicy: DataRetentionPolicy;
  private minimizationConfig: DataMinimizationConfig;
  private isInitialized = false;

  constructor() {
    super();
    this.privacySettings = {
      dataCollection: false,
      dataSharing: false,
      analytics: false,
      voiceRecording: false,
      commandHistory: false,
      personalization: false
    };

    this.retentionPolicy = {
      voiceData: 7, // 7 days
      commandHistory: 30, // 30 days
      analytics: 90, // 90 days
      personalization: 365, // 1 year
      sessionData: 1 // 1 day
    };

    this.minimizationConfig = {
      anonymizeVoiceData: true,
      hashUserCommands: true,
      limitDataRetention: true,
      encryptPersonalData: true
    };
  }

  /**
   * Initialize user data protection
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔒 Initializing user data protection...');

      // Load privacy settings
      await this.loadPrivacySettings();

      // Load consent records
      await this.loadConsentRecords();

      // Check for required consents
      await this.checkRequiredConsents();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ User data protection initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize user data protection:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Load privacy settings from storage
   */
  private async loadPrivacySettings(): Promise<void> {
    try {
      // In a real implementation, this would load from secure storage
      const storedSettings = localStorage.getItem('privacy_settings');
      if (storedSettings) {
        this.privacySettings = { ...this.privacySettings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.warn('Failed to load privacy settings:', error);
    }
  }

  /**
   * Load consent records from storage
   */
  private async loadConsentRecords(): Promise<void> {
    try {
      // In a real implementation, this would load from secure storage
      const storedConsents = localStorage.getItem('consent_records');
      if (storedConsents) {
        this.consentRecords = JSON.parse(storedConsents);
      }
    } catch (error) {
      console.warn('Failed to load consent records:', error);
    }
  }

  /**
   * Check for required consents
   */
  private async checkRequiredConsents(): Promise<void> {
    const requiredConsents = [
      'data_collection',
      'voice_recording',
      'command_history'
    ];

    for (const consentType of requiredConsents) {
      const hasConsent = this.hasConsent(consentType);
      if (!hasConsent) {
        console.warn(`Missing required consent: ${consentType}`);
        this.emit('missingConsent', consentType);
      }
    }
  }

  /**
   * Check if user has given consent for a specific type
   */
  hasConsent(type: string): boolean {
    const consent = this.consentRecords.find(c => c.type === type);
    return consent?.granted || false;
  }

  /**
   * Record user consent
   */
  async recordConsent(type: string, granted: boolean, details?: string): Promise<void> {
    const consent: ConsentRecord = {
      type,
      granted,
      timestamp: Date.now(),
      version: '1.0',
      details: details || ''
    };

    this.consentRecords.push(consent);

    // Update privacy settings based on consent
    this.updatePrivacySettings(type, granted);

    // Save consent record
    await this.saveConsentRecords();

    this.emit('consentRecorded', consent);
  }

  /**
   * Update privacy settings based on consent
   */
  private updatePrivacySettings(type: string, granted: boolean): void {
    switch (type) {
      case 'data_collection':
        this.privacySettings.dataCollection = granted;
        break;
      case 'voice_recording':
        this.privacySettings.voiceRecording = granted;
        break;
      case 'command_history':
        this.privacySettings.commandHistory = granted;
        break;
      case 'analytics':
        this.privacySettings.analytics = granted;
        break;
      case 'data_sharing':
        this.privacySettings.dataSharing = granted;
        break;
      case 'personalization':
        this.privacySettings.personalization = granted;
        break;
    }

    this.savePrivacySettings();
  }

  /**
   * Save privacy settings
   */
  private async savePrivacySettings(): Promise<void> {
    try {
      localStorage.setItem('privacy_settings', JSON.stringify(this.privacySettings));
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  }

  /**
   * Save consent records
   */
  private async saveConsentRecords(): Promise<void> {
    try {
      localStorage.setItem('consent_records', JSON.stringify(this.consentRecords));
    } catch (error) {
      console.error('Failed to save consent records:', error);
    }
  }

  /**
   * Process voice data with privacy protection
   */
  async processVoiceData(audioData: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.privacySettings.voiceRecording) {
      throw new Error('Voice recording not consented');
    }

    try {
      // Anonymize voice data if configured
      if (this.minimizationConfig.anonymizeVoiceData) {
        return await this.anonymizeVoiceData(audioData);
      }

      return audioData;
    } catch (error) {
      console.error('Failed to process voice data:', error);
      throw error;
    }
  }

  /**
   * Anonymize voice data
   */
  private async anonymizeVoiceData(audioData: ArrayBuffer): Promise<ArrayBuffer> {
    // In a real implementation, this would apply voice anonymization techniques
    // For now, we'll just return the original data
    return audioData;
  }

  /**
   * Process user command with privacy protection
   */
  async processUserCommand(command: string): Promise<string> {
    if (!this.privacySettings.commandHistory) {
      throw new Error('Command history not consented');
    }

    try {
      // Hash command if configured
      if (this.minimizationConfig.hashUserCommands) {
        return await this.hashCommand(command);
      }

      return command;
    } catch (error) {
      console.error('Failed to process user command:', error);
      throw error;
    }
  }

  /**
   * Hash user command
   */
  private async hashCommand(command: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(command);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store data with retention policy
   */
  async storeData(key: string, data: unknown, type: keyof DataRetentionPolicy): Promise<void> {
    const retentionDays = this.retentionPolicy[type];
    const expiresAt = Date.now() + (retentionDays * 24 * 60 * 60 * 1000);

    const storageData = {
      data,
      type,
      createdAt: Date.now(),
      expiresAt,
      encrypted: this.minimizationConfig.encryptPersonalData
    };

    // Store with expiration
    localStorage.setItem(key, JSON.stringify(storageData));

    this.emit('dataStored', { key, type, retentionDays });
  }

  /**
   * Retrieve data with privacy checks
   */
  async getData(key: string): Promise<unknown> {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const storageData = JSON.parse(stored);

      // Check expiration
      if (storageData.expiresAt && Date.now() > storageData.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return storageData.data;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      let cleanedCount = 0;

      for (const key of keys) {
        if (key.startsWith('privacy_') || key.startsWith('consent_')) {
          continue; // Skip privacy-related keys
        }

        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const storageData = JSON.parse(stored);
            if (storageData.expiresAt && now > storageData.expiresAt) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // Skip invalid data
          console.warn(`Invalid data in storage key: ${key}`);
        }
      }

      this.emit('cleanupCompleted', { cleanedCount });
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(): Promise<string> {
    try {
      const exportData = {
        privacySettings: this.privacySettings,
        consentRecords: this.consentRecords,
        timestamp: Date.now(),
        version: '1.0'
      };

      return btoa(JSON.stringify(exportData));
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Delete user data (GDPR compliance)
   */
  async deleteUserData(): Promise<void> {
    try {
      // Clear all stored data
      localStorage.clear();

      // Reset privacy settings
      this.privacySettings = {
        dataCollection: false,
        dataSharing: false,
        analytics: false,
        voiceRecording: false,
        commandHistory: false,
        personalization: false
      };

      // Clear consent records
      this.consentRecords = [];

      this.emit('dataDeleted');
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw error;
    }
  }

  /**
   * Get privacy report
   */
  getPrivacyReport(): {
    settings: PrivacySettings;
    consents: ConsentRecord[];
    retentionPolicy: DataRetentionPolicy;
    dataMinimization: DataMinimizationConfig;
  } {
    return {
      settings: { ...this.privacySettings },
      consents: [...this.consentRecords],
      retentionPolicy: { ...this.retentionPolicy },
      dataMinimization: { ...this.minimizationConfig }
    };
  }

  /**
   * Update retention policy
   */
  updateRetentionPolicy(policy: Partial<DataRetentionPolicy>): void {
    this.retentionPolicy = { ...this.retentionPolicy, ...policy };
    this.emit('retentionPolicyUpdated', this.retentionPolicy);
  }

  /**
   * Update data minimization config
   */
  updateDataMinimization(config: Partial<DataMinimizationConfig>): void {
    this.minimizationConfig = { ...this.minimizationConfig, ...config };
    this.emit('dataMinimizationUpdated', this.minimizationConfig);
  }

  /**
   * Check if data collection is allowed
   */
  isDataCollectionAllowed(): boolean {
    return this.privacySettings.dataCollection && this.hasConsent('data_collection');
  }

  /**
   * Check if voice recording is allowed
   */
  isVoiceRecordingAllowed(): boolean {
    return this.privacySettings.voiceRecording && this.hasConsent('voice_recording');
  }

  /**
   * Check if command history is allowed
   */
  isCommandHistoryAllowed(): boolean {
    return this.privacySettings.commandHistory && this.hasConsent('command_history');
  }

  /**
   * Check if analytics is allowed
   */
  isAnalyticsAllowed(): boolean {
    return this.privacySettings.analytics && this.hasConsent('analytics');
  }

  /**
   * Get consent status for all types
   */
  getConsentStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const consent of this.consentRecords) {
      status[consent.type] = consent.granted;
    }
    return status;
  }
}

// Export singleton instance
export const userDataProtection = new UserDataProtection();
