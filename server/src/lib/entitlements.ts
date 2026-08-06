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

/** Countable actions. Each has its own allowance rather than sharing a pool. */
export const FEATURE = {
  EXPORT: 'resume_export',
  /** AI passes over a résumé — rewrite, summary, tailor. Capped together
      because they are all "another go at the same document". */
  ITERATION: 'resume_iteration',
  LINKEDIN: 'linkedin_analyse',
  INTERVIEW: 'interview_prep',
  /* Cover letters are deliberately absent: one résumé is sent to many
     companies, so metering them would penalise the normal way the tool is
     used. They stay unlimited on every tier. */
} as const;

export interface Limits {
  /** Résumés that may exist at once. null = unlimited. */
  maxResumes: number | null;
  /** PDF/DOCX downloads per calendar month. null = unlimited. */
  maxExportsPerMonth: number | null;
  /** AI passes over a résumé per month (rewrite + summary + tailor). */
  maxIterationsPerMonth: number | null;
  /** LinkedIn profile analyses per month. */
  maxLinkedInPerMonth: number | null;
  /** Interview question generations per month. */
  maxInterviewPerMonth: number | null;
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
    maxIterationsPerMonth: 5,
    maxLinkedInPerMonth: 2,
    maxInterviewPerMonth: 2,
    canSave: false,
    canUsePremiumTemplates: false,
  },
  /* Signed in, no paid plan — including students. */
  free: {
    maxResumes: 1,
    maxExportsPerMonth: 3,
    maxIterationsPerMonth: 10,
    maxLinkedInPerMonth: 10,
    maxInterviewPerMonth: 10,
    canSave: true,
    canUsePremiumTemplates: false,
  },
  paid: {
    maxResumes: null,
    maxExportsPerMonth: null,
    maxIterationsPerMonth: null,
    maxLinkedInPerMonth: null,
    maxInterviewPerMonth: null,
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
    case FEATURE.ITERATION:
      return `You've used all ${limit} résumé AI iterations this month.${upgrade}`;
    case FEATURE.LINKEDIN:
      return `You've used all ${limit} LinkedIn analyses this month.${upgrade}`;
    case FEATURE.INTERVIEW:
      return `You've used all ${limit} interview question sets this month.${upgrade}`;
    default:
      return `Monthly limit of ${limit} reached.${upgrade}`;
  }
}
