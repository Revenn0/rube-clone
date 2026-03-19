/**
 * Canonical app categories for marketplace filtering (matches product UI spec).
 * Order is the display order in the category sidebar (after "All").
 */

export const ALL_CATEGORY = 'All Categories' as const;

export const CANONICAL_CATEGORIES = [
  ALL_CATEGORY,
  'Featured',
  'Developer Tools',
  'Collaboration & Communication',
  'AI & ML',
  'File Management',
  'Project Management',
  'CRM',
  'Analytics & Data',
  'Entertainment & Media',
  'Productivity',
  'Education & LMS',
  'Design & Creative Tools',
  'Marketing & Social Media',
  'Scheduling & Booking',
  'E-commerce',
  'Finance & Accounting',
  'Security & Compliance',
  'Other / Miscellaneous',
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

/** Lucide icon name (PascalCase) for CategoryFilterPanel */
export const CATEGORY_ICONS: Record<string, string> = {
  [ALL_CATEGORY]: 'Store',
  Featured: 'Bookmark',
  'Developer Tools': 'Code2',
  'Collaboration & Communication': 'Users',
  'AI & ML': 'Bot',
  'File Management': 'Folder',
  'Project Management': 'BarChart3',
  CRM: 'Building2',
  'Analytics & Data': 'LineChart',
  'Entertainment & Media': 'Music',
  Productivity: 'Zap',
  'Education & LMS': 'GraduationCap',
  'Design & Creative Tools': 'Palette',
  'Marketing & Social Media': 'Megaphone',
  'Scheduling & Booking': 'Calendar',
  'E-commerce': 'ShoppingCart',
  'Finance & Accounting': 'DollarSign',
  'Security & Compliance': 'Shield',
  'Other / Miscellaneous': 'LayoutGrid',
};

/** Map slug keywords → Featured badge (optional spotlight) */
export const FEATURED_SLUG_KEYWORDS = [
  'gmail',
  'slack',
  'github',
  'notion',
  'openai',
  'googlecalendar',
  'linear',
];

const NORMALIZE_ENTRIES: Array<{ patterns: RegExp[]; category: CanonicalCategory }> = [
  { patterns: [/developer|devops|code|git|api|sdk/i], category: 'Developer Tools' },
  { patterns: [/communicat|collaborat|slack|teams|zoom|meet|chat|email|mail|message/i], category: 'Collaboration & Communication' },
  { patterns: [/ai|ml|machine learning|llm|openai|anthropic|gpt|copilot|agent/i], category: 'AI & ML' },
  { patterns: [/file|drive|storage|dropbox|folder|document/i], category: 'File Management' },
  { patterns: [/project|jira|asana|trello|task|sprint|issue/i], category: 'Project Management' },
  { patterns: [/crm|sales|hubspot|pipedrive|customer/i], category: 'CRM' },
  { patterns: [/analytic|data|bi|warehouse|metric|report/i], category: 'Analytics & Data' },
  { patterns: [/media|music|video|stream|entertainment|spotify/i], category: 'Entertainment & Media' },
  { patterns: [/productiv|workflow|automation|notion/i], category: 'Productivity' },
  { patterns: [/education|lms|learning|course|school|teach/i], category: 'Education & LMS' },
  { patterns: [/design|creative|figma|canva|figma|sketch/i], category: 'Design & Creative Tools' },
  { patterns: [/market|social|twitter|linkedin|instagram|ads|seo/i], category: 'Marketing & Social Media' },
  { patterns: [/schedul|book|calendar|appointment|cal\.com/i], category: 'Scheduling & Booking' },
  { patterns: [/e-?commerce|shopify|store|cart|payment portal/i], category: 'E-commerce' },
  { patterns: [/finance|account|billing|invoice|stripe|payroll|tax/i], category: 'Finance & Accounting' },
  { patterns: [/security|compliance|auth|sso|encrypt|vault/i], category: 'Security & Compliance' },
  // Legacy / broad buckets from apps.ts
  { patterns: [/^productivity$/i], category: 'Productivity' },
  { patterns: [/^communication$/i], category: 'Collaboration & Communication' },
  { patterns: [/^development$/i], category: 'Developer Tools' },
  { patterns: [/^social$/i], category: 'Marketing & Social Media' },
  { patterns: [/^finance$/i], category: 'Finance & Accounting' },
];

export function normalizeCategoryName(raw: string | undefined, slug?: string, name?: string): CanonicalCategory {
  if (!raw || !String(raw).trim()) {
    const hay = `${slug ?? ''} ${name ?? ''}`;
    for (const { patterns, category } of NORMALIZE_ENTRIES) {
      if (patterns.some((p) => p.test(hay))) return category;
    }
    return 'Other / Miscellaneous';
  }
  const s = raw.trim();
  // Exact canonical match
  const exact = CANONICAL_CATEGORIES.find((c) => c.toLowerCase() === s.toLowerCase());
  if (exact) return exact;

  for (const { patterns, category } of NORMALIZE_ENTRIES) {
    if (patterns.some((p) => p.test(s))) return category;
  }
  return 'Other / Miscellaneous';
}

export function isFeaturedSlug(slug: string, toolsCount: number): boolean {
  const lower = slug.toLowerCase();
  if (FEATURED_SLUG_KEYWORDS.some((k) => lower.includes(k))) return true;
  if (toolsCount >= 200) return true;
  return false;
}
