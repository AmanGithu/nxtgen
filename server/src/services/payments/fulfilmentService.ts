import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { parseSkuKey } from '../../lib/skus';

/**
 * Turns a settled payment into access.
 *
 * Called only from a verified webhook. Every path through here has to be safe
 * to run twice: both providers retry on any non-2xx response, and the same
 * "payment succeeded" event arriving a second time must not grant a second
 * month or a second seat.
 */

const addMonths = (from: Date, months: number) => {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

export class FulfilmentService {
  /**
   * Mark a payment settled and grant everything on it.
   *
   * Returns false when the payment was already settled, which is the normal
   * outcome of a redelivered webhook and not an error.
   */
  async settle(paymentId: string, providerRef?: string, providerSubscriptionId?: string): Promise<boolean> {
    /* The claim and the check are one statement. Reading the status and then
       updating it lets two concurrent deliveries both see PENDING and both
       proceed to grant — the exact double-grant this guards against. */
    const claimed = await prisma.$executeRaw`
      UPDATE Payment
         SET status = 'SUCCEEDED',
             paidAt = NOW(),
             providerRef = COALESCE(providerRef, ${providerRef ?? null})
       WHERE id = ${paymentId}
         AND status <> 'SUCCEEDED'
    `;

    if (claimed === 0) {
      logger.info(`[fulfilment] payment ${paymentId} already settled — ignoring redelivery`);
      return false;
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { items: true },
    });
    if (!payment) {
      logger.error(`[fulfilment] payment ${paymentId} vanished after being claimed`);
      return false;
    }

    for (const item of payment.items) {
      try {
        await this.grantItem(payment.userId, item, providerSubscriptionId);
      } catch (error) {
        /* One bad line must not abandon the rest — the money is already taken,
           so granting as much as possible and flagging the remainder beats
           granting nothing. */
        logger.error(`[fulfilment] failed to grant ${item.skuKey} on payment ${paymentId}:`, error);
        await prisma.payment.update({
          where: { id: paymentId },
          data: { failureReason: `Partial fulfilment: ${item.skuKey} failed. Manual review required.` },
        });
      }
    }

    logger.info(`[fulfilment] settled payment ${paymentId} (${payment.items.length} item(s)) for ${payment.userId}`);
    return true;
  }

  private async grantItem(
    userId: string,
    item: { skuKey: string; quantity: number; batchId: string | null },
    providerSubscriptionId?: string
  ) {
    const parsed = parseSkuKey(item.skuKey);
    if (!parsed) throw new Error(`Unrecognised skuKey ${item.skuKey}`);

    switch (parsed.type) {
      case 'PACKAGE':
        return this.grantPackage(userId, parsed.ref, providerSubscriptionId);
      case 'TOOL':
        return this.grantTool(userId, parsed.ref);
      case 'JOB_SUPPORT':
        return this.grantTool(userId, 'job_support');
      case 'BATCH':
        return this.grantBatchSeat(userId, item.batchId);
    }
  }

  /** Upsert the subscription rather than always creating: a user who upgrades
      should end up on one plan, not two overlapping ACTIVE rows. */
  private async grantPackage(userId: string, plan: string, providerSubscriptionId?: string) {
    const existing = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });

    /* Extend from whichever is later, exactly as tools do. Always setting
       now + 1 month would quietly shorten the plan of anyone who buys again
       before their current period is up — they would pay for a month and lose
       the days they had already paid for. */
    const base =
      existing?.currentPeriodEnd && existing.currentPeriodEnd > new Date()
        ? existing.currentPeriodEnd
        : new Date();
    const periodEnd = addMonths(base, 1);

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan: plan as any,
          provider: 'STRIPE',
          /* Without this the renewal and cancellation handlers, which look a
             subscription up by provider id, match nothing — every month after
             the first would silently fail to extend. */
          ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
          currentPeriodEnd: periodEnd,
          autoRenew: true,
          cancelAtPeriodEnd: false,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          plan: plan as any,
          status: 'ACTIVE',
          provider: 'STRIPE',
          ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
          currentPeriodEnd: periodEnd,
        },
      });
    }
  }

  /** Extends from the later of now and the current expiry, so buying again
      before a tool lapses adds a month rather than throwing one away. */
  private async grantTool(userId: string, toolKey: string) {
    const existing = await prisma.toolEntitlement.findUnique({
      where: { userId_toolKey: { userId, toolKey } },
    });

    const base =
      existing?.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date();
    const expiresAt = addMonths(base, 1);

    await prisma.toolEntitlement.upsert({
      where: { userId_toolKey: { userId, toolKey } },
      update: { expiresAt, source: 'PURCHASE' },
      create: { userId, toolKey, expiresAt, source: 'PURCHASE' },
    });
  }

  /**
   * Enrol the buyer in the batch they paid for.
   *
   * The seat is claimed here rather than reserved at checkout. Reserving would
   * avoid ever taking money for a seat that has gone, but it leaks seats on
   * every abandoned checkout unless expiry is also handled, and an abandoned
   * checkout is far more common than a simultaneous last-seat race. The
   * conditional UPDATE below still makes the race safe; what it cannot do is
   * make it free, so a loss is flagged loudly for a refund.
   */
  private async grantBatchSeat(userId: string, batchId: string | null) {
    if (!batchId) throw new Error('Batch purchase carried no batchId');

    const already = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId, studentId: userId } },
    });
    if (already) return; // Redelivery, or a repeat purchase of the same batch.

    const claimed = await prisma.$executeRaw`
      UPDATE Batch
         SET seatsTaken = seatsTaken + 1
       WHERE id = ${batchId}
         AND seatsTaken < maxStudents
    `;

    if (claimed === 0) {
      throw new Error(`Batch ${batchId} is full — payment taken, refund required`);
    }

    await prisma.batchStudent.create({ data: { batchId, studentId: userId } });

    /* A site user who buys a course has to be able to open the student area,
       which is gated on role. learning_proposal.md says students are created
       by an admin only; paying for a batch is the deliberate exception, since
       the alternative is taking someone's money for a dashboard they cannot
       reach. Admins are left alone — demoting one would be a lockout. */
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === 'SITE_USER') {
      await prisma.user.update({ where: { id: userId }, data: { role: 'STUDENT' } });
      logger.info(`[fulfilment] promoted ${userId} SITE_USER -> STUDENT on batch purchase`);
    }
  }

  /** Mark a payment failed. Nothing is granted, so there is nothing to undo. */
  async fail(paymentId: string, reason: string) {
    await prisma.payment.updateMany({
      where: { id: paymentId, status: { notIn: ['SUCCEEDED', 'REFUNDED'] } },
      data: { status: 'FAILED', failureReason: reason },
    });
    logger.warn(`[fulfilment] payment ${paymentId} failed: ${reason}`);
  }
}

export const fulfilmentService = new FulfilmentService();
