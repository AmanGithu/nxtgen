import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, UserRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';
import { SUPPORTED_CURRENCIES, isSupportedCurrency, formatAmount, type Currency } from '../lib/currency';
import { SELLABLE_TOOLS, parseSkuKey } from '../lib/skus';

/**
 * Price administration.
 *
 * Deliberately its own router rather than more endpoints in admin.ts: that
 * file is already ~1300 lines and its uniform `catch (error) { next(error) }`
 * blocks have caused git to align unrelated handlers during a merge and
 * produce code that did not parse. New surface area goes in its own file.
 *
 * Every write is audited. Prices are the one setting where "who changed this
 * and when" is a question someone will eventually need answered against real
 * money, so a silent edit is not acceptable.
 */

const router = Router();
router.use(authenticate, authorize(UserRole.ADMIN));

const recordAudit = async (req: Request, action: string, targetId?: string, payload?: unknown) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.id ?? null,
        action,
        targetModel: 'Price',
        targetId,
        payload: payload === undefined ? undefined : (payload as any),
        ipAddress: req.ip,
      },
    });
  } catch (error) {
    logger.error(`Failed to write audit log for ${action}:`, error);
  }
};

/** Human label for a SKU key, so the editor is readable without a lookup. */
const labelFor = async (skuKey: string): Promise<string> => {
  const parsed = parseSkuKey(skuKey);
  if (!parsed) return skuKey;
  if (parsed.type === 'JOB_SUPPORT') return 'Job Support';
  if (parsed.type === 'PACKAGE') return `${parsed.ref.charAt(0)}${parsed.ref.slice(1).toLowerCase()} package`;
  if (parsed.type === 'TOOL') return SELLABLE_TOOLS.find((t) => t.key === parsed.ref)?.name ?? parsed.ref;
  const course = await prisma.course.findUnique({ where: { id: parsed.ref }, select: { title: true } });
  return course ? `${course.title} (course)` : `Course ${parsed.ref.slice(0, 8)}`;
};

/** Full price grid, grouped by SKU so the editor renders one row per product
    with a column per currency. */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.price.findMany({ orderBy: [{ skuType: 'asc' }, { skuKey: 'asc' }, { currency: 'asc' }] });

    const grouped = new Map<string, any>();
    for (const row of rows) {
      if (!grouped.has(row.skuKey)) {
        grouped.set(row.skuKey, {
          skuKey: row.skuKey,
          skuType: row.skuType,
          label: await labelFor(row.skuKey),
          interval: row.interval,
          prices: [],
        });
      }
      grouped.get(row.skuKey).prices.push({
        id: row.id,
        currency: row.currency,
        amountMinor: row.amountMinor,
        formatted: formatAmount(row.amountMinor, row.currency as Currency),
        taxBehavior: row.taxBehavior,
        isActive: row.isActive,
      });
    }

    res.json({
      success: true,
      currencies: SUPPORTED_CURRENCIES,
      skus: Array.from(grouped.values()),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Change one price.
 *
 * Amount arrives in minor units so the admin UI, not this handler, owns the
 * decimal arithmetic — parsing "299.00" server-side is where rounding bugs get
 * into money.
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amountMinor, isActive, taxBehavior } = req.body ?? {};

    const priceId = String(req.params.id);
    const existing = await prisma.price.findUnique({ where: { id: priceId } });
    if (!existing) throw new AppError('Price not found', 404);

    const data: Record<string, unknown> = {};

    if (amountMinor !== undefined) {
      if (!Number.isInteger(amountMinor) || amountMinor < 0) {
        throw new AppError('amountMinor must be a non-negative integer in minor units (29900 = ₹299.00)', 400);
      }
      data.amountMinor = amountMinor;
    }
    if (isActive !== undefined) data.isActive = !!isActive;
    if (taxBehavior !== undefined) {
      if (!['INCLUSIVE', 'EXCLUSIVE'].includes(taxBehavior)) {
        throw new AppError('taxBehavior must be INCLUSIVE or EXCLUSIVE', 400);
      }
      data.taxBehavior = taxBehavior;
    }

    if (!Object.keys(data).length) throw new AppError('Nothing to update', 400);

    const updated = await prisma.price.update({ where: { id: priceId }, data });

    /* Log the before and after together — "changed to ₹399" is not much use
       six months later without knowing what it changed from. */
    await recordAudit(req, 'price.update', updated.id, {
      skuKey: updated.skuKey,
      currency: updated.currency,
      from: { amountMinor: existing.amountMinor, isActive: existing.isActive, taxBehavior: existing.taxBehavior },
      to: { amountMinor: updated.amountMinor, isActive: updated.isActive, taxBehavior: updated.taxBehavior },
    });

    logger.info(
      `[pricing] ${updated.skuKey} ${updated.currency} ${existing.amountMinor} -> ${updated.amountMinor} by ${(req as any).user?.email}`
    );

    res.json({
      success: true,
      price: { ...updated, formatted: formatAmount(updated.amountMinor, updated.currency as Currency) },
    });
  } catch (error) {
    next(error);
  }
});

/** Add a price for a SKU in a currency that does not have one yet. */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skuKey, currency, amountMinor, interval, taxBehavior } = req.body ?? {};

    const parsed = typeof skuKey === 'string' ? parseSkuKey(skuKey) : null;
    if (!parsed) throw new AppError('Unrecognised skuKey', 400);
    if (!isSupportedCurrency(currency)) {
      throw new AppError(`currency must be one of ${SUPPORTED_CURRENCIES.join(', ')}`, 400);
    }
    if (!Number.isInteger(amountMinor) || amountMinor < 0) {
      throw new AppError('amountMinor must be a non-negative integer in minor units', 400);
    }
    if (!['MONTH', 'YEAR', 'ONE_TIME'].includes(interval)) {
      throw new AppError('interval must be MONTH, YEAR or ONE_TIME', 400);
    }

    const created = await prisma.price.create({
      data: {
        skuKey,
        skuType: parsed.type,
        currency: currency.toUpperCase(),
        amountMinor,
        interval,
        taxBehavior: taxBehavior === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE',
      },
    });

    await recordAudit(req, 'price.create', created.id, {
      skuKey: created.skuKey,
      currency: created.currency,
      amountMinor: created.amountMinor,
    });

    res.status(201).json({
      success: true,
      price: { ...created, formatted: formatAmount(created.amountMinor, created.currency as Currency) },
    });
  } catch (error: any) {
    /* The (skuKey, currency, interval) unique key is what stops two live
       prices for the same thing, so a collision is a real answer, not a 500. */
    if (error?.code === 'P2002') {
      return next(new AppError('A price already exists for that SKU, currency and interval', 409));
    }
    next(error);
  }
});

export default router;
