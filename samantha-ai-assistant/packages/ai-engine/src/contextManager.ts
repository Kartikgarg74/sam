import { ConversationContext } from '@samantha-ai-assistant/types';

// [CONTEXT] Manages conversation history and user preferences.
export class ContextManager {
  private conversationContext: ConversationContext = { sessionId: '', userId: '', history: [], userPreferences: {} };

  constructor() {
    // Initialize context manager, potentially loading from persistent storage
  }

  // [CONTEXT] Retrieves the current conversation context.
  async getContext(): Promise<ConversationContext> {
    return this.conversationContext;
  }

  // [CONTEXT] Updates the conversation history with a new message.
  async updateHistory(role: 'user' | 'assistant', content: string): Promise<void> {
    this.conversationContext.history.push({ role, content });
  }

  // [CONTEXT] Updates user preferences.
  async updateUserPreferences(preferences: Record<string, any>): Promise<void> {
    this.conversationContext.userPreferences = { ...this.conversationContext.userPreferences, ...preferences };
  }
}