# Mac Automation Core

## Purpose
This module provides the core functionalities for automating tasks and controlling applications on macOS. It integrates with native macOS APIs and scripting languages (AppleScript/JXA) to enable Samantha AI Assistant to interact with the user's system.

## Dependencies
- `@samantha-ai-assistant/types`: Provides shared type definitions used across the monorepo.

## Key Components
- `SystemIntegration`: Handles execution of native macOS commands and scripts.
- `ApplicationControl`: Provides methods to control specific applications like Spotify, web browsers, and system preferences.
- `SecurityManager`: Manages secure storage and access to sensitive credentials required for automation tasks.
- `PerformanceMonitor`: Monitors real-time system resources (CPU, memory, disk) to ensure optimal performance and resource management.

## Usage Examples
```typescript
import { MacAutomationCore, SystemIntegration, ApplicationControl, SecurityManager, PerformanceMonitor } from '@samantha-ai-assistant/mac-automation';
import { ExecutionResult, PerformanceMetrics } from '@samantha-ai-assistant/types';

class SamanthaMacAutomation implements MacAutomationCore {
  private systemIntegration: SystemIntegration;
  private applicationControl: ApplicationControl;
  private securityManager: SecurityManager;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.systemIntegration = new SystemIntegration();
    this.applicationControl = new ApplicationControl();
    this.securityManager = new SecurityManager();
    this.performanceMonitor = new PerformanceMonitor();
  }

  async executeSystemCommand(command: string): Promise<ExecutionResult> {
    console.log(`Executing system command: ${command}`);
    return this.systemIntegration.executeCommand(command);
  }

  async controlApplication(appName: string, action: any): Promise<ExecutionResult> {
    console.log(`Controlling application ${appName} with action: ${JSON.stringify(action)}`);
    return this.applicationControl.controlApplication(appName, action);
  }

  async manageSecurity(key: string, value: any): Promise<boolean> {
    console.log(`Managing security for key: ${key}`);
    return this.securityManager.manageCredentials(key, value);
  }

  async monitorPerformance(): Promise<PerformanceMetrics> {
    console.log('Monitoring performance...');
    return this.performanceMonitor.getPerformanceMetrics();
  }
}

// Example usage (conceptual)
async function runMacAutomation() {
  const macAutomation = new SamanthaMacAutomation();

  try {
    // Example: Execute a shell command
    const result1 = await macAutomation.executeSystemCommand('osascript -e \'display notification "Hello from Samantha!" with title "Samantha AI"\'');
    console.log('System command result:', result1);

    // Example: Control Spotify (conceptual action)
    const result2 = await macAutomation.controlApplication('Spotify', { action: 'playPause' });
    console.log('Spotify control result:', result2);

    // Example: Get performance metrics
    const metrics = await macAutomation.monitorPerformance();
    console.log('Current performance metrics:', metrics);

  } catch (error) {
    console.error('Mac Automation error:', error);
  }
}

// runMacAutomation();
```

## API Reference
- `MacAutomationCore` (interface): Defines the main contract for Mac automation functionalities.
- `SystemIntegration` (class): Provides methods for `executeCommand`.
- `ApplicationControl` (class): Provides methods for `controlApplication`.
- `SecurityManager` (class): Provides methods for `manageCredentials`.
- `PerformanceMonitor` (class): Provides methods for `getPerformanceMetrics`.

## Development Setup
1. Ensure `pnpm` is installed (`npm install -g pnpm`).
2. Navigate to the root of the monorepo.
3. Run `pnpm install` to install dependencies for all packages.
4. Run `pnpm build` from the monorepo root or `pnpm build` within this package directory to compile the TypeScript code.

## Testing
Currently, basic unit tests are planned. Run `pnpm test` within this package directory.

## Contributing
Contributions are welcome. Please ensure all changes adhere to the established coding standards and include comprehensive tests and documentation.