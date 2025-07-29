import { StorageManager } from '../utils/storageManager';
import { BackupManager } from './backup-manager';
import { ValidationResult, MigrationResult, RollbackResult, MigrationHistory } from './types';

/**
 * Migration Manager - Handles data migrations between versions
 */
export class MigrationManager {
  private storageManager: StorageManager;
  private backupManager: BackupManager;
  private migrations: Map<string, Migration>;

  constructor() {
    this.storageManager = new StorageManager();
    this.backupManager = new BackupManager();
    this.migrations = new Map();
    this.registerMigrations();
  }

  /**
   * Register all available migrations
   */
  private registerMigrations(): void {
    // Register migrations in order
    this.migrations.set('1.0.0-to-1.1.0', require('./migrations/v1.0.0-to-v1.1.0').default);
    this.migrations.set('1.1.0-to-1.2.0', require('./migrations/v1.1.0-to-v1.2.0').default);
    this.migrations.set('1.2.0-to-1.3.0', require('./migrations/v1.2.0-to-v1.3.0').default);
    this.migrations.set('1.3.0-to-2.0.0', require('./migrations/v1.3.0-to-v2.0.0').default);
  }

  /**
   * Migrate data from one version to another
   */
  async migrateVersion(fromVersion: string, toVersion: string): Promise<MigrationResult> {
    console.log(`Starting migration from ${fromVersion} to ${toVersion}`);

    try {
      // 1. Validate version format
      if (!this.isValidVersion(fromVersion) || !this.isValidVersion(toVersion)) {
        throw new Error('Invalid version format');
      }

      // 2. Check if migration is needed
      if (fromVersion === toVersion) {
        return {
          success: true,
          fromVersion,
          toVersion,
          message: 'No migration needed - versions are the same',
          migrationCount: 0
        };
      }

      // 3. Create backup before migration
      const backup = await this.backupManager.createBackup(true);
      console.log(`Backup created: ${backup.id}`);

      // 4. Load current data
      const currentData = await this.storageManager.loadAllData();
      console.log('Current data loaded');

      // 5. Validate current data
      const validation = await this.validateData(currentData, fromVersion);
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      // 6. Get migration path
      const migrationPath = this.getMigrationPath(fromVersion, toVersion);
      if (!migrationPath) {
        throw new Error(`No migration path found from ${fromVersion} to ${toVersion}`);
      }

      // 7. Apply migrations
      let migratedData = currentData;
      const appliedMigrations: string[] = [];

      for (const migrationKey of migrationPath) {
        const migration = this.migrations.get(migrationKey);
        if (!migration) {
          throw new Error(`Migration not found: ${migrationKey}`);
        }

        console.log(`Applying migration: ${migrationKey}`);
        migratedData = await migration.apply(migratedData);
        appliedMigrations.push(migrationKey);

        // Validate after each migration
        const intermediateValidation = await this.validateData(migratedData, migration.toVersion);
        if (!intermediateValidation.isValid) {
          throw new Error(`Migration validation failed at ${migrationKey}: ${intermediateValidation.errors.join(', ')}`);
        }
      }

      // 8. Final validation
      const finalValidation = await this.validateData(migratedData, toVersion);
      if (!finalValidation.isValid) {
        throw new Error(`Final migration validation failed: ${finalValidation.errors.join(', ')}`);
      }

      // 9. Save migrated data
      await this.storageManager.saveAllData(migratedData);
      await this.storageManager.setVersion(toVersion);

      // 10. Record migration history
      await this.recordMigration({
        fromVersion,
        toVersion,
        timestamp: Date.now(),
        backupId: backup.id,
        appliedMigrations,
        success: true
      });

      console.log(`Migration completed successfully: ${fromVersion} → ${toVersion}`);

      return {
        success: true,
        fromVersion,
        toVersion,
        backupId: backup.id,
        migrationCount: appliedMigrations.length,
        appliedMigrations
      };

    } catch (error) {
      console.error(`Migration failed: ${error.message}`);

      // Attempt rollback
      try {
        await this.rollbackMigration(fromVersion);
        console.log('Rollback completed successfully');
      } catch (rollbackError) {
        console.error(`Rollback failed: ${rollbackError.message}`);
      }

      // Record failed migration
      await this.recordMigration({
        fromVersion,
        toVersion,
        timestamp: Date.now(),
        error: error.message,
        success: false
      });

      return {
        success: false,
        fromVersion,
        toVersion,
        error: error.message
      };
    }
  }

  /**
   * Validate data against a specific version schema
   */
  async validateData(data: any, version: string): Promise<ValidationResult> {
    const schema = await this.getSchema(version);
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate required fields
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

      // Validate data integrity
      const integrityCheck = await this.validateDataIntegrity(data);
      if (!integrityCheck.isValid) {
        errors.push(`Data integrity check failed: ${integrityCheck.error}`);
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
   * Rollback migration to a specific version
   */
  async rollbackMigration(targetVersion: string): Promise<RollbackResult> {
    console.log(`Starting rollback to version ${targetVersion}`);

    try {
      // 1. Load current data
      const currentData = await this.storageManager.loadAllData();
      const currentVersion = await this.storageManager.getVersion();

      // 2. Find rollback migrations
      const rollbackPath = this.getMigrationPath(currentVersion, targetVersion);
      if (!rollbackPath) {
        throw new Error(`No rollback path found from ${currentVersion} to ${targetVersion}`);
      }

      // 3. Apply rollback migrations in reverse
      let rolledBackData = currentData;
      const appliedRollbacks: string[] = [];

      for (const migrationKey of rollbackPath.reverse()) {
        const migration = this.migrations.get(migrationKey);
        if (!migration) {
          throw new Error(`Migration not found: ${migrationKey}`);
        }

        console.log(`Applying rollback: ${migrationKey}`);
        rolledBackData = await migration.rollback(rolledBackData);
        appliedRollbacks.push(migrationKey);

        // Validate after each rollback
        const intermediateValidation = await this.validateData(rolledBackData, migration.fromVersion);
        if (!intermediateValidation.isValid) {
          throw new Error(`Rollback validation failed at ${migrationKey}: ${intermediateValidation.errors.join(', ')}`);
        }
      }

      // 4. Final validation
      const finalValidation = await this.validateData(rolledBackData, targetVersion);
      if (!finalValidation.isValid) {
        throw new Error(`Final rollback validation failed: ${finalValidation.errors.join(', ')}`);
      }

      // 5. Save rolled back data
      await this.storageManager.saveAllData(rolledBackData);
      await this.storageManager.setVersion(targetVersion);

      console.log(`Rollback completed successfully: ${currentVersion} → ${targetVersion}`);

      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: targetVersion,
        rollbackCount: appliedRollbacks.length,
        appliedRollbacks
      };

    } catch (error) {
      console.error(`Rollback failed: ${error.message}`);

      return {
        success: false,
        fromVersion: currentVersion,
        toVersion: targetVersion,
        error: error.message
      };
    }
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(): Promise<MigrationHistory[]> {
    try {
      const history = await this.storageManager.get('migrationHistory', []);
      return history.sort((a: MigrationHistory, b: MigrationHistory) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error(`Failed to get migration history: ${error.message}`);
      return [];
    }
  }

  /**
   * Get available migrations
   */
  getAvailableMigrations(): string[] {
    return Array.from(this.migrations.keys());
  }

  /**
   * Check if migration is available
   */
  isMigrationAvailable(fromVersion: string, toVersion: string): boolean {
    const migrationPath = this.getMigrationPath(fromVersion, toVersion);
    return migrationPath !== null;
  }

  /**
   * Get migration path between versions
   */
  private getMigrationPath(fromVersion: string, toVersion: string): string[] | null {
    const versionGraph = this.buildVersionGraph();
    return this.findPath(versionGraph, fromVersion, toVersion);
  }

  /**
   * Build version dependency graph
   */
  private buildVersionGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const [migrationKey, migration] of this.migrations) {
      const fromVersion = migration.fromVersion;
      const toVersion = migration.toVersion;

      if (!graph.has(fromVersion)) {
        graph.set(fromVersion, []);
      }
      graph.get(fromVersion)!.push(toVersion);
    }

    return graph;
  }

  /**
   * Find path between versions using BFS
   */
  private findPath(graph: Map<string, string[]>, start: string, end: string): string[] | null {
    const queue: Array<{ version: string; path: string[] }> = [{ version: start, path: [] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { version, path } = queue.shift()!;

      if (version === end) {
        return path;
      }

      if (visited.has(version)) {
        continue;
      }

      visited.add(version);

      const neighbors = graph.get(version) || [];
      for (const neighbor of neighbors) {
        const migrationKey = `${version}-to-${neighbor}`;
        queue.push({
          version: neighbor,
          path: [...path, migrationKey]
        });
      }
    }

    return null;
  }

  /**
   * Validate version format
   */
  private isValidVersion(version: string): boolean {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return versionRegex.test(version);
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

    // Range validation
    if (schema.min !== undefined && value < schema.min) {
      errors.push(`Value must be >= ${schema.min}`);
    }
    if (schema.max !== undefined && value > schema.max) {
      errors.push(`Value must be <= ${schema.max}`);
    }

    // Pattern validation
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`Value must match pattern: ${schema.pattern}`);
    }

    return { errors, warnings };
  }

  /**
   * Get schema for specific version
   */
  private async getSchema(version: string): Promise<any> {
    // Load schema based on version
    const schemas = {
      '1.0.0': require('./schemas/v1.0.0').default,
      '1.1.0': require('./schemas/v1.1.0').default,
      '1.2.0': require('./schemas/v1.2.0').default,
      '1.3.0': require('./schemas/v1.3.0').default,
      '2.0.0': require('./schemas/v2.0.0').default
    };

    return schemas[version] || schemas['2.0.0']; // Default to latest
  }

  /**
   * Validate data integrity
   */
  private async validateDataIntegrity(data: any): Promise<{ isValid: boolean; error?: string }> {
    try {
      const checksum = await this.generateChecksum(JSON.stringify(data));
      const storedChecksum = await this.storageManager.get('dataChecksum');

      if (checksum !== storedChecksum) {
        return {
          isValid: false,
          error: 'Data integrity check failed - checksum mismatch'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Data integrity check failed: ${error.message}`
      };
    }
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
   * Record migration in history
   */
  private async recordMigration(record: MigrationHistory): Promise<void> {
    try {
      const history = await this.getMigrationHistory();
      history.unshift(record);

      // Keep only last 100 migrations
      if (history.length > 100) {
        history.splice(100);
      }

      await this.storageManager.set('migrationHistory', history);
    } catch (error) {
      console.error(`Failed to record migration: ${error.message}`);
    }
  }
}

/**
 * Migration interface
 */
export interface Migration {
  fromVersion: string;
  toVersion: string;
  description: string;
  apply(data: any): Promise<any>;
  rollback(data: any): Promise<any>;
}
