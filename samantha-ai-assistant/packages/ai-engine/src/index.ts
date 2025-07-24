// [CONTEXT] Core AI processing engine for Samantha AI Assistant

/**
 * @interface AIProcessingEngine
 * @description Defines the core interface for the AI processing engine,
 * handling intent classification, command routing, context management, and response generation.
 */
export interface IAIProcessingEngine {
  /**
   * @function classifyIntent
   * @description Classifies the user's intent using Gemini 2.5 Flash with context awareness.
   * @param {string} text - The input text to classify.
   * @param {ConversationContext} context - The current conversation context.
   * @returns {Promise<IntentClassificationResult>} A promise that resolves with the classified intent.
   */
  classifyIntent(text: string, context: ConversationContext): Promise<IntentClassificationResult>;

  /**
   * @function routeCommand
   * @description Routes the classified intent to the appropriate automation service.
   * @param {IntentClassificationResult} intent - The classified intent.
   * @returns {Promise<CommandRoute>} A promise that resolves with the command route.
   */
  routeCommand(intent: IntentClassificationResult): Promise<CommandRoute>;

  /**
   * @function manageContext
   * @description Manages conversation history and user preferences.
   * @param {ConversationContext} context - The current conversation context.
   * @param {any} update - The update to apply to the context.
   * @returns {Promise<ConversationContext>} A promise that resolves with the updated conversation context.
   */
  manageContext(context: ConversationContext, update: any): Promise<ConversationContext>;

  /**
   * @function generateResponse
   * @description Generates a natural language response with personality based on the command execution.
   * @param {ExecutionResult} executionResult - The result of the command execution.
   * @param {ConversationContext} context - The current conversation context.
   * @returns {Promise<string>} A promise that resolves with the generated response text.
   */
  generateResponse(executionResult: ExecutionResult, context: ConversationContext): Promise<string>;

  /**
   * @function executeCommand
   * @description Executes a given command and returns the result.
   * @param {CommandResult} command - The command to execute.
   * @returns {Promise<ExecutionResult>} A promise that resolves with the result of the command execution.
   */
  executeCommand(command: CommandResult): Promise<ExecutionResult>;
}

// Placeholder types for now, will be defined in packages/types
import { ConversationContext, CommandResult, ExecutionResult, IntentClassificationResult, CommandRoute } from '@samantha-ai-assistant/types';

export * from './intentClassification.js';
export * from './commandRouter.js';
export * from './contextManager.js';
export * from './responseGenerator.js';
export * from './AIProcessingEngine.js';