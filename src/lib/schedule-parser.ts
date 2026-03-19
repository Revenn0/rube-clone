export interface ParsedSchedule {
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  matched: boolean;
}

const TIME_PATTERNS = [
  /(\d{1,2})\s*[h:]\s*(\d{0,2})/i,
  /(\d{1,2})\s*(?:da\s+)?manh[ãa]/i,
  /(\d{1,2})\s*(?:da\s+)?tarde/i,
  /(\d{1,2})\s*(?:da\s+)?noite/i,
  /(?:at|às?|as)\s*(\d{1,2})\s*[h:.]?\s*(\d{0,2})/i,
  /(\d{1,2}):(\d{2})/,
  /(\d{1,2})\s*[ap]\.?m\.?/i,
  /every\s+(?:day\s+)?at\s+(\d{1,2}):?(\d{0,2})/i,
  /(\d{1,2})\s*o\'?clock/i,
];

const DAILY_PATTERNS = [
  /\b(?:todos?\s+os?\s+dias?|every\s+day|daily|diariamente|diario)\b/i,
  /\b(?:toda\s+manh[ãa]|every\s+morning)\b/i,
  /\b(?:todo\s+dia)\b/i,
];

const WEEKLY_PATTERNS = [
  /\b(?:toda\s+semana|every\s+week|weekly|semanalmente)\b/i,
  /\b(?:toda\s+segunda|every\s+monday|mondays?)\b/i,
  /\b(?:toda\s+ter[cç]a|tuesdays?)\b/i,
  /\b(?:toda\s+quarta|wednesdays?)\b/i,
  /\b(?:toda\s+quinta|thursdays?)\b/i,
  /\b(?:toda\s+sexta|fridays?)\b/i,
];

const MONTHLY_PATTERNS = [
  /\b(?:todo\s+mes|every\s+month|monthly|mensalmente)\b/i,
  /\b(?:primeiro\s+dia\s+do\s+mes|1[ºo]?\s+dia)\b/i,
  /\b(?:dia\s+1\s+de\s+cada\s+mes)\b/i,
];

function parseTime(text: string): string | null {
  for (const pat of TIME_PATTERNS) {
    const m = text.match(pat);
    if (m) {
      let h = parseInt(m[1], 10) || 9;
      let min = parseInt(m[2], 10) || 0;
      if (h > 23) h = 23;
      if (min > 59) min = 59;
      const pm = /tarde|noite|p\.?m\.?/i.test(text) && h < 12;
      if (pm) h += 12;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }
  if (/\b(?:manh[ãa]|morning)\b/i.test(text)) return '09:00';
  if (/\b(?:tarde|afternoon)\b/i.test(text)) return '14:00';
  if (/\b(?:noite|evening)\b/i.test(text)) return '18:00';
  return null;
}

function parseFrequency(text: string): 'daily' | 'weekly' | 'monthly' | 'custom' {
  for (const pat of MONTHLY_PATTERNS) {
    if (pat.test(text)) return 'monthly';
  }
  for (const pat of WEEKLY_PATTERNS) {
    if (pat.test(text)) return 'weekly';
  }
  for (const pat of DAILY_PATTERNS) {
    if (pat.test(text)) return 'daily';
  }
  return 'custom';
}

export function parseNaturalSchedule(text: string): ParsedSchedule {
  if (!text || text.trim().length < 5) {
    return { schedule: 'daily', time: '09:00', matched: false };
  }

  const t = text.trim();
  const schedule = parseFrequency(t);
  const time = parseTime(t) ?? '09:00';
  const matched = schedule !== 'custom' || time !== '09:00';

  return { schedule, time, matched };
}
