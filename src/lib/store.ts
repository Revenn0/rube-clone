import { create } from 'zustand';
import { App, ChatMessage, Workflow } from '@/types';

interface AppStore {
  apps: App[];
  connectedApps: string[];
  connectApp: (appId: string) => void;
  disconnectApp: (appId: string) => void;
  setApps: (apps: App[]) => void;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

interface WorkflowStore {
  workflows: Workflow[];
  addWorkflow: (workflow: Workflow) => void;
  toggleWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  apps: [],
  connectedApps: [],
  connectApp: (appId) =>
    set((state) => ({
      connectedApps: [...state.connectedApps, appId],
    })),
  disconnectApp: (appId) =>
    set((state) => ({
      connectedApps: state.connectedApps.filter((id) => id !== appId),
    })),
  setApps: (apps) => set({ apps }),
}));

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
}));

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflows: [],
  addWorkflow: (workflow) =>
    set((state) => ({ workflows: [...state.workflows, workflow] })),
  toggleWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      ),
    })),
  deleteWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
    })),
}));
