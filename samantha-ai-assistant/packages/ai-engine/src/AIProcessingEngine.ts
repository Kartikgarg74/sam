// [CONTEXT] Implementation of the core AI processing engine for Samantha AI Assistant

import { ConversationContext, CommandResult, ExecutionResult, IntentClassificationResult, CommandRoute } from '@samantha-ai-assistant/types';
import { IAIProcessingEngine } from './index.js';
import { IntentClassification } from './intentClassification.js';
import { CommandRouter } from './commandRouter.js';
import { ContextManager } from './contextManager.js';
import { ResponseGenerator } from './responseGenerator.js';

export class AIProcessingEngine implements IAIProcessingEngine {
  private intentClassifier: IntentClassification;
  private commandRouter: CommandRouter;
  private contextManager: ContextManager;
  private responseGenerator: ResponseGenerator;

  constructor() {
    this.intentClassifier = new IntentClassification();
    this.commandRouter = new CommandRouter();
    this.contextManager = new ContextManager();
    this.responseGenerator = new ResponseGenerator();
  }

  async classifyIntent(text: string, context: ConversationContext): Promise<IntentClassificationResult> {
    return this.intentClassifier.classifyIntent(text, context);
  }

  async routeCommand(intent: IntentClassificationResult): Promise<CommandRoute> {
    return this.commandRouter.routeCommand(intent);
  }

  async manageContext(context: ConversationContext, update: any): Promise<ConversationContext> {
    // This is a simplified example. In a real scenario, you'd have more sophisticated context management.
    if (update.history) {
      await this.contextManager.updateHistory(update.history.role, update.history.content);
    } else if (update.userPreferences) {
      await this.contextManager.updateUserPreferences(update.userPreferences);
    }
    return this.contextManager.getContext();
  }

  public async generateResponse(executionResult: ExecutionResult, context: ConversationContext): Promise<string> {
    return this.responseGenerator.generateResponse(JSON.stringify(executionResult), context);
  }

  public async executeCommand(command: CommandResult): Promise<ExecutionResult> {
    // [CONTEXT] Executes the classified command by routing it to the appropriate Mac automation service.
    // This is a placeholder and will be integrated with the mac-automation package.
    console.log(`Executing command: ${command.intent}`);
    return { success: true, message: `Successfully executed ${command.intent}` };
  }




}