Let me help you create a comprehensive system prompt for Cursor to effectively assist with the Samantha AI project. I'll design this to be thorough yet concise to avoid Cursor getting stuck.

```typescript name=.cursorrc/system_prompt.md
# Samantha AI Assistant - Cursor Development Context (2025)

## Project Identity
- Project: Samantha AI (Voice-automated OS Control)
- Developer: EmotionAI-Vimukti
- Target: macOS (M2)
- Timeline: 2025 Development

## Core Directives

1. DEVELOPMENT APPROACH
- Implement features iteratively
- Always provide working code
- Show progress indicators
- Raise blockers immediately

2. TECHNOLOGY DECISIONS
- When stuck, present options as:
```markdown
### Technology Decision Required
Context: [Specific context]
Options:
| Technology | Pros | Cons | Best For |
|------------|------|------|-----------|
| Option 1   | ...  | ...  | ...      |
| Option 2   | ...  | ...  | ...      |

Recommendation: [Clear recommendation with justification]
```

3. ERROR HANDLING
- Provide clear error messages
- Suggest immediate fixes
- Show debugging steps
- Include error recovery code

4. DEVELOPMENT FLOW
```typescript
interface DevelopmentStep {
  phase: string;
  status: 'planning' | 'in-progress' | 'completed';
  nextAction: string;
  blockers?: string[];
}

const developmentFlow = {
  current: {
    phase: string;
    progress: number;
    nextAction: string;
  },
  upcoming: DevelopmentStep[];
};
```

## Technical Stack (2025)
- AI: Gemini 2.5 Flash
- Voice: Whisper Tiny (Local)
- TTS: ElevenLabs
- Frontend: Next.js 14
- Backend: FastAPI
- DB: Edge SQL
- Deploy: Railway.app/Vercel

## Implementation Guidelines

1. CODE STRUCTURE
```typescript
interface ImplementationGuide {
  step: number;
  feature: string;
  codeStructure: {
    files: string[];
    dependencies: string[];
    tests: string[];
  };
  optimization: {
    m2Specific: boolean;
    memoryConstraints: boolean;
    performance: boolean;
  };
}
```

2. PERFORMANCE TARGETS
- Voice Processing: <500ms
- Command Execution: <1s
- Memory Usage: <1GB
- Storage: <50MB

3. ERROR PREVENTION
```typescript
type ErrorPrevention = {
  validation: string[];
  typeChecking: boolean;
  errorBoundaries: boolean;
  fallbackMechanisms: string[];
};
```

## Development Process

1. FEATURE IMPLEMENTATION
```typescript
async function implementFeature(feature: string) {
  // 1. Plan
  const plan = await createImplementationPlan(feature);

  // 2. Show Progress
  await showProgress(plan);

  // 3. Execute
  for (const step of plan.steps) {
    await implementStep(step);
    await validateStep(step);
    await updateProgress(step);
  }

  // 4. Validate
  await runTests(feature);
  await checkPerformance(feature);
}
```

2. PROBLEM RESOLUTION
```typescript
async function resolveProblem(issue: Issue) {
  // 1. Analyze
  const analysis = await analyzeIssue(issue);

  // 2. Present Options
  const options = await generateOptions(analysis);

  // 3. Await Decision
  const decision = await requestUserInput(options);

  // 4. Implement Solution
  await implementSolution(decision);
}
```

## Communication Protocol

1. STATUS UPDATES
```typescript
interface StatusUpdate {
  progress: number;
  currentTask: string;
  nextSteps: string[];
  blockers?: string[];
}
```

2. USER INTERACTION
```typescript
interface UserInteraction {
  type: 'decision' | 'information' | 'error';
  context: string;
  options?: string[];
  recommendation?: string;
}
```

## Development Priorities

1. CORE FUNCTIONALITY
- Voice Processing Pipeline
- Mac System Integration
- AI Command Processing
- Security Framework

2. OPTIMIZATION
- M2-Specific Optimizations
- Memory Management
- Performance Tuning
- Resource Monitoring

3. USER EXPERIENCE
- Response Time
- Error Handling
- Recovery Mechanisms
- Feedback Systems

## Quality Standards

1. CODE QUALITY
```typescript
interface QualityChecks {
  typeChecking: boolean;
  testCoverage: number;
  performanceMetrics: boolean;
  securityAudit: boolean;
}
```

2. PERFORMANCE METRICS
```typescript
interface PerformanceChecks {
  responseTime: number;
  memoryUsage: number;
  cpuUtilization: number;
  errorRate: number;
}
```

## Exit Criteria
- Working Feature Implementation
- Passing Tests
- Meeting Performance Targets
- Documentation Complete
- Error Handling Implemented
```
