/**
 * WorkflowManager handles multi-step workflow definition, execution, and progress tracking.
 */
export type WorkflowStep = () => Promise<any>;
export type WorkflowStepGroup = WorkflowStep | WorkflowStep[];

interface Workflow {
  name: string;
  steps: WorkflowStepGroup[];
  progress: number;
  completedSteps: number;
}

export class WorkflowManager {
  private workflows: Map<string, Workflow> = new Map();

  /**
   * Define a new workflow
   * @param name - Workflow name
   * @param steps - Array of steps or parallel step groups
   */
  defineWorkflow(name: string, steps: WorkflowStepGroup[]): void {
    this.workflows.set(name, {
      name,
      steps,
      progress: 0,
      completedSteps: 0
    });
  }

  /**
   * Execute a named workflow (supports sequential and parallel step groups)
   * @param name - Workflow name
   * @returns Workflow execution result
   */
  async executeWorkflow(name: string): Promise<any> {
    const workflow = this.workflows.get(name);
    if (!workflow) throw new Error(`Workflow '${name}' not found`);
    workflow.progress = 0;
    workflow.completedSteps = 0;
    const results = [];
    for (let i = 0; i < workflow.steps.length; i++) {
      const stepOrGroup = workflow.steps[i];
      try {
        let stepResult;
        if (Array.isArray(stepOrGroup)) {
          // Parallel execution
          stepResult = await Promise.all(stepOrGroup.map(fn => fn()));
        } else {
          // Sequential execution
          stepResult = await stepOrGroup();
        }
        results.push(stepResult);
        workflow.completedSteps++;
        workflow.progress = ((i + 1) / workflow.steps.length) * 100;
      } catch (error) {
        workflow.progress = (i / workflow.steps.length) * 100;
        return { status: 'error', error, results, progress: workflow.progress };
      }
    }
    workflow.progress = 100;
    return { status: 'success', results, progress: 100 };
  }

  /** Track workflow progress */
  getProgress(name: string): number {
    const workflow = this.workflows.get(name);
    return workflow ? workflow.progress : 0;
  }

  /** Rollback workflow by undoing completed steps (if undo logic is provided) */
  async rollbackWorkflow(name: string, undoSteps?: WorkflowStep[]): Promise<void> {
    const workflow = this.workflows.get(name);
    if (!workflow || !undoSteps) return;
    for (let i = workflow.completedSteps - 1; i >= 0; i--) {
      try {
        await undoSteps[i]();
      } catch {
        // Ignore rollback errors
      }
    }
    workflow.progress = 0;
    workflow.completedSteps = 0;
  }
}
