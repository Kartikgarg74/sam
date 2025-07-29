/**
 * Data Migration System Types
 */

// Migration Types
export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  backupId?: string;
  migrationCount?: number;
  appliedMigrations?: string[];
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  rollbackCount?: number;
  appliedRollbacks?: string[];
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MigrationHistory {
  fromVersion: string;
  toVersion: string;
  timestamp: number;
  backupId?: string;
  appliedMigrations?: string[];
  success: boolean;
  error?: string;
}

// Sync Types
export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge';

export interface SyncResult {
  success: boolean;
  sourceBrowser: Browser;
  targetBrowser: Browser;
  dataSize?: number;
  importedItems?: number;
  transformedItems?: number;
  error?: string;
}

export interface ExportedData {
  version: string;
  browser: Browser;
  timestamp: number;
  data: any;
  metadata: BrowserMetadata;
  checksum: string;
  compressed?: Uint8Array;
  size?: number;
  items?: any[];
}

export interface ImportResult {
  success: boolean;
  importedCount?: number;
  backupId?: string;
  version?: string;
  error?: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  reasons: string[];
}

export interface BrowserMetadata {
  browser: Browser;
  userAgent: string;
  extensionVersion: string;
  platform: string;
  language: string;
  timezone: string;
  lastSync?: number;
}

export interface DataTransformation {
  name: string;
  apply(data: any): Promise<any>;
}

// Backup Types
export interface BackupData {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  checksum: string;
  data: Uint8Array;
  metadata: BackupMetadata;
}

export interface BackupInfo {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  browser: string;
  includeSensitiveData: boolean;
}

export interface RestoreResult {
  success: boolean;
  backupId?: string;
  restoredVersion?: string;
  dataSize?: number;
  restoreBackupId?: string;
  error?: string;
}

export interface ExportedBackup extends BackupData {
  exportTimestamp: number;
  exportVersion: string;
}

export interface BackupMetadata {
  browser: string;
  userAgent: string;
  extensionVersion: string;
  includeSensitiveData: boolean;
}

// Settings Types
export interface SettingsExport {
  version: string;
  timestamp: number;
  settings: any;
  metadata: SettingsMetadata;
  checksum: string;
}

export interface SettingsMetadata {
  browser: string;
  userAgent: string;
  extensionVersion: string;
  includeSensitiveData: boolean;
}

// Data Storage Types
export interface ChromeStorage {
  // User Preferences
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    voiceSettings: {
      sensitivity: number;
      timeout: number;
      language: string;
      trainingData?: any;
    };
    privacySettings: {
      analyticsConsent: boolean;
      analyticsEnabled: boolean;
      dataRetention: number;
    };
  };

  // Cached Data
  cache: {
    aiResponses: Map<string, AIResponse>;
    commandHistory: CommandHistory[];
    voiceTraining: VoiceTrainingData;
    performanceMetrics: PerformanceData[];
  };

  // Extension State
  state: {
    isListening: boolean;
    lastCommand: string;
    errorCount: number;
    sessionStartTime: number;
  };

  // Local Storage
  localStorage: {
    temporaryData: any;
    sessionData: SessionData;
    debugLogs: DebugLog[];
  };
}

export interface FirefoxStorage {
  storage: {
    local: ChromeStorage;
    sync: ChromeStorage;
    managed: ChromeStorage;
  };
}

export interface SafariStorage {
  webkitStorage: {
    local: ChromeStorage;
    session: any; // SessionStorage type
  };
}

// Data Types
export interface AIResponse {
  id: string;
  query: string;
  response: string;
  timestamp: number;
  confidence: number;
}

export interface CommandHistory {
  id: string;
  command: string;
  result: string;
  timestamp: number;
  success: boolean;
}

export interface VoiceTrainingData {
  samples: VoiceSample[];
  model: any;
  accuracy: number;
  lastUpdated: number;
}

export interface VoiceSample {
  id: string;
  audio: ArrayBuffer;
  transcript: string;
  timestamp: number;
  quality: number;
}

export interface PerformanceData {
  metric: string;
  value: number;
  timestamp: number;
  browser: string;
  version: string;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  commands: number;
  errors: number;
  duration: number;
}

export interface DebugLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  context?: any;
}

// Schema Types
export interface DataSchema {
  version: string;
  preferences: SchemaField;
  cache: SchemaField;
  state: SchemaField;
  localStorage: SchemaField;
}

export interface SchemaField {
  type: string;
  required?: boolean;
  properties?: Record<string, SchemaField>;
  enum?: any[];
  min?: number;
  max?: number;
  pattern?: string;
}

// Migration Types
export interface Migration {
  fromVersion: string;
  toVersion: string;
  description: string;
  apply(data: any): Promise<any>;
  rollback(data: any): Promise<any>;
}

// Error Types
export interface MigrationError {
  type: 'validation' | 'transformation' | 'storage' | 'network' | 'unknown';
  message: string;
  details?: any;
  recoverable: boolean;
}

export interface SyncError {
  type: 'compatibility' | 'transformation' | 'validation' | 'network' | 'unknown';
  message: string;
  sourceBrowser: Browser;
  targetBrowser: Browser;
  details?: any;
}

export interface BackupError {
  type: 'validation' | 'compression' | 'encryption' | 'storage' | 'unknown';
  message: string;
  backupId?: string;
  details?: any;
}

// Configuration Types
export interface MigrationConfig {
  maxBackups: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  validateOnMigration: boolean;
  autoRollback: boolean;
}

export interface SyncConfig {
  enableCrossBrowserSync: boolean;
  enableDataTransformation: boolean;
  validateCompatibility: boolean;
  backupBeforeSync: boolean;
}

export interface BackupConfig {
  autoBackup: boolean;
  backupInterval: number;
  maxBackupSize: number;
  includeSensitiveData: boolean;
}

export interface SettingsConfig {
  enableSettingsExport: boolean;
  enableSettingsImport: boolean;
  validateSettings: boolean;
  mergeSettings: boolean;
}

// Event Types
export interface MigrationEvent {
  type: 'started' | 'completed' | 'failed' | 'rolledback';
  fromVersion: string;
  toVersion: string;
  timestamp: number;
  details?: any;
}

export interface SyncEvent {
  type: 'started' | 'completed' | 'failed';
  sourceBrowser: Browser;
  targetBrowser: Browser;
  timestamp: number;
  details?: any;
}

export interface BackupEvent {
  type: 'created' | 'restored' | 'deleted' | 'exported' | 'imported';
  backupId: string;
  timestamp: number;
  details?: any;
}

// Utility Types
export type MigrationStatus = 'idle' | 'running' | 'completed' | 'failed' | 'rolledback';

export type SyncStatus = 'idle' | 'running' | 'completed' | 'failed';

export type BackupStatus = 'idle' | 'creating' | 'restoring' | 'completed' | 'failed';

export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'warning';

// API Response Types
export interface MigrationAPIResponse {
  success: boolean;
  data?: MigrationResult;
  error?: MigrationError;
}

export interface SyncAPIResponse {
  success: boolean;
  data?: SyncResult;
  error?: SyncError;
}

export interface BackupAPIResponse {
  success: boolean;
  data?: BackupData | BackupInfo[];
  error?: BackupError;
}

export interface SettingsAPIResponse {
  success: boolean;
  data?: SettingsExport;
  error?: string;
}

// Monitoring Types
export interface MigrationMetrics {
  totalMigrations: number;
  successfulMigrations: number;
  failedMigrations: number;
  averageMigrationTime: number;
  dataLossRate: number;
  rollbackRate: number;
  userImpact: number;
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  dataTransformationRate: number;
  compatibilityIssues: number;
}

export interface BackupMetrics {
  totalBackups: number;
  totalSize: number;
  averageBackupSize: number;
  restoreSuccessRate: number;
  backupRetentionRate: number;
}

// Notification Types
export interface MigrationNotification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  details?: any;
  timestamp: number;
}

export interface SyncNotification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  sourceBrowser: Browser;
  targetBrowser: Browser;
  timestamp: number;
}

export interface BackupNotification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  backupId?: string;
  timestamp: number;
}
