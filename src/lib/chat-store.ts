import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  connectLinks?: Array<{ app: string; url: string; connected?: boolean }>;
  isExecuting?: boolean;
}

interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  initialized: boolean;

  setSessionId: (id: string) => void;
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (init: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessionId: null,
      messages: [],
      isLoading: false,
      initialized: false,

      setSessionId: (id) => set({ sessionId: id }),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateMessage: (id, updates) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: (init) => set({ initialized: init }),
      clearMessages: () => set({ messages: [], sessionId: null, initialized: false }),
    }),
    { name: 'rube-chat-state' }
  )
);
