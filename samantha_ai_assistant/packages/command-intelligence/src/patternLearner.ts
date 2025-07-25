/**
 * PatternLearner analyzes user command patterns and adapts to preferences.
 */

interface CommandUsage {
  count: number;
  lastUsed: number;
  times: number[];
}

export class PatternLearner {
  private commandStats: Record<string, CommandUsage> = {};
  private preferences: Record<string, any> = {};

  /** Analyze command usage frequency and patterns */
  analyzeUsage(commands: string[]): void {
    const now = Date.now();
    for (const cmd of commands) {
      if (!this.commandStats[cmd]) {
        this.commandStats[cmd] = { count: 0, lastUsed: 0, times: [] };
      }
      this.commandStats[cmd].count++;
      this.commandStats[cmd].lastUsed = now;
      this.commandStats[cmd].times.push(now);
    }
  }

  /** Get most frequently used commands */
  getMostFrequentCommands(topN = 3): string[] {
    return Object.entries(this.commandStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, topN)
      .map(([cmd]) => cmd);
  }

  /** Learn time-based routines (returns commands used at similar times of day) */
  learnTemporalPatterns(commands: Array<{ command: string, timestamp: number }>): Record<string, string[]> {
    // Group commands by hour of day
    const routines: Record<string, string[]> = {};
    for (const { command, timestamp } of commands) {
      const hour = new Date(timestamp).getHours();
      if (!routines[hour]) routines[hour] = [];
      routines[hour].push(command);
    }
    return routines;
  }

  /** Adapt to user preferences (store/update preferences) */
  adaptPreferences(feedback: Record<string, any>): void {
    for (const key in feedback) {
      this.preferences[key] = feedback[key];
    }
  }

  /** Get current preferences */
  getPreferences(): Record<string, any> {
    return this.preferences;
  }
}
