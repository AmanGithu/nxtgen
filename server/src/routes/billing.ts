import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { entitlementService } from '../services/entitlementService';
import { pricingService } from '../services/pricingService';
import { resolveDisplayCountry } from '../lib/geo';

const router = Router();

/**
 * Public price list, localised to the visitor.
 *
 * Registered above `authenticate` on purpose: the pricing page is the main
 * thing a signed-out visitor comes to look at, and requiring a login to see
 * what something costs would hide the product behind the paywall it is meant
 * to sell.
 *
 * `country` and `currency` are display hints only. Neither is trusted when the
 * charge is actually built — that comes from the billing address at checkout,
 * or anyone could pick the cheapest market from a dropdown.
 */
router.get('/pricing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = resolveDisplayCountry(req, (req.query.country as string) || null);
    const currency = (req.query.currency as string) || null;
    res.json({ success: true, ...(await pricingService.catalogue(country, currency)) });
  } catch (error) {
    next(error);
  }
});

router.use(authenticate);

/**
 * The old POST /upgrade granted a paid plan outright, with no payment taken —
 * a stopgap so the Upgrade button did not dead-end while checkout was being
 * built. It is gone now that money is actually collected: leaving a route that
 * awards a paid plan for free next to a live payment provider is a hole, and a
 * disabled flag is one deploy away from being switched back on by accident.
 *
 * Checkout lives at POST /checkout. Plans are granted only by a verified
 * webhook, never by a client call.
 */
router.post('/upgrade', (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('This endpoint has been replaced by /billing/checkout.', 410));
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
