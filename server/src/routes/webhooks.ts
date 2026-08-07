import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { verifyWebhook } from '../services/payments/stripeProvider';
import { fulfilmentService } from '../services/payments/fulfilmentService';
import {
  verifyWebhookSignature as verifyCashfreeSignature,
  isFreshTimestamp,
} from '../services/payments/cashfreeProvider';

/**
 * Provider callbacks. This is the only thing that grants paid access.
 *
 * Deliberately unauthenticated — Stripe has no session with us. Trust comes
 * from the signature over the raw request body, so this router is mounted with
 * a raw body parser; JSON-parsing first would destroy the exact bytes the
 * signature covers and every genuine event would fail to verify.
 *
 * The browser returning from checkout is never treated as proof of payment.
 * That redirect is a URL anyone can type.
 */

const router = Router();

router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing stripe-signature header' });
  }

  let event;
  try {
    // req.body is a Buffer here — see the raw parser mounted in index.ts.
    event = verifyWebhook(req.body as Buffer, signature);
  } catch (error: any) {
    /* `isBuffer` is worth logging: if the raw parser in index.ts ever stops
       matching this path, every genuine event fails here and the body arriving
       as an object rather than a Buffer is the tell. Logged, never returned —
       an unauthenticated caller learns nothing beyond "rejected". */
    logger.warn(
      `[webhook] rejected unverified Stripe callback: ${error?.message} (isBuffer=${Buffer.isBuffer(req.body)})`
    );
    return res.status(400).json({ success: false, message: 'Signature verification failed' });
  }

  /* Record before acting, and dedupe on `processedAt` rather than on the row
     merely existing.

     Those are not the same thing. Stripe retries for up to three days on any
     non-2xx, so a delivery that failed halfway must be retryable — but a
     delivery that already succeeded must not run twice, or one payment grants
     two months. Keying on processedAt distinguishes the two, and keeps the
     failed attempt and its error on record instead of deleting the evidence. */
  try {
    await prisma.webhookEvent.create({
      data: { provider: 'STRIPE', eventId: event.id, type: event.type, payload: event as any },
    });
  } catch (error: any) {
    if (error?.code !== 'P2002') throw error;

    const prior = await prisma.webhookEvent.findUnique({ where: { eventId: event.id } });
    if (prior?.processedAt) {
      logger.info(`[webhook] duplicate Stripe event ${event.id} — already handled`);
      return res.json({ success: true, duplicate: true });
    }
    logger.info(`[webhook] retrying previously failed event ${event.id}`);
  }

  try {
    await handleStripeEvent(event);
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processedAt: new Date(), error: null },
    });
  } catch (error: any) {
    /* processedAt stays null, so Stripe's retry will be allowed through
       again. The 500 is what asks for that retry. */
    logger.error(`[webhook] failed handling ${event.type} ${event.id}:`, error);
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { error: String(error?.message ?? error).slice(0, 2000) },
    });
    return res.status(500).json({ success: false });
  }

  res.json({ success: true });
});

/**
 * Cashfree callbacks.
 *
 * Same contract as the Stripe endpoint — verify, dedupe, fulfil — but a
 * different signature scheme, so the two cannot share a verifier.
 */
router.post('/cashfree', async (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];

  if (typeof signature !== 'string' || typeof timestamp !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing signature headers' });
  }

  /* Checked before the signature: a captured body stays validly signed
     forever, so freshness is what stops a replay, not the HMAC. */
  if (!isFreshTimestamp(timestamp)) {
    logger.warn('[webhook] rejected stale Cashfree callback');
    return res.status(400).json({ success: false, message: 'Stale timestamp' });
  }

  let verified = false;
  try {
    verified = verifyCashfreeSignature(req.body as Buffer, timestamp, signature);
  } catch (error: any) {
    logger.error(`[webhook] Cashfree verification error: ${error?.message}`);
    return res.status(503).json({ success: false });
  }
  if (!verified) {
    logger.warn(`[webhook] rejected unverified Cashfree callback (isBuffer=${Buffer.isBuffer(req.body)})`);
    return res.status(400).json({ success: false, message: 'Signature verification failed' });
  }

  let event: any;
  try {
    event = JSON.parse((req.body as Buffer).toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Malformed body' });
  }

  /* Cashfree sends no per-delivery event id, so one is derived from the
     payment reference and event type. Without a stable key here a redelivery
     would be indistinguishable from a new payment. */
  const cfPaymentId = event?.data?.payment?.cf_payment_id ?? event?.data?.order?.order_id ?? 'unknown';
  const eventId = `cashfree:${event?.type ?? 'UNKNOWN'}:${cfPaymentId}`;

  try {
    await prisma.webhookEvent.create({
      data: { provider: 'CASHFREE', eventId, type: String(event?.type ?? 'UNKNOWN'), payload: event },
    });
  } catch (error: any) {
    if (error?.code !== 'P2002') throw error;
    const prior = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (prior?.processedAt) {
      logger.info(`[webhook] duplicate Cashfree event ${eventId} — already handled`);
      return res.json({ success: true, duplicate: true });
    }
    logger.info(`[webhook] retrying previously failed event ${eventId}`);
  }

  try {
    await handleCashfreeEvent(event);
    await prisma.webhookEvent.update({ where: { eventId }, data: { processedAt: new Date(), error: null } });
  } catch (error: any) {
    logger.error(`[webhook] failed handling Cashfree ${event?.type}:`, error);
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { error: String(error?.message ?? error).slice(0, 2000) },
    });
    return res.status(500).json({ success: false });
  }

  res.json({ success: true });
});

async function handleCashfreeEvent(event: any) {
  /* order_id is our Payment id — set when the order was created, so no lookup
     table is needed to get back to the row. */
  const paymentId: string | undefined = event?.data?.order?.order_id;
  const type = String(event?.type ?? '');

  if (!paymentId) {
    logger.error(`[webhook] Cashfree ${type} carried no order_id`);
    return;
  }

  switch (type) {
    case 'PAYMENT_SUCCESS_WEBHOOK': {
      /* Cashfree quotes major units; everything internal is integer minor
         units. Comparing them without converting would reject every genuine
         payment as a mismatch. */
      const paidMajor = Number(event?.data?.payment?.payment_amount ?? NaN);
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        logger.error(`[webhook] Cashfree names unknown payment ${paymentId}`);
        return;
      }
      const expectedMajor = payment.amountMinor / 100;
      if (Number.isFinite(paidMajor) && Math.abs(paidMajor - expectedMajor) > 0.009) {
        /* Underpayment is the one case where granting access would be a real
           loss, so it is refused and flagged rather than fulfilled. */
        logger.error(
          `[webhook] Cashfree amount mismatch on ${paymentId}: paid ${paidMajor}, expected ${expectedMajor}`
        );
        await prisma.payment.update({
          where: { id: paymentId },
          data: { failureReason: `Amount mismatch: paid ${paidMajor}, expected ${expectedMajor}` },
        });
        return;
      }
      await fulfilmentService.settle(paymentId, String(event?.data?.payment?.cf_payment_id ?? ''));
      return;
    }

    case 'PAYMENT_FAILED_WEBHOOK':
    case 'PAYMENT_USER_DROPPED_WEBHOOK': {
      await fulfilmentService.fail(paymentId, event?.data?.payment?.payment_message ?? type);
      return;
    }

    default:
      logger.debug(`[webhook] ignoring Cashfree ${type}`);
  }
}

async function handleStripeEvent(event: any) {
  const object = event.data?.object ?? {};
  const paymentId: string | undefined = object.metadata?.paymentId || object.client_reference_id;

  switch (event.type) {
    case 'checkout.session.completed': {
      /* `payment_status` matters: a session can complete with payment still
         pending for delayed methods, and granting access then would hand out
         a month before the money arrives. */
      if (object.payment_status && object.payment_status !== 'paid') {
        logger.info(`[webhook] session ${object.id} completed but unpaid — waiting`);
        return;
      }
      if (!paymentId) {
        logger.error(`[webhook] session ${object.id} carried no paymentId`);
        return;
      }
      /* `object.subscription` is present in subscription mode and is what the
         renewal and cancellation handlers below key on. */
      await fulfilmentService.settle(
        paymentId,
        object.payment_intent ?? object.id,
        object.subscription ? String(object.subscription) : undefined
      );
      return;
    }

    /* Renewals. The first invoice is already handled by the session above, so
       only subsequent cycles extend the period here. */
    case 'invoice.paid': {
      const subId = object.subscription;
      if (!subId || object.billing_reason === 'subscription_create') return;
      const sub = await prisma.subscription.findFirst({ where: { providerSubscriptionId: String(subId) } });
      if (!sub) return;
      const next = new Date();
      next.setUTCMonth(next.getUTCMonth() + 1);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { currentPeriodEnd: next, status: 'ACTIVE' },
      });
      logger.info(`[webhook] renewed subscription ${sub.id} to ${next.toISOString()}`);
      return;
    }

    case 'payment_intent.payment_failed':
    case 'checkout.session.expired': {
      if (paymentId) {
        await fulfilmentService.fail(paymentId, object.last_payment_error?.message ?? event.type);
      }
      return;
    }

    case 'customer.subscription.deleted': {
      const sub = await prisma.subscription.findFirst({
        where: { providerSubscriptionId: String(object.id) },
      });
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'CANCELLED', autoRenew: false },
        });
      }
      return;
    }

    default:
      /* Stored but not acted on. Stripe sends a great many event types and
         answering 2xx to the ones we ignore stops it retrying them forever. */
      logger.debug(`[webhook] ignoring ${event.type}`);
  }
}

export default router;
