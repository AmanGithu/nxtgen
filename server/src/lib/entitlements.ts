/**
 * What each tier is allowed to do. THE server-side source of truth.
 *
 * The client has a mirror of this for rendering (showing a locked badge before
 * the user clicks), but the client copy is advisory only — every limit here is
 * enforced again in the request path, because anything checked solely in the
 * browser is bypassable by calling the API directly.
 *
 * Tier comes from the SUBSCRIPTION, never from the role. Being a student means
 * free courses and free use of the AI tools within the normal limits; it does
 * not grant premium templates, unlimited exports, or multiple résumés. Those
 * are paid regardless of who you are.
 */

export type Tier = 'guest' | 'free' | 'paid';

/** Countable actions. Values match ToolUsageLog.toolName so usage is one query. */
export const FEATURE = {
  EXPORT: 'resume_export',
  TAILOR: 'resume_ai_tailor',
  AI: 'ai_action',
} as const;

export interface Limits {
  /** Résumés that may exist at once. null = unlimited. */
  maxResumes: number | null;
  /** PDF/DOCX downloads per calendar month. null = unlimited. */
  maxExportsPerMonth: number | null;
  /** JD tailoring runs per calendar month. null = unlimited. */
  maxTailorsPerMonth: number | null;
  /** Generative AI calls per calendar month. null = unlimited. */
  maxAiPerMonth: number | null;
  canSave: boolean;
  canUsePremiumTemplates: boolean;
}

export const LIMITS: Record<Tier, Limits> = {
  /* Signed out. Full editing so the product can be felt, but nothing is
     persisted and nothing can be taken away. Guests are additionally capped
     per-browser and per-IP in guestQuota.ts. */
  guest: {
    maxResumes: 0,
    maxExportsPerMonth: 0,
    maxTailorsPerMonth: 0,
    maxAiPerMonth: 5,
    canSave: false,
    canUsePremiumTemplates: false,
  },
  /* Signed in, no paid plan — including students. */
  free: {
    maxResumes: 1,
    maxExportsPerMonth: 3,
    maxTailorsPerMonth: 3,
    maxAiPerMonth: 25,
    canSave: true,
    canUsePremiumTemplates: false,
  },
  paid: {
    maxResumes: null,
    maxExportsPerMonth: null,
    maxTailorsPerMonth: null,
    maxAiPerMonth: null,
    canSave: true,
    canUsePremiumTemplates: true,
  },
};

/** Subscription plans that unlock the paid tier. FREE is not one of them. */
export const PAID_PLANS = new Set(['BASIC', 'PRO', 'ENTERPRISE']);

/**
 * Start of the current calendar month, UTC.
 *
 * Monthly counters reset on the 1st. Fixed to UTC so the reset instant does
 * not drift with the server's timezone or move under DST.
 */
export function currentPeriodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Human copy for a blocked action, reused by the API error and the UI. */
export function limitMessage(feature: string, limit: number, tier: Tier): string {
  const upgrade = tier === 'free' ? ' Upgrade for unlimited.' : '';
  switch (feature) {
    case FEATURE.EXPORT:
      return `You've used all ${limit} downloads this month.${upgrade}`;
    case FEATURE.TAILOR:
      return `You've used all ${limit} JD tailoring runs this month.${upgrade}`;
    case FEATURE.AI:
      return `You've used all ${limit} AI actions this month.${upgrade}`;
    default:
      return `Monthly limit of ${limit} reached.${upgrade}`;
  }
}
