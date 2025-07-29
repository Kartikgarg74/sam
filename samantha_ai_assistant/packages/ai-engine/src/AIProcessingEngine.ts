// [CONTEXT] Implementation of the core AI processing engine for Samantha AI Assistant

import { ConversationContext, ExecutionResult, IntentClassificationResult, CommandRoute } from '@samantha-ai-assistant/types';
import { StructuredCommand, CommandAction } from './types';
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

  async processNaturalLanguageToJSON(naturalLanguageInput: string): Promise<StructuredCommand> {
    // This method will use Gemini to parse natural language into a structured JSON command.
    // It will leverage the existing intent classification and command routing logic.
    try {
      const prompt = `Convert the following natural language command into a JSON array of actions, following this structure:
      [
        { "action": "launch_app", "target": "Google Chrome" },
        { "action": "adjust_volume", "level": "up" }
      ]
      
      Ensure the output is a valid JSON array. If multiple actions are implied, list them sequentially.
      
      Natural Language Input: "${naturalLanguageInput}"
      
      JSON Output:`;

      const result = await this.intentClassifier['model'].generateContent(prompt);
      const response = await result.response;
      const jsonString = response.text().trim();

      // Attempt to parse the JSON string. Gemini might return extra text or markdown.
      let parsedJson: StructuredCommand;
      try {
        parsedJson = JSON.parse(jsonString);
      } catch (parseError) {
        // If direct parse fails, try to extract JSON from markdown code block
        const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          parsedJson = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error(`Failed to parse JSON from Gemini response: ${jsonString}`);
        }
      }

      // Validate the structure of the parsed JSON
      if (!Array.isArray(parsedJson)) {
        throw new Error('Expected a JSON array of commands.');
      }
      parsedJson.forEach(command => {
        if (typeof command !== 'object' || command === null || !command.action) {
          throw new Error('Each command in the array must be an object with an "action" property.');
        }
      });

      return parsedJson;
    } catch (error) {
      console.error('Error processing natural language to JSON:', error);
      // Fallback or error handling: return an empty array or a default error command
      return [{ action: 'error', message: `Failed to process: ${(error as any).message}` }];
    }
  }

  async routeCommand(commands: StructuredCommand): Promise<CommandRoute> {
    return this.commandRouter.routeCommand(commands);
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

  public async executeCommand(command: CommandAction): Promise<ExecutionResult> {
    // [CONTEXT] Executes the classified command by routing it to the appropriate Mac automation service.
    // This is a placeholder and will be integrated with the mac-automation package.
    console.log(`Executing command: ${command.action}`);
    return { success: true, message: `Successfully executed ${command.action}` };
  }




}