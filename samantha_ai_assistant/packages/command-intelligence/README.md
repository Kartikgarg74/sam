# Command Intelligence (Orchestration Engine)

This package provides the orchestration engine for Samantha AI, enabling complex workflow management, user pattern learning, and predictive automation.

## Features
- Multi-step workflow coordination (sequential and parallel)
- User behavior pattern learning and analytics
- Predictive assistance and suggestions with feedback integration
- Context-aware automation (system, time, user state)
- Privacy-preserving local analytics

## Architecture
- **WorkflowManager:** Defines and executes multi-step workflows
- **PatternLearner:** Analyzes user command patterns and routines
- **PredictiveEngine:** Suggests and triggers proactive automations, learns from feedback
- **ContextIntelligence:** Integrates environmental, temporal, and user context

## Example Workflow Templates

### Morning Routine
```ts
import { WorkflowManager } from './src/workflowManager.js';
const manager = new WorkflowManager();
manager.defineWorkflow('morningRoutine', [
  async () => await openApp('Mail'),
  async () => await openApp('Calendar'),
  async () => await setSystemPreference('volume', 30),
]);
await manager.executeWorkflow('morningRoutine');
```

### Focus Mode
```ts
manager.defineWorkflow('focusMode', [
  async () => await closeApp('Slack'),
  async () => await setSystemPreference('doNotDisturb', true),
  async () => await openApp('VSCode'),
]);
```

### Evening Shutdown
```ts
manager.defineWorkflow('eveningShutdown', [
  async () => await closeApp('Mail'),
  async () => await closeApp('Calendar'),
  async () => await setSystemPreference('volume', 0),
]);
```

### Context Switching
```ts
manager.defineWorkflow('contextSwitch', [
  [async () => await openApp('Safari'), async () => await openApp('Spotify')], // Parallel
  async () => await setSystemPreference('volume', 50),
]);
```

> Replace `openApp`, `closeApp`, and `setSystemPreference` with your actual automation core integrations.

## Status
> **100% complete:** All core modules, context intelligence, feedback learning, and workflow templates are implemented.
