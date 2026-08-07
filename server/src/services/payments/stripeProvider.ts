import Stripe from 'stripe';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { AppError } from '../../middleware/errorHandler';

/**
 * Stripe, used for every market except India.
 *
 * The client is created lazily and only when a key exists. Constructing it at
 * import time would make the whole API fail to boot on a developer machine
 * with no Stripe credentials, for a feature they are not working on.
 */

let client: Stripe | null = null;

export const stripeConfigured = () => !!env.STRIPE_SECRET_KEY;

export const stripe = (): Stripe => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError('Card payments are not configured on this environment.', 503);
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY, {
      /* No explicit apiVersion: the SDK sends the version its own types were
         generated from, so the request and the TypeScript definitions cannot
         disagree. Hardcoding a version here is worse than it looks — it only
         typechecks via `as Stripe.LatestApiVersion`, and that cast silences
         the very mismatch it is meant to prevent. Pin by upgrading the
         package, not by overriding the string. */
      typescript: true,
      /* Stripe retries idempotently on network failure; two is enough to ride
         out a blip without holding a checkout request open for a minute. */
      maxNetworkRetries: 2,
    });
  }
  return client;
};

export interface CheckoutLine {
  /** Shown on the Stripe page and on the receipt. */
  name: string;
  currency: string;
  amountMinor: number;
  quantity: number;
  /** MONTH/YEAR create a subscription; ONE_TIME creates a single charge. */
  interval: 'MONTH' | 'YEAR' | 'ONE_TIME';
}

/**
 * Build a hosted Checkout Session.
 *
 * Hosted rather than an embedded card form on purpose: card details never
 * touch our servers, which keeps the whole application out of PCI scope. The
 * moment we render our own card input that stops being true.
 */
export const createCheckoutSession = async (opts: {
  paymentId: string;
  userId: string;
  email?: string | null;
  lines: CheckoutLine[];
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
}) => {
  const s = stripe();

  const recurring = opts.lines.some((l) => l.interval !== 'ONE_TIME');
  const mixed = recurring && opts.lines.some((l) => l.interval === 'ONE_TIME');
  if (mixed) {
    /* Stripe will not put a one-off charge and a subscription in the same
       session. Course seats are one-time and tools are monthly, so this is
       reachable by a user ticking both — it needs to be two checkouts, and
       saying so beats a raw Stripe error. */
    throw new AppError(
      'A course purchase and a subscription have to be paid for separately. Please check out one at a time.',
      400
    );
  }

  const session = await s.checkout.sessions.create(
    {
      mode: recurring ? 'subscription' : 'payment',
      line_items: opts.lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: line.currency.toLowerCase(),
          unit_amount: line.amountMinor,
          product_data: { name: line.name },
          ...(line.interval === 'ONE_TIME'
            ? {}
            : { recurring: { interval: line.interval === 'YEAR' ? ('year' as const) : ('month' as const) } }),
        },
      })),
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      client_reference_id: opts.paymentId,
      ...(opts.email ? { customer_email: opts.email } : {}),
      /* Echoed back on every webhook for this session. The webhook trusts this
         to know which Payment row to settle — never the URL the browser
         returns to, which anyone can craft. */
      metadata: { paymentId: opts.paymentId, userId: opts.userId },
      ...(recurring
        ? { subscription_data: { metadata: { paymentId: opts.paymentId, userId: opts.userId } } }
        : { payment_intent_data: { metadata: { paymentId: opts.paymentId, userId: opts.userId } } }),
    },
    /* Survives a retried create: the same key returns the original session
       instead of opening a second one the user could also pay. */
    { idempotencyKey: opts.idempotencyKey }
  );

  logger.info(`[stripe] checkout session ${session.id} for payment ${opts.paymentId}`);
  return session;
};

/**
 * Verify a webhook came from Stripe.
 *
 * Requires the exact bytes Stripe sent — the signature covers the raw body, so
 * anything that reparses or reserialises the JSON first will fail to verify
 * even when the payload is genuine.
 */
export const verifyWebhook = (rawBody: Buffer, signature: string): Stripe.Event => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('Stripe webhook secret is not configured.', 503);
  }
  return stripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
};
