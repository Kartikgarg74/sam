'use client';
import { useWorkflowBuilder, Step, Template } from './useWorkflowBuilder';
import { useEffect, useState } from 'react';

interface TestResult {
  step: number;
  action: string;
  params?: Record<string, string | number>;
  result: 'Success' | 'Fail';
}

interface StepProps {
  index: number;
  step: Step;
  onRemove: (index: number) => void;
  onEdit: (index: number, params: Record<string, string | number>) => void;
}

function SimpleStep({ index, step, onRemove, onEdit }: StepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [params, setParams] = useState(step.params || {});

  function handleSave() {
    onEdit(index, params);
    setIsEditing(false);
  }

  return (
    <div className="p-3 border rounded bg-gray-50 dark:bg-gray-700">
      <div className="flex justify-between items-center">
        <span className="font-medium">Step {index + 1}: {step.action}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => onRemove(index)}
            className="px-2 py-1 text-sm bg-red-600 text-white rounded"
          >
            Remove
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-2">
          <input
            type="text"
            value={JSON.stringify(params)}
            onChange={(e) => setParams(JSON.parse(e.target.value || '{}'))}
            className="w-full p-2 border rounded"
            placeholder="Parameters (JSON)"
          />
          <button
            onClick={handleSave}
            className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
          >
            Save
          </button>
        </div>
      )}

      {!isEditing && step.params && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Params: {JSON.stringify(step.params)}
        </div>
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  const {
    steps,
    addStep,
    removeStep,
    editStep,
    clearWorkflow,
    moveStep,
    importTemplate,
  } = useWorkflowBuilder();

  const [templates, setTemplates] = useState<Template[]>([]);

  const availableActions = [
    { value: 'navigate', label: 'Navigate' },
    { value: 'click', label: 'Click' },
    { value: 'type', label: 'Type' },
    { value: 'wait', label: 'Wait' },
    { value: 'screenshot', label: 'Screenshot' },
  ];

  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  useEffect(() => {
    fetch('/api/workflow-templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates));
  }, []);

  function handleTestWorkflow() {
    // Simulate running each step (random success/fail)
    const results: TestResult[] = steps.map((step, i) => ({
      step: i + 1,
      action: step.action,
      params: step.params,
      result: Math.random() > 0.1 ? 'Success' : 'Fail',
    }));
    setTestResults(results);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Workflow Builder</h1>
      <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="font-semibold mb-2">Visual Builder</h2>
        <div className="flex gap-4 mb-4">
          {availableActions.map(a => (
            <button
              key={a.value}
              className="px-3 py-1 rounded bg-blue-600 text-white"
              onClick={() => addStep(a.value)}
            >
              {a.label}
            </button>
          ))}
          <button className="px-3 py-1 rounded bg-gray-400 text-white" onClick={clearWorkflow}>
            Clear
          </button>
          <button className="px-3 py-1 rounded bg-green-700 text-white" onClick={handleTestWorkflow}>
            Test Workflow
          </button>
        </div>

        <ul className="space-y-2">
          {steps.map((step, i) => (
            <SimpleStep key={i} index={i} step={step} onRemove={removeStep} onEdit={editStep} />
          ))}
        </ul>

        {testResults && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Test Results</h3>
            <ul className="space-y-1">
              {testResults.map((res, i) => (
                <li key={i} className={res.result === 'Success' ? 'text-green-600' : 'text-red-600'}>
                  Step {res.step}: {res.action} {res.params ? JSON.stringify(res.params) : ''}  {res.result}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="font-semibold mb-2">Template Library</h2>
        <div className="flex gap-4 flex-wrap">
          {templates.map((tpl: Template, i: number) => (
            <button
              key={i}
              className="px-3 py-1 rounded bg-green-600 text-white"
              onClick={() => importTemplate(tpl.steps)}
            >
              Import: {tpl.name}
            </button>
          ))}
        </div>
      </section>

      <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="font-semibold mb-2">Service Integration</h2>
        <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">[Service connection/config]</div>
      </section>

      <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="font-semibold mb-2">Testing & Validation</h2>
        <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">[Workflow testing tools]</div>
      </section>
    </div>
  );
}
