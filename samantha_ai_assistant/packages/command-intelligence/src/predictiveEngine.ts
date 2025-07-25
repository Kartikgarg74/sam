/**
 * PredictiveEngine generates proactive automation suggestions.
 */
import { PatternLearner } from './patternLearner.js';

interface SuggestionFeedback {
  [suggestion: string]: number; // +1 for positive, -1 for negative feedback
}

export class PredictiveEngine {
  private patternLearner: PatternLearner;
  private feedback: SuggestionFeedback = {};

  constructor(patternLearner: PatternLearner) {
    this.patternLearner = patternLearner;
  }

  /** Generate context-based action suggestions */
  generateSuggestions(context: any): string[] {
    const hour = new Date().getHours();
    const routines = this.patternLearner.learnTemporalPatterns(
      (context?.commandHistory || []).map((cmd: any) => ({ command: cmd, timestamp: Date.now() }))
    );
    let likelyCommands = routines[hour] || this.patternLearner.getMostFrequentCommands();
    // Sort by feedback score
    likelyCommands = likelyCommands.sort((a, b) => (this.feedback[b] || 0) - (this.feedback[a] || 0));
    return likelyCommands;
  }

  /** Evaluate environmental triggers (e.g., app open, time of day) */
  evaluateTriggers(environment: any): boolean {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 9 && environment?.userActive) {
      return true;
    }
    return false;
  }

  /** Score prediction confidence (frequency + feedback) */
  scoreConfidence(suggestion: string): number {
    const freq = this.patternLearner.getMostFrequentCommands(10).indexOf(suggestion);
    const feedbackScore = this.feedback[suggestion] || 0;
    let base = freq === -1 ? 0.1 : 1 - freq * 0.1;
    base += feedbackScore * 0.05;
    return Math.max(0, Math.min(1, base));
  }

  /** Integrate user feedback to improve suggestions */
  submitFeedback(suggestion: string, positive: boolean): void {
    if (!this.feedback[suggestion]) this.feedback[suggestion] = 0;
    this.feedback[suggestion] += positive ? 1 : -1;
  }
}
