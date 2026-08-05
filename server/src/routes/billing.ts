import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { entitlementService } from '../services/entitlementService';

const router = Router();
router.use(authenticate);

/**
 * Self-serve upgrade — a STOPGAP until real payment collection exists.
 *
 * There is no checkout yet, so "Upgrade" grants the plan outright rather than
 * dead-ending the user at a pricing page they cannot act on. That means any
 * signed-in account can award itself a paid plan, which is obviously not
 * acceptable once money is involved: it is therefore gated on
 * ALLOW_SELF_UPGRADE, which must be turned off in the same change that wires
 * up a payment provider.
 */
router.post('/upgrade', async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    if (!env.ALLOW_SELF_UPGRADE) {
      throw new AppError('Upgrades are not available yet. Please contact support.', 503);
    }

    const userId = req.user.id;
    const plan = 'PRO' as const;

    const existing = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });

    if (existing) {
      await prisma.subscription.update({ where: { id: existing.id }, data: { plan } });
    } else {
      await prisma.subscription.create({
        data: { userId, plan, status: 'ACTIVE', startDate: new Date() },
      });
    }

    // Loud on purpose: every one of these is revenue that was not collected.
    logger.warn(`[billing] SELF-UPGRADE granted ${plan} to ${req.user.email} — no payment taken`);

    res.json({
      success: true,
      message: 'Your plan is active. Everything is unlocked.',
      ...(await entitlementService.snapshot(userId)),
    });
  } catch (error) {
    next(error);
  }
});

/** Current tier, limits and usage — drives the counters and lock states. */
router.get('/entitlements', async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, ...(await entitlementService.snapshot(req.user.id)) });
  } catch (error) {
    next(error);
  }
});

export default router;
