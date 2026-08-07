import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { isSupportedCurrency, currencyForCountry, providerForCountry, type Currency } from '../lib/currency';
import { parseSkuKey } from '../lib/skus';
import { createCheckoutSession, stripeConfigured, type CheckoutLine } from '../services/payments/stripeProvider';
import { createOrder as createCashfreeOrder, cashfreeConfigured } from '../services/payments/cashfreeProvider';

/**
 * Checkout.
 *
 * The client sends *what* it wants to buy and never *how much* it costs.
 * Amounts are read from the Price table here, so a tampered request cannot
 * change the charge — the only thing a caller controls is the SKU list.
 */

const router = Router();
router.use(authenticate);

/** ISO-3166 alpha-2, as collected from the billing address. */
const isCountry = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z]{2}$/.test(v);

router.post('/', async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { items, billingCountry, batchId } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Select at least one item to buy.', 400);
    }
    if (items.length > 20) throw new AppError('Too many items in one checkout.', 400);
    if (!isCountry(billingCountry)) {
      throw new AppError('A billing country is required.', 400);
    }

    const country = billingCountry.toUpperCase();

    /* The charging currency follows the billing country, never the IP or a
       client-supplied preference. Letting the browser choose would let anyone
       pick the cheapest market from a dropdown. */
    const currency: Currency = currencyForCountry(country);
    if (!isSupportedCurrency(currency)) {
      throw new AppError('We cannot take payments in that currency yet.', 400);
    }

    const provider = providerForCountry(country);
    if (provider === 'STRIPE' && !stripeConfigured()) {
      throw new AppError('Card payments are not configured on this environment.', 503);
    }
    if (provider === 'CASHFREE' && !cashfreeConfigured()) {
      throw new AppError('UPI and Indian card payments are not configured on this environment.', 503);
    }

    const skuKeys: string[] = items.map((i: any) => String(i?.skuKey ?? ''));
    if (skuKeys.some((k) => !parseSkuKey(k))) throw new AppError('Unrecognised item in cart.', 400);

    const prices = await prisma.price.findMany({
      where: { skuKey: { in: skuKeys }, currency, isActive: true },
    });

    const priceBySku = new Map(prices.map((p) => [p.skuKey, p]));
    const missing = skuKeys.filter((k) => !priceBySku.has(k));
    if (missing.length) {
      throw new AppError(`No ${currency} price is set for: ${missing.join(', ')}`, 409);
    }

    /* A batch purchase must name the batch, and it must be one that can still
       take a student. This is a courtesy check — the seat is actually claimed
       at fulfilment — but it stops the common case of selling a seat in a full
       or unpublished batch. */
    let resolvedBatchId: string | null = null;
    if (skuKeys.some((k) => parseSkuKey(k)?.type === 'BATCH')) {
      if (typeof batchId !== 'string' || !batchId) {
        throw new AppError('Choose which batch you want to join.', 400);
      }
      const batch = await prisma.batch.findUnique({ where: { id: batchId } });
      if (!batch || !batch.isPublished || batch.status !== 'ACTIVE') {
        throw new AppError('That batch is not open for enrolment.', 400);
      }
      if (batch.seatsTaken >= batch.maxStudents) {
        throw new AppError('That batch is full.', 409);
      }
      if (batch.endDate < new Date()) throw new AppError('That batch has already finished.', 400);
      resolvedBatchId = batch.id;
    }

    const lines: CheckoutLine[] = [];
    let total = 0;
    const itemRows = skuKeys.map((skuKey) => {
      const price = priceBySku.get(skuKey)!;
      const parsed = parseSkuKey(skuKey)!;
      const amount = price.amountMinor;
      total += amount;
      lines.push({
        name: skuKey,
        currency,
        amountMinor: amount,
        quantity: 1,
        interval: price.interval as CheckoutLine['interval'],
      });
      return {
        priceId: price.id,
        skuKey,
        skuType: parsed.type as any,
        quantity: 1,
        unitMinor: amount,
        amountMinor: amount,
        batchId: parsed.type === 'BATCH' ? resolvedBatchId : null,
      };
    });

    /* The Payment row exists before the user is sent to the provider, so a
       webhook that arrives before the browser comes back still has something
       to settle. */
    const idempotencyKey = randomUUID();
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        provider,
        idempotencyKey,
        status: 'CREATED',
        currency,
        amountMinor: total,
        billingCountry: country,
        items: { create: itemRows },
      },
    });

    const successUrl = `${env.CLIENT_URL}/billing/success?payment=${payment.id}`;
    const cancelUrl = `${env.CLIENT_URL}/dashboard/tools/unlock?cancelled=1`;

    /* One shape for both providers. Stripe hands back a URL to redirect to;
       Cashfree hands back a session id its drop-in opens in place. The client
       branches on `provider`, and everything downstream — webhooks,
       fulfilment, entitlements — is identical. */
    let redirectUrl: string | null = null;
    let paymentSessionId: string | null = null;
    let providerRef: string | null = null;

    try {
      if (provider === 'CASHFREE') {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { email: true, phone: true, firstName: true, lastName: true },
        });
        const order = await createCashfreeOrder({
          paymentId: payment.id,
          amountMinor: total,
          currency,
          customer: {
            id: req.user.id,
            email: user?.email,
            phone: user?.phone,
            name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined,
          },
          returnUrl: successUrl,
          notifyUrl: `${env.SERVER_PUBLIC_URL || ''}/api/webhooks/cashfree`,
        });
        paymentSessionId = order.paymentSessionId;
        providerRef = order.cfOrderId || order.orderId;
      } else {
        const session = await createCheckoutSession({
          paymentId: payment.id,
          userId: req.user.id,
          email: req.user.email,
          lines,
          successUrl,
          cancelUrl,
          idempotencyKey,
        });
        redirectUrl = session.url;
        providerRef = session.payment_intent?.toString() ?? session.id;
      }
    } catch (error: any) {
      /* The provider refused — a bad key, a disabled account, or their
         outage. The Payment row is already written, so leave it FAILED with
         the reason rather than orphaned in CREATED, and answer something the
         user can act on. A bare 500 here reads as "the site is broken" when
         the honest answer is "payments are down, your card was not charged". */
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: String(error?.message ?? error).slice(0, 500) },
      });
      logger.error(`[checkout] ${provider} refused payment ${payment.id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        'We could not start the payment just now, and you have not been charged. Please try again shortly.',
        502
      );
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PENDING', providerRef },
    });

    logger.info(`[checkout] ${req.user.email} -> ${provider} ${currency} ${total} (${skuKeys.join(', ')})`);

    res.json({
      success: true,
      paymentId: payment.id,
      provider,
      url: redirectUrl,
      paymentSessionId,
      cashfreeEnv: provider === 'CASHFREE' ? env.CASHFREE_ENV : undefined,
    });
  } catch (error) {
    next(error);
  }
});

/** Poll target for the return page. The redirect proves nothing on its own —
    this reports what the webhook has actually settled. */
router.get('/:paymentId', async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: String(req.params.paymentId), userId: req.user.id },
      include: { items: true },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    res.json({
      success: true,
      status: payment.status,
      currency: payment.currency,
      amountMinor: payment.amountMinor,
      items: payment.items.map((i) => ({ skuKey: i.skuKey, amountMinor: i.amountMinor })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
