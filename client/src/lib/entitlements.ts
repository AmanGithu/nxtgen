/**
 * What a visitor is allowed to do, by tier.
 *
 * Three tiers, and the distinction that matters for the funnel is guest vs
 * free vs paid — not role. A signed-out visitor gets the full editing
 * experience so they can feel the product; the gates sit on the actions that
 * produce something they can take away (save, export) or that cost money
 * (premium templates, unlimited AI).
 */
export type Tier = 'guest' | 'free' | 'paid';

export interface Entitlements {
  tier: Tier;
  /** Persist work to the account. */
  canSave: boolean;
  /** Download PDF / DOCX. */
  canExport: boolean;
  /** Use the 7 templates flagged premium. */
  canUsePremiumTemplates: boolean;
  /** null = unlimited. */
  maxResumes: number | null;
  /** AI passes over a résumé per month (rewrite + summary + tailor). */
  maxIterations: number | null;
  /** LinkedIn profile analyses per month. */
  maxLinkedIn: number | null;
  /** Interview question generations per month. */
  maxInterview: number | null;
  /* Cover letters are intentionally absent — unlimited on every tier, because
     one résumé is sent to many companies. */
}

const GUEST: Entitlements = {
  tier: 'guest',
  canSave: false,
  canExport: false,
  canUsePremiumTemplates: false,
  maxResumes: 0,
  maxIterations: 5,
  maxLinkedIn: 2,
  maxInterview: 2,
};

const FREE: Entitlements = {
  tier: 'free',
  canSave: true,
  /* Free users get a small number of real downloads rather than none — they
     leave with a CV, which is what makes the paid tier worth buying. The
     count is enforced server-side; this flag only controls the UI. */
  canExport: true,
  canUsePremiumTemplates: false,
  maxResumes: 1,
  maxIterations: 10,
  maxLinkedIn: 10,
  maxInterview: 10,
};

const PAID: Entitlements = {
  tier: 'paid',
  canSave: true,
  canExport: true,
  canUsePremiumTemplates: true,
  maxResumes: null,
  maxIterations: null,
  maxLinkedIn: null,
  maxInterview: null,
};

/** Plans that unlock the paid tier. FREE is not one of them. */
const PAID_PLANS = new Set(['BASIC', 'PRO', 'ENTERPRISE']);

/**
 * Tier comes from the subscription, NOT the role.
 *
 * Enrolling in a batch buys the course; it does not buy the premium résumé
 * features. A student is a free user of the toolkit — same one résumé, same
 * capped exports — until they pay for a plan. Only staff are unrestricted,
 * so they can reproduce and support any account.
 */
export const entitlementsFor = (
  isAuthenticated: boolean,
  plan?: string | null,
  role?: string | null
): Entitlements => {
  if (!isAuthenticated) return GUEST;
  if (role === 'admin') return PAID;
  return PAID_PLANS.has((plan || '').toUpperCase()) ? PAID : FREE;
};

/** Why a gated action is blocked, phrased for the upsell prompt. */
export const gateReason = (tier: Tier, action: 'save' | 'export' | 'premium-template' | 'extra-resume') => {
  if (tier === 'guest') {
    return action === 'export'
      ? { title: 'Sign in to download', body: 'Create a free account to export your résumé as PDF or DOCX.' }
      : { title: 'Sign in to save', body: "Your work is kept in this browser. Sign in free and we'll move it to your account." };
  }
  switch (action) {
    case 'export':
      return { title: 'Upgrade to export', body: 'PDF and DOCX downloads are part of a paid plan.' };
    case 'premium-template':
      return { title: 'Premium template', body: 'This template is available on a paid plan.' };
    case 'extra-resume':
      return { title: 'One résumé on the free plan', body: 'Upgrade to keep multiple résumés and tailored versions.' };
    default:
      return { title: 'Upgrade required', body: 'This feature is part of a paid plan.' };
  }
};
