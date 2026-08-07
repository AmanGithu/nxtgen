import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { AppError } from '../../middleware/errorHandler';

/**
 * Cashfree, used for India.
 *
 * Stripe cannot collect domestically for an Indian business, and Indian
 * customers overwhelmingly pay by UPI rather than card — so this is not a
 * preference, it is the only way the Indian half of the catalogue can be sold.
 *
 * Called over plain fetch rather than their SDK: the surface we need is two
 * endpoints and one HMAC, and a dependency that bundles its own HTTP client
 * and global config is more risk than it removes.
 */

const API_VERSION = '2023-08-01';

const baseUrl = () =>
  env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

export const cashfreeConfigured = () => !!(env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY);

const headers = () => {
  if (!cashfreeConfigured()) {
    throw new AppError('UPI and Indian card payments are not configured on this environment.', 503);
  }
  return {
    'Content-Type': 'application/json',
    'x-api-version': API_VERSION,
    'x-client-id': env.CASHFREE_APP_ID!,
    'x-client-secret': env.CASHFREE_SECRET_KEY!,
  };
};

/**
 * Cashfree quotes amounts in MAJOR units as a decimal (₹299.00), where Stripe
 * uses minor units as an integer (29900).
 *
 * This is the single most dangerous line in the file: getting it wrong by a
 * factor of 100 either undercharges by 99% or overcharges by 10,000%, and
 * both are silent. Everything internal stays in integer minor units; the
 * conversion happens here and nowhere else.
 */
export const toMajorUnits = (amountMinor: number): number => {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new AppError('Invalid amount', 500);
  }
  return Number((amountMinor / 100).toFixed(2));
};

export interface CashfreeOrderInput {
  paymentId: string;
  amountMinor: number;
  currency: string;
  customer: { id: string; email?: string | null; phone?: string | null; name?: string | null };
  returnUrl: string;
  notifyUrl: string;
}

export const createOrder = async (input: CashfreeOrderInput) => {
  /* Cashfree rejects an order with no customer_phone. Most of our accounts
     have none — User.phone is optional — so rather than let their API return
     an opaque validation error at the worst moment, say what is missing. */
  if (!input.customer.phone) {
    throw new AppError('A mobile number is required for UPI and Indian card payments.', 400);
  }

  const body = {
    /* Our Payment id is the order id, so a webhook naming an order resolves
       to a row without a lookup table. */
    order_id: input.paymentId,
    order_amount: toMajorUnits(input.amountMinor),
    order_currency: input.currency,
    customer_details: {
      customer_id: input.customer.id,
      customer_email: input.customer.email ?? undefined,
      customer_phone: input.customer.phone,
      customer_name: input.customer.name ?? undefined,
    },
    order_meta: {
      return_url: input.returnUrl,
      /* Where Cashfree posts the result. This, not the browser returning to
         return_url, is what grants access. */
      notify_url: input.notifyUrl,
    },
  };

  const res = await fetch(`${baseUrl()}/orders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  const json: any = await res.json().catch(() => ({}));

  if (!res.ok) {
    logger.error(`[cashfree] order create failed ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
    throw new AppError(
      json?.message || 'We could not start the payment just now, and you have not been charged.',
      502
    );
  }

  logger.info(`[cashfree] order ${json.order_id} created (session ${String(json.payment_session_id).slice(0, 12)}…)`);
  return {
    orderId: json.order_id as string,
    cfOrderId: String(json.cf_order_id ?? ''),
    /* Handed to Cashfree's drop-in on the client, which opens the UPI/card
       sheet. Card details never reach us, same as with Stripe's hosted page. */
    paymentSessionId: json.payment_session_id as string,
  };
};

/** Authoritative order status, for reconciling a payment whose webhook was
    lost. Never trusted from the browser. */
export const fetchOrder = async (orderId: string) => {
  const res = await fetch(`${baseUrl()}/orders/${encodeURIComponent(orderId)}`, { headers: headers() });
  if (!res.ok) throw new AppError('Could not fetch order status', 502);
  return res.json() as Promise<any>;
};

/**
 * Verify a Cashfree webhook.
 *
 * A different scheme from Stripe's, and the differences are easy to get wrong:
 *   - signed payload is `timestamp + rawBody` with NO separator
 *     (Stripe uses `timestamp + "." + rawBody`)
 *   - the digest is base64 (Stripe's is hex)
 *   - the key is the client secret (Stripe has a dedicated whsec_)
 *
 * Compared with timingSafeEqual so a wrong signature cannot be discovered one
 * byte at a time by measuring how long the comparison takes.
 */
export const verifyWebhookSignature = (rawBody: Buffer, timestamp: string, signature: string): boolean => {
  if (!env.CASHFREE_SECRET_KEY) {
    throw new AppError('Cashfree is not configured.', 503);
  }

  const expected = crypto
    .createHmac('sha256', env.CASHFREE_SECRET_KEY)
    .update(timestamp + rawBody.toString('utf8'))
    .digest('base64');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  /* timingSafeEqual throws on a length mismatch, which is itself a signal, so
     the lengths are compared first and the result is the same either way. */
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/**
 * Reject callbacks that are too old to be genuine.
 *
 * Without this, a signed body captured once could be replayed forever — the
 * signature stays valid because the payload never changes.
 */
export const isFreshTimestamp = (timestamp: string, toleranceSeconds = 300): boolean => {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  /* Cashfree sends seconds; tolerate milliseconds in case that changes. */
  const seconds = ts > 1e12 ? ts / 1000 : ts;
  return Math.abs(Date.now() / 1000 - seconds) <= toleranceSeconds;
};
