/**
 * Toolkits where Composio often cannot return an OAuth URL (internal tools,
 * deprecated APIs, or browser connect not supported).
 */

const EXACT_SLUGS = new Set([
  'codeinterpreter',
  'composio_code',
  'composio_code_interpreter',
  'openai_code_interpreter',
  'openaicodes',
  'twitter',
  'twitterv2',
  'twitterdx',
  'x',
]);

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[_-\s]/g, '');
}

export function isKnownUnsupportedToolkit(slug: string): boolean {
  const lower = slug.toLowerCase();
  if (EXACT_SLUGS.has(lower)) return true;
  const n = normalizeSlug(slug);
  if (n.includes('codeinterpreter') || n.includes('openaicodes')) return true;
  if (lower === 'twitter' || lower.startsWith('twitter')) return true;
  if (n === 'x' || /^xcorp/.test(n)) return true;
  return false;
}
