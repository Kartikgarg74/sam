# Shared Types

## Purpose
This package defines and centralizes all shared TypeScript types and interfaces used across the Samantha AI Assistant monorepo. This ensures type safety, consistency, and reduces redundancy across different packages like `voice-core`, `ai-engine`, and `mac-automation`.

## Dependencies
None (this package is a foundational dependency for others).

## Key Components
- `AudioBuffer`: Represents raw audio data.
- `TranscriptionResult`: Stores the output of the transcription service.
- `ConversationContext`: Manages the state and history of a conversation.
- `IntentClassificationResult`: Contains the classified intent and extracted entities from user input.
- `CommandRoute`: Defines how a command should be routed for execution.
- `ExecutionResult`: Represents the outcome of a command execution.
- `PerformanceMetrics`: Stores various performance-related data points.
- `CommandResult`: A generic type for the result of a command.
- `ErrorResponse`: Standardized error response format.

## Usage Examples
```typescript
// In packages/voice-core/src/index.ts
import { AudioBuffer, TranscriptionResult } from '@samantha-ai-assistant/types';

interface TranscriptionService {
  transcribe(audio: AudioBuffer): Promise<TranscriptionResult>;
}

// In packages/ai-engine/src/index.ts
import { ConversationContext, IntentClassificationResult } from '@samantha-ai-assistant/types';

interface IntentClassifier {
  classifyIntent(text: string, context: ConversationContext): Promise<IntentClassificationResult>;
}

// In packages/mac-automation/src/index.ts
import { ExecutionResult, PerformanceMetrics } from '@samantha-ai-assistant/types';

interface SystemIntegration {
  executeCommand(command: string): Promise<ExecutionResult>;
}
```

## API Reference
All types and interfaces defined in `src/index.ts` are exported for use in other packages.

## Development Setup
1. Ensure `pnpm` is installed (`npm install -g pnpm`).
2. Navigate to the root of the monorepo.
3. Run `pnpm install` to install dependencies for all packages.
4. Run `pnpm build` from the monorepo root or `pnpm build` within this package directory to compile the TypeScript types.

## Testing
As this package primarily contains type definitions, extensive runtime testing is not typically required. Type checking is performed during compilation of dependent packages.

## Contributing
Contributions are welcome. Please ensure all new types are clearly defined, well-documented, and adhere to the established naming conventions.