import { FEATURE } from './entitlements';

/**
 * Everything that can be bought, and the key it is priced under.
 *
 * `skuKey` is the join between a price row, a payment line and whatever gets
 * granted. Building it here rather than inline at call sites keeps the four
 * shapes from drifting — a typo'd "package:pro" silently finds no price and
 * the SKU quietly disappears from the pricing page.
 */

export type SkuType = 'PACKAGE' | 'TOOL' | 'BATCH' | 'JOB_SUPPORT';

export const skuKeyForPackage = (plan: string) => `package:${plan.toUpperCase()}`;
export const skuKeyForTool = (toolKey: string) => `tool:${toolKey}`;
export const skuKeyForCourse = (courseId: string) => `course:${courseId}`;
export const SKU_JOB_SUPPORT = 'job_support';

export const parseSkuKey = (skuKey: string): { type: SkuType; ref: string } | null => {
  if (skuKey === SKU_JOB_SUPPORT) return { type: 'JOB_SUPPORT', ref: '' };
  const [prefix, ...rest] = skuKey.split(':');
  const ref = rest.join(':');
  if (!ref) return null;
  if (prefix === 'package') return { type: 'PACKAGE', ref };
  if (prefix === 'tool') return { type: 'TOOL', ref };
  if (prefix === 'course') return { type: 'BATCH', ref };
  return null;
};

/**
 * Tools that can be bought individually.
 *
 * i-Assist and Live Interview are deliberately absent: the monetisation model
 * in learning_proposal.md puts those on credits rather than subscription,
 * because their per-use cost is real (voice, avatar, long LLM sessions) and a
 * flat monthly price cannot cover an unbounded number of sessions.
 */
export interface SellableTool {
  key: string;
  name: string;
  /** Metered features this tool lifts the free-tier cap on. */
  features: string[];
}

export const SELLABLE_TOOLS: SellableTool[] = [
  { key: 'resume_builder', name: 'AI Resume Builder', features: [FEATURE.ITERATION, FEATURE.EXPORT] },
  { key: 'ats_checker', name: 'ATS Score Checker', features: [] },
  { key: 'jd_tailor', name: 'JD Resume Tailor', features: [FEATURE.ITERATION] },
  { key: 'linkedin_analyser', name: 'LinkedIn Profile Analyser', features: [FEATURE.LINKEDIN] },
  { key: 'cover_letter', name: 'Cover Letter Builder', features: [] },
  { key: 'interview_prep', name: 'Interview Prep Kit', features: [FEATURE.INTERVIEW] },
];

export const TOOL_KEYS = SELLABLE_TOOLS.map((t) => t.key);

export const isSellableTool = (key: string) => TOOL_KEYS.includes(key);

/** Which tools grant a given metered feature, for the entitlement resolver. */
export const toolsGrantingFeature = (feature: string): string[] =>
  SELLABLE_TOOLS.filter((t) => t.features.includes(feature)).map((t) => t.key);
