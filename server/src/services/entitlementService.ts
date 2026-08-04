import { prisma } from '../lib/prisma';
import { isPremiumTemplate } from '../lib/resumeTemplates';
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
  private async usedThisPeriod(userId: string, feature: string): Promise<number> {
    const row = await prisma.featureUsage.findUnique({
      where: {
        userId_feature_periodStart: { userId, feature, periodStart: currentPeriodStart() },
      },
      select: { used: true },
    });
    return row?.used ?? 0;
  }

  /**
   * Atomically claim one unit of `feature`, or return false if none is left.
   *
   * The check and the increment are a single statement. Doing it as
   * count-then-insert is a race: parallel requests all read the same count,
   * all decide they are under the limit, and the cap is bypassed by simply
   * firing requests concurrently.
   *
   * MariaDB affected-rows semantics carry the answer: 1 = inserted (first use),
   * 2 = the IF() actually incremented, 0 = it evaluated to the same value,
   * meaning the limit was already reached.
   */
  private async claim(userId: string, feature: string, limit: number): Promise<boolean> {
    const period = currentPeriodStart();

    // Make sure the counter row exists. INSERT IGNORE is a no-op if it does.
    await prisma.$executeRaw`
      INSERT IGNORE INTO FeatureUsage (id, userId, feature, periodStart, used, updatedAt)
      VALUES (UUID(), ${userId}, ${feature}, ${period}, 0, NOW(3))
    `;

    /* The WHERE clause IS the limit check, so the test and the increment are
       one statement and concurrent callers serialise on the row lock. A
       conditional UPDATE is used rather than upsert + affected-rows because
       the driver reports matched rows, not changed rows — under upsert that
       makes "declined to increment" indistinguishable from "incremented". */
    const updated = await prisma.$executeRaw`
      UPDATE FeatureUsage
         SET used = used + 1, updatedAt = NOW(3)
       WHERE userId = ${userId}
         AND feature = ${feature}
         AND periodStart = ${period}
         AND used < ${limit}
    `;
    return updated > 0;
  }

  /** Give back a claimed unit when the action itself then failed. */
  async release(userId: string, feature: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE FeatureUsage SET used = GREATEST(used - 1, 0)
       WHERE userId = ${userId} AND feature = ${feature} AND periodStart = ${currentPeriodStart()}
    `;
  }

  /** Everything the client needs to render locks and "2 of 3 left" copy. */
  async snapshot(userId: string): Promise<EntitlementSnapshot> {
    const tier = await this.tierFor(userId);
    const [resumes, exports, tailors, ai] = await Promise.all([
      prisma.resume.count({ where: { userId } }),
      this.usedThisPeriod(userId, FEATURE.EXPORT),
      this.usedThisPeriod(userId, FEATURE.TAILOR),
      this.usedThisPeriod(userId, FEATURE.AI),
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

    if (!(await this.claim(userId, feature, limit))) {
      throw new AppError(limitMessage(feature, limit, tier), 402, {
        code: 'LIMIT_REACHED',
        feature,
        limit,
        used: limit,
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

    if (!(await this.claim(userId, FEATURE.AI, limit))) {
      throw new AppError(limitMessage(FEATURE.AI, limit, tier), 402, {
        code: 'LIMIT_REACHED',
        feature: FEATURE.AI,
        limit,
        used: limit,
        tier,
      });
    }
  }

  /**
   * Run `create` only if the user may hold one more résumé.
   *
   * A period counter cannot be used here because résumés can be deleted, and a
   * monotonic count would keep blocking after one was removed. Instead the
   * count and the insert share a transaction, with the user row locked so
   * concurrent creates queue rather than all reading the same count.
   */
  async createWithinLimit<T>(userId: string, create: (tx: any) => Promise<T>): Promise<T> {
    const tier = await this.tierFor(userId);
    const max = LIMITS[tier].maxResumes;

    return prisma.$transaction(async (tx) => {
      if (max !== null) {
        await tx.$executeRaw`SELECT id FROM User WHERE id = ${userId} FOR UPDATE`;
        const count = await tx.resume.count({ where: { userId } });
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
      return create(tx);
    });
  }

  /**
   * Throw unless the user may use `template`.
   *
   * Checked on every path that can put a template onto a résumé — create,
   * update, version update — and again at export, because a résumé may still
   * carry a premium template applied while the account was on a paid plan (or
   * before students were correctly moved to the free tier).
   */
  async assertCanUseTemplate(userId: string, template?: string | null): Promise<void> {
    if (!isPremiumTemplate(template)) return;

    const tier = await this.tierFor(userId);
    if (LIMITS[tier].canUsePremiumTemplates) return;

    throw new AppError(
      `"${template}" is a premium template. Switch to a free template or upgrade to use it.`,
      402,
      { code: 'LIMIT_REACHED', feature: 'premium-template', template, tier }
    );
  }

  /**
   * Guard an export by the template the document is actually stored with.
   *
   * The write-path checks above stop a free user *applying* a premium
   * template, but a résumé can already carry one — applied while the account
   * was paid, or while students were incorrectly resolving to the paid tier.
   * Without this, that document stays exportable forever.
   */
  async assertResumeTemplateAllowed(userId: string, resumeId: string): Promise<void> {
    const r = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      select: { template: true },
    });
    if (r) await this.assertCanUseTemplate(userId, r.template);
  }

  async assertVersionTemplateAllowed(userId: string, versionId: string): Promise<void> {
    const v = await prisma.resumeVersion.findFirst({
      where: { id: versionId, resume: { userId } },
      select: { template: true },
    });
    if (v) await this.assertCanUseTemplate(userId, v.template);
  }

  /** Record one use of a counted feature. Must follow the successful action. */
  async recordUse(userId: string, feature: string, detail?: string): Promise<void> {
    await prisma.toolUsageLog.create({
      data: { userId, toolName: feature, inputSummary: detail ?? null, creditsConsumed: 1 },
    });
  }
}

export const entitlementService = new EntitlementService();
