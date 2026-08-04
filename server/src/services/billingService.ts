import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Credit accounting for AI tool actions.
 *
 * NxtGen tracks credits on CreditBalance (totalCredits granted, usedCredits
 * consumed) rather than MindSync's Stripe-backed ledger, so this charges
 * against that model and records the spend in ToolUsageLog — which is what
 * feeds the admin Tool Usage panel.
 */
export class BillingService {
  async chargeCredits(userId: string, amount: number, reason: string): Promise<void> {
    const balance = await prisma.creditBalance.findUnique({ where: { userId } });

    // No balance row means the user has never been granted credits. Treat that
    // as unlimited rather than blocking: gating is a product decision that
    // belongs with the subscription work, not silently here.
    if (!balance) {
      logger.debug(`[billing] no CreditBalance for ${userId}; skipping charge for ${reason}`);
      await this.recordUsage(userId, reason, amount);
      return;
    }

    /* Check-then-update is a race: two concurrent tool calls both read the
       same balance and both write, which MariaDB rejects with error 1020
       ("Record has changed since last read"). A single conditional UPDATE
       does the check and the decrement atomically — the WHERE clause is the
       balance check, so no transaction or retry is needed.

       Raw SQL because Prisma's `where` cannot compare two columns. */
    const updated = await prisma.$executeRaw`
      UPDATE CreditBalance
         SET usedCredits = usedCredits + ${amount}
       WHERE userId = ${userId}
         AND totalCredits - usedCredits >= ${amount}
    `;

    if (updated === 0) {
      const remaining = balance.totalCredits - balance.usedCredits;
      throw new AppError(
        `Not enough credits for this action. ${remaining} remaining, ${amount} required.`,
        402
      );
    }

    await this.recordUsage(userId, reason, amount);
    logger.debug(`[billing] charged ${amount} credit(s) to ${userId} for ${reason}`);
  }

  private async recordUsage(userId: string, toolName: string, creditsConsumed: number): Promise<void> {
    try {
      await prisma.toolUsageLog.create({
        data: { userId, toolName, creditsConsumed },
      });
    } catch (error) {
      // Usage logging is analytics, never a reason to fail the user's action.
      logger.error(`Failed to record tool usage for ${toolName}:`, error);
    }
  }
}
