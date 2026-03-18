// App detection and action mapping
export interface RequiredApp {
  id: string;
  name: string;
  icon: string;
  color: string;
  reason: string; // why this app is needed
}

export interface DetectedAction {
  description: string;
  apps: RequiredApp[];
  schedule?: {
    type: 'cron' | 'delayed';
    value: string; // cron expression or delay description
  };
}

// Keywords to detect apps
const APP_PATTERNS: Record<string, { keywords: string[]; app: RequiredApp }> = {
  gmail: {
    keywords: ['email', 'gmail', 'e-mail', 'inbox', 'correio', 'emails'],
    app: { id: 'gmail', name: 'Gmail', icon: '📧', color: '#EA4335', reason: 'Read and manage emails' },
  },
  google_sheets: {
    keywords: ['spreadsheet', 'planilha', 'sheet', 'sheets', 'excel', 'tabela'],
    app: { id: 'google_sheets', name: 'Google Sheets', icon: '📊', color: '#34A853', reason: 'Create and manage spreadsheets' },
  },
  teams: {
    keywords: ['teams', 'microsoft teams', 'ms teams'],
    app: { id: 'teams', name: 'Microsoft Teams', icon: '💜', color: '#6264A7', reason: 'Send notifications' },
  },
  slack: {
    keywords: ['slack', 'canal', 'channel'],
    app: { id: 'slack', name: 'Slack', icon: '💬', color: '#4A154B', reason: 'Send messages' },
  },
  github: {
    keywords: ['github', 'git hub', 'repo', 'pull request', 'pr ', 'issue', 'commit'],
    app: { id: 'github', name: 'GitHub', icon: '🐙', color: '#24292F', reason: 'Manage code repositories' },
  },
  notion: {
    keywords: ['notion', 'página', 'database'],
    app: { id: 'notion', name: 'Notion', icon: '📝', color: '#000000', reason: 'Manage pages and databases' },
  },
  google_calendar: {
    keywords: ['calendar', 'calendário', 'meeting', 'reunião', 'evento', 'event', 'agenda'],
    app: { id: 'google_calendar', name: 'Google Calendar', icon: '📅', color: '#4285F4', reason: 'Manage events and meetings' },
  },
  linear: {
    keywords: ['linear', 'tarefa', 'task', 'ticket'],
    app: { id: 'linear', name: 'Linear', icon: '📋', color: '#5E6AD2', reason: 'Manage tasks and issues' },
  },
  discord: {
    keywords: ['discord'],
    app: { id: 'discord', name: 'Discord', icon: '🎮', color: '#5865F2', reason: 'Send messages' },
  },
  twitter: {
    keywords: ['twitter', 'tweet', 'x.com'],
    app: { id: 'twitter', name: 'X (Twitter)', icon: '🐦', color: '#1DA1F2', reason: 'Post tweets' },
  },
  resend: {
    keywords: ['enviar email', 'send email', 'enviar e-mail'],
    app: { id: 'resend', name: 'Resend', icon: '✉️', color: '#000000', reason: 'Send transactional emails' },
  },
};

// Detect schedule from message
export function detectSchedule(text: string): DetectedAction['schedule'] | undefined {
  // Every day at X
  const dailyMatch = text.match(/todo dia|every day|daily|todos os dias/i);
  const timeMatch = text.match(/às?\s*(\d{1,2})[:h](\d{2})?\s*(am|pm|da manhã|da tarde|da noite)?/i);

  if (dailyMatch && timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();

    if (period === 'pm' || period === 'da tarde' || period === 'da noite') {
      if (hour < 12) hour += 12;
    }
    if (period === 'am' || period === 'da manhã') {
      if (hour === 12) hour = 0;
    }

    return {
      type: 'cron',
      value: `${minute} ${hour} * * *`,
    };
  }

  // Every hour
  if (text.match(/every hour|a cada hora|de hora em hora/i)) {
    return { type: 'cron', value: '0 * * * *' };
  }

  // Every week
  if (text.match(/every week|toda semana|semanal/i)) {
    return { type: 'cron', value: '0 9 * * 1' }; // Monday 9am
  }

  return undefined;
}

// Main detection function
export function detectRequiredApps(text: string): DetectedAction | null {
  const lowerText = text.toLowerCase();
  const detectedApps: RequiredApp[] = [];
  const seenIds = new Set<string>();

  for (const [, config] of Object.entries(APP_PATTERNS)) {
    for (const keyword of config.keywords) {
      if (lowerText.includes(keyword) && !seenIds.has(config.app.id)) {
        detectedApps.push(config.app);
        seenIds.add(config.app.id);
        break;
      }
    }
  }

  if (detectedApps.length === 0) return null;

  const schedule = detectSchedule(text);

  return {
    description: text,
    apps: detectedApps,
    schedule,
  };
}
