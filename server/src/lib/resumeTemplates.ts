/**
 * Which résumé templates are premium.
 *
 * Mirrors `client/src/lib/resume/templates.ts` — the client copy carries the
 * labels, blurbs and thumbnails needed to draw the picker, while this one only
 * needs the entitlement split. The two lists must agree; if a template is
 * added, add it here too or it silently becomes free.
 *
 * The DB's ResumeTemplate table is a separate, admin-managed catalogue and is
 * NOT what the résumé builder uses, so it must not be consulted for this.
 */

export const FREE_TEMPLATES = ['classic', 'modern', 'compact'] as const;

export const PREMIUM_TEMPLATES = [
  'executive',
  'elegant',
  'developer',
  'sidebar',
  'split',
  'corporate',
  'bold',
] as const;

const PREMIUM = new Set<string>(PREMIUM_TEMPLATES);

export function isPremiumTemplate(id?: string | null): boolean {
  return !!id && PREMIUM.has(id);
}

/** Fallback applied when a template is not allowed. Always free, always safe. */
export const DEFAULT_TEMPLATE = 'classic';
