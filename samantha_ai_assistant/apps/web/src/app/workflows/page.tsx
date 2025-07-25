'use client';
import { useWorkflowBuilder, Step, Template } from './useWorkflowBuilder';
import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TestResult {
  step: number;
  action: string;
  params?: Record<string, string | number>;
  result: 'Success' | 'Fail';
}

interface DraggableStepProps {
  id: string;
  index: number;
  step: Step;
  onRemove: (index: number) => void;
  onEdit: (index: number, params: Record<string, string | number>) => void;
}

function DraggableStep({ id, index, step, onRemove, onEdit }: DraggableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [editing, setEditing] = useState(false);
  const [params, setParams] = useState<Record<string, string | number>>(step.params || {});

  function handleSave() {
    onEdit(index, params);
    setEditing(false);
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col md:flex-row items-start md:items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2 w-full">
        <span className="font-mono cursor-grab">{index + 1}.</span>
        <span className="flex-1">{step.action}</span>
        <button
          className="px-2 py-1 rounded bg-yellow-500 text-white"
          onClick={() => setEditing(e => !e)}
        >{editing ? 'Cancel' : 'Edit'}</button>
        <button
          className="px-2 py-1 rounded bg-red-600 text-white"
          onClick={() => onRemove(index)}
        >Remove</button>
      </div>
      {editing && (
        <div className="flex flex-col gap-2 w-full md:w-auto">
          {step.action === 'openApp' || step.action === 'closeApp' ? (
            <label>
              App Name:
              <input
                className="ml-2 px-2 py-1 rounded bg-gray-200 dark:bg-gray-800"
                value={params.app as string || ''}
                onChange={e => setParams((p) => ({ ...p, app: e.target.value }))}
              />
            </label>
          ) : null}
          {step.action === 'setVolume' ? (
            <label>
              Volume:
              <input
                type="number"
                min={0}
                max={100}
                className="ml-2 px-2 py-1 rounded bg-gray-200 dark:bg-gray-800"
                value={params.value as number || ''}
                onChange={e => setParams((p) => ({ ...p, value: Number(e.target.value) }))}
              />
            </label>
          ) : null}
          <button className="px-2 py-1 rounded bg-blue-600 text-white mt-2" onClick={handleSave}>Save</button>
        </div>
      )}
      {step.params && (
        <div className="text-xs text-gray-500 mt-1">{JSON.stringify(step.params)}</div>
      )}
    </li>
  );
}

export default function WorkflowsPage() {
  const {
    availableActions,
    steps,
    addStep,
    removeStep,
    moveStep,
    clearWorkflow,
    importTemplate,
    editStep,
  } = useWorkflowBuilder();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  useEffect(() => {
    fetch('/api/workflow-templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates));
  }, []);

  // DnD-kit setup
  const sensors = useSensors(useSensor(PointerSensor));
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = steps.findIndex((_, i) => i === Number(active.id));
      const newIndex = steps.findIndex((_, i) => i === Number(over.id));
      moveStep(oldIndex, newIndex);
    }
  }

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {steps.map((step, i) => (
                <DraggableStep key={i} id={i.toString()} index={i} step={step} onRemove={removeStep} onEdit={editStep} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
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
          {templates.map((tpl, i) => (
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
