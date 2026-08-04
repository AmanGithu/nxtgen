import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  Tier,
  Limits,
  LIMITS,
  PAID_PLANS,
  FEATURE,
  currentPeriodStart,
  limitMessage,
} from '../lib/entitlements';

export interface EntitlementSnapshot {
  tier: Tier;
  limits: Limits;
  used: { resumes: number; exports: number; tailors: number; ai: number };
  /** When the monthly counters next reset, ISO. */
  resetsAt: string;
}

/**
 * Resolves a user's tier and enforces the limits attached to it.
 *
 * Usage is counted from ToolUsageLog rather than kept in a counter column, so
 * there is no separate number to drift out of step with reality, and the
 * monthly reset needs no scheduled job — the window is just part of the query.
 */
export class EntitlementService {
  /** Tier from the subscription. Role is deliberately not consulted here. */
  async tierFor(userId: string): Promise<Tier> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return 'guest';

    /* Staff are unrestricted so they can reproduce and support any account.
       This is the only place a role affects entitlements. */
    if (user.role === 'ADMIN') return 'paid';

    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
      orderBy: { startDate: 'desc' },
      select: { plan: true },
    });

    return sub && PAID_PLANS.has(sub.plan) ? 'paid' : 'free';
  }

  /** How many times a counted feature has been used this period. */
  private async usedThisPeriod(userId: string, toolName: string): Promise<number> {
    return prisma.toolUsageLog.count({
      where: { userId, toolName, createdAt: { gte: currentPeriodStart() } },
    });
  }

  /** Everything the client needs to render locks and "2 of 3 left" copy. */
  async snapshot(userId: string): Promise<EntitlementSnapshot> {
    const tier = await this.tierFor(userId);
    const [resumes, exports, tailors, ai] = await Promise.all([
      prisma.resume.count({ where: { userId } }),
      this.usedThisPeriod(userId, FEATURE.EXPORT),
      this.usedThisPeriod(userId, FEATURE.TAILOR),
      prisma.toolUsageLog.count({
        where: {
          userId,
          toolName: { startsWith: 'resume_ai_' },
          createdAt: { gte: currentPeriodStart() },
        },
      }),
    ]);

    const next = currentPeriodStart();
    next.setUTCMonth(next.getUTCMonth() + 1);

    return {
      tier,
      limits: LIMITS[tier],
      used: { resumes, exports, tailors, ai },
      resetsAt: next.toISOString(),
    };
  }

  /**
   * Throw unless the user may perform `feature` once more.
   *
   * Called at the top of the handler, before any expensive work (PDF render,
   * model call) so a blocked request costs nothing.
   */
  async assertWithinLimit(userId: string, feature: string): Promise<void> {
    const tier = await this.tierFor(userId);
    const limits = LIMITS[tier];

    const limit =
      feature === FEATURE.EXPORT
        ? limits.maxExportsPerMonth
        : feature === FEATURE.TAILOR
          ? limits.maxTailorsPerMonth
          : limits.maxAiPerMonth;

    if (limit === null) return; // unlimited

    const used = await this.usedThisPeriod(userId, feature);
    if (used >= limit) {
      throw new AppError(limitMessage(feature, limit, tier), 402, {
        code: 'LIMIT_REACHED',
        feature,
        limit,
        used,
        tier,
      });
    }
  }

  /**
   * Throw unless the user has AI allowance left this period.
   *
   * Separate from assertWithinLimit because AI usage is spread across several
   * toolNames (resume_ai_summary, resume_ai_rewrite, …) and has to be counted
   * as one pooled allowance rather than per-tool.
   */
  async assertAiWithinLimit(userId: string): Promise<void> {
    const tier = await this.tierFor(userId);
    const limit = LIMITS[tier].maxAiPerMonth;
    if (limit === null) return;

    const used = await prisma.toolUsageLog.count({
      where: {
        userId,
        toolName: { startsWith: 'resume_ai_' },
        createdAt: { gte: currentPeriodStart() },
      },
    });
    if (used >= limit) {
      throw new AppError(limitMessage(FEATURE.AI, limit, tier), 402, {
        code: 'LIMIT_REACHED',
        feature: FEATURE.AI,
        limit,
        used,
        tier,
      });
    }
  }

  /** Throw unless the user may hold one more résumé. */
  async assertCanCreateResume(userId: string): Promise<void> {
    const tier = await this.tierFor(userId);
    const max = LIMITS[tier].maxResumes;
    if (max === null) return;

    const count = await prisma.resume.count({ where: { userId } });
    if (count >= max) {
      throw new AppError(
        max === 1
          ? 'The free plan keeps one résumé. Upgrade to store more, or delete the existing one.'
          : `You've reached the ${max}-résumé limit on your plan.`,
        402,
        { code: 'LIMIT_REACHED', feature: 'resumes', limit: max, used: count, tier }
      );
    }
  }

  /** Throw unless the user may use a PREMIUM template. */
  async assertCanUseTemplate(userId: string, templateId?: string | null): Promise<void> {
    if (!templateId) return;
    const template = await prisma.resumeTemplate.findUnique({
      where: { id: templateId },
      select: { category: true, name: true },
    });
    if (!template || template.category !== 'PREMIUM') return;

    const tier = await this.tierFor(userId);
    if (!LIMITS[tier].canUsePremiumTemplates) {
      throw new AppError(`"${template.name}" is a premium template.`, 402, {
        code: 'LIMIT_REACHED',
        feature: 'premium-template',
        tier,
      });
    }
  }

  /** Record one use of a counted feature. Must follow the successful action. */
  async recordUse(userId: string, feature: string, detail?: string): Promise<void> {
    await prisma.toolUsageLog.create({
      data: { userId, toolName: feature, inputSummary: detail ?? null, creditsConsumed: 1 },
    });
  }
}

export const entitlementService = new EntitlementService();
