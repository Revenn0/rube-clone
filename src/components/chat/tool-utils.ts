export type ToolPartForRender = {
  toolName: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

// ── Icons ────────────────────────────────────────────────────────────────────

export const APP_ICONS: Record<string, string> = {
  gmail: '📧',
  slack: '💬',
  github: '🐙',
  notion: '📝',
  google_calendar: '📅',
  linear: '📋',
  schedule: '📆',
  search: '🔍',
  workbench: '🖥️',
  execute: '⚡',
  multi_execute: '⚡',
  manage: '🔗',
  connection: '🔗',
  remote: '🖥️',
  sheets: '📊',
  drive: '📁',
  twitter: '🐦',
  discord: '🎮',
  jira: '🔵',
  asana: '🟠',
  trello: '🟦',
  salesforce: '☁️',
  hubspot: '🧲',
  airtable: '🗂️',
  zapier: '⚡',
  figma: '🎨',
};

// Brand colours for SVG graph nodes
export const APP_COLORS: Record<string, string> = {
  gmail: '#EA4335',
  slack: '#E01E5A',
  github: '#181717',
  notion: '#000000',
  google_calendar: '#4285F4',
  linear: '#5E6AD2',
  schedule: '#F59E0B',
  sheets: '#34A853',
  drive: '#4285F4',
  twitter: '#1DA1F2',
  discord: '#5865F2',
  jira: '#0052CC',
  asana: '#F06A6A',
  trello: '#0052CC',
  salesforce: '#00A1E0',
  figma: '#F24E1E',
};

export const FRIENDLY_NAMES: Record<string, { running: string; done: string }> = {
  search_tools: { running: 'Searching for tools...', done: 'Tools found' },
  multi_execute_tool: { running: 'Executing actions...', done: 'Actions completed' },
  manage_connections: { running: 'Managing connections...', done: 'Connections updated' },
  remote_workbench: { running: 'Processing...', done: 'Processing complete' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalize(toolName: string): string {
  return toolName.replace(/^COMPOSIO_/, '').toLowerCase();
}

export function getAppIcon(toolName: string): string {
  const n = normalize(toolName);
  for (const [key, icon] of Object.entries(APP_ICONS)) {
    if (n.includes(key)) return icon;
  }
  return '⚙️';
}

export function getAppColor(toolName: string): string {
  const n = normalize(toolName);
  for (const [key, color] of Object.entries(APP_COLORS)) {
    if (n.includes(key)) return color;
  }
  return '#6b7280';
}

export function getFriendlyInfo(toolName: string): { running: string; done: string; error: string } {
  const n = normalize(toolName);
  for (const [key, names] of Object.entries(FRIENDLY_NAMES)) {
    if (n.includes(key)) return { ...names, error: 'Something went wrong' };
  }
  const clean = n.replace(/_/g, ' ');
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return {
    running: `${capitalized}...`,
    done: `${capitalized} complete`,
    error: `Error in ${capitalized}`,
  };
}

export function getDisplayName(toolName: string): string {
  return toolName.replace(/^COMPOSIO_/, '').replace(/_/g, ' ').toUpperCase();
}

export function extractServiceFromTool(toolName: string): string {
  const n = normalize(toolName);
  const services = Object.keys(APP_ICONS);
  for (const s of services) {
    if (n.includes(s)) return s;
  }
  return 'default';
}

export function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}
