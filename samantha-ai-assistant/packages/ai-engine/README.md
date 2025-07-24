# AI Engine

## Purpose
This module serves as the core AI processing engine for the Samantha AI Assistant. It is responsible for understanding user intent, routing commands to appropriate services, managing conversation context, and generating natural language responses.

## Dependencies
- `@samantha-ai-assistant/types`: Provides shared type definitions used across the monorepo.

## Key Components
- `IntentClassifier`: Utilizes Gemini 2.5 Flash for advanced intent classification and entity extraction with context awareness.
- `CommandRouter`: Intelligently routes classified intents to the correct Mac automation or other external services.
- `ContextManager`: Maintains conversation history, user preferences, and other relevant contextual information.
- `ResponseGenerator`: Generates natural language responses with a defined personality, based on the outcome of command execution.

## Usage Examples
```typescript
import { AIProcessingEngine, IntentClassifier, CommandRouter, ContextManager, ResponseGenerator } from '@samantha-ai-assistant/ai-engine';
import { ConversationContext, IntentClassificationResult, CommandRoute, ExecutionResult } from '@samantha-ai-assistant/types';

class SamanthaAIEngine implements AIProcessingEngine {
  private intentClassifier: IntentClassifier;
  private commandRouter: CommandRouter;
  private contextManager: ContextManager;
  private responseGenerator: ResponseGenerator;

  constructor() {
    this.intentClassifier = new IntentClassifier();
    this.commandRouter = new CommandRouter();
    this.contextManager = new ContextManager();
    this.responseGenerator = new ResponseGenerator();
  }

  async classifyIntent(text: string, context: ConversationContext): Promise<IntentClassificationResult> {
    console.log(`Classifying intent for: "${text}"`);
    return this.intentClassifier.classifyIntent(text, context);
  }

  async routeCommand(intent: IntentClassificationResult): Promise<CommandRoute> {
    console.log(`Routing command for intent: ${intent.intent}`);
    return this.commandRouter.routeCommand(intent);
  }

  async manageContext(context: ConversationContext, update: any): Promise<ConversationContext> {
    console.log('Managing context...');
    return this.contextManager.manageContext(context, update);
  }

  async generateResponse(executionResult: ExecutionResult, context: ConversationContext): Promise<string> {
    console.log('Generating response...');
    return this.responseGenerator.generateResponse(executionResult, context);
  }
}

// Example usage (conceptual)
async function runAIEngine() {
  const aiEngine = new SamanthaAIEngine();
  let context: ConversationContext = { history: [], preferences: {} };

  try {
    const inputText = "Open Spotify and play my discovery weekly playlist.";
    const intent = await aiEngine.classifyIntent(inputText, context);
    const commandRoute = await aiEngine.routeCommand(intent);

    // Simulate command execution result
    const simulatedExecutionResult: ExecutionResult = { success: true, message: "Spotify opened and playing Discovery Weekly." };

    const response = await aiEngine.generateResponse(simulatedExecutionResult, context);
    console.log(`Samantha's response: ${response}`);

    context = await aiEngine.manageContext(context, { newEntry: { role: 'assistant', content: response } });

  } catch (error) {
    console.error('AI Engine error:', error);
  }
}

// runAIEngine();
```

## API Reference
- `AIProcessingEngine` (interface): Defines the main contract for the AI processing flow.
- `IntentClassifier` (class): Provides methods for `classifyIntent`.
- `CommandRouter` (class): Provides methods for `routeCommand`.
- `ContextManager` (class): Provides methods for `manageContext`.
- `ResponseGenerator` (class): Provides methods for `generateResponse`.

## Development Setup
1. Ensure `pnpm` is installed (`npm install -g pnpm`).
2. Navigate to the root of the monorepo.
3. Run `pnpm install` to install dependencies for all packages.
4. Run `pnpm build` from the monorepo root or `pnpm build` within this package directory to compile the TypeScript code.

## Testing
Currently, basic unit tests are planned. Run `pnpm test` within this package directory.

## Contributing
Contributions are welcome. Please ensure all changes adhere to the established coding standards and include comprehensive tests and documentation.