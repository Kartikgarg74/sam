export interface CommandAction {
  action: string;
  target?: string;
  level?: string;
  [key: string]: any; // For additional parameters
}

export type StructuredCommand = CommandAction[];

export interface IntentClassificationResult {
  intent: string;
  confidence: number;
  parameters?: { [key: string]: any };
}