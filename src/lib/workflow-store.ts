import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  apps: string[]; // app IDs used
  schedule?: {
    type: 'cron' | 'delayed' | 'once';
    value: string; // cron expression or timestamp
    nextRun?: number;
  };
  status: 'active' | 'paused' | 'completed' | 'running';
  lastRun?: number;
  runCount: number;
  createdAt: number;
  completedAt?: number;
  autoDelete?: boolean; // delete after completion (for one-time)
}

interface WorkflowStore {
  workflows: Workflow[];

  addWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'runCount' | 'status'>) => Workflow;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  pauseWorkflow: (id: string) => void;
  resumeWorkflow: (id: string) => void;
  markCompleted: (id: string) => void;
  markRunning: (id: string) => void;
  cleanupCompleted: () => void;
  getActiveWorkflows: () => Workflow[];
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      workflows: [],

      addWorkflow: (workflow) => {
        const newWorkflow: Workflow = {
          ...workflow,
          id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          status: 'active',
          runCount: 0,
          createdAt: Date.now(),
        };
        set((state) => ({
          workflows: [newWorkflow, ...state.workflows],
        }));
        return newWorkflow;
      },

      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
        }));
      },

      pauseWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, status: 'paused' } : w
          ),
        }));
      },

      resumeWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, status: 'active' } : w
          ),
        }));
      },

      markCompleted: (id) => {
        const workflow = get().workflows.find((w) => w.id === id);
        if (workflow?.schedule?.type === 'once' || workflow?.autoDelete) {
          // Mark as completed, will be cleaned up
          set((state) => ({
            workflows: state.workflows.map((w) =>
              w.id === id
                ? { ...w, status: 'completed', completedAt: Date.now(), runCount: w.runCount + 1 }
                : w
            ),
          }));
        } else {
          set((state) => ({
            workflows: state.workflows.map((w) =>
              w.id === id
                ? { ...w, status: 'active', lastRun: Date.now(), runCount: w.runCount + 1 }
                : w
            ),
          }));
        }
      },

      markRunning: (id) => {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, status: 'running' } : w
          ),
        }));
      },

      cleanupCompleted: () => {
        set((state) => ({
          workflows: state.workflows.filter(
            (w) => !(w.status === 'completed' && w.autoDelete)
          ),
        }));
      },

      getActiveWorkflows: () => {
        return get().workflows.filter(
          (w) => w.status === 'active' || w.status === 'running'
        );
      },
    }),
    {
      name: 'jungor-workflows',
    }
  )
);
