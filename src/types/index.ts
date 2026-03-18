export interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  connected: boolean;
  actions: AppAction[];
}

export interface AppAction {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  appActions?: AppActionResult[];
}

export interface AppActionResult {
  app: string;
  action: string;
  status: 'pending' | 'success' | 'error';
  result?: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: WorkflowAction[];
  enabled: boolean;
  createdAt: Date;
}

export interface WorkflowAction {
  appId: string;
  actionId: string;
  config: Record<string, unknown>;
}
