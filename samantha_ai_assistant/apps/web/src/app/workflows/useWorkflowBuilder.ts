import { useState } from 'react';

export interface Step {
  action: string;
  params?: Record<string, string | number>;
}
export interface Template {
  name: string;
  steps: Step[];
}

export const availableActions = [
  { label: 'Open App', value: 'openApp' },
  { label: 'Close App', value: 'closeApp' },
  { label: 'Set Volume', value: 'setVolume' },
  { label: 'Run Routine', value: 'runRoutine' },
];

export function useWorkflowBuilder() {
  const [steps, setSteps] = useState<Step[]>([]);

  function addStep(action: string) {
    setSteps(prev => [...prev, { action }]);
  }

  function removeStep(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index));
  }

  function moveStep(from: number, to: number) {
    setSteps(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }

  function clearWorkflow() {
    setSteps([]);
  }

  function importTemplate(templateSteps: Step[]) {
    setSteps(templateSteps);
  }

  function editStep(index: number, params: Record<string, string | number>) {
    setSteps(prev => prev.map((step, i) => (i === index ? { ...step, params } : step)));
  }

  return {
    availableActions,
    steps,
    addStep,
    removeStep,
    moveStep,
    clearWorkflow,
    importTemplate,
    editStep,
  };
}
