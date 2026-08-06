import rateLimit from 'express-rate-limit';

/**
 * Rate limits on the endpoints worth attacking.
 *
 * Without these, password guessing is unbounded — an attacker can try every
 * password against every account as fast as the network allows, and nothing
 * in the app notices.
 *
 * Limits are keyed on IP. That is imperfect behind CGNAT or a university NAT,
 * where many real people share one address, so the auth limiters count only
 * FAILED attempts: somebody signing in successfully never consumes anyone
 * else's budget.
 */

/** Sign-in attempts. Counts failures only, so shared IPs aren't punished. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

/** Account creation, to stop bulk signup. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many accounts created from here. Try again later.' },
});

/**
 * Generative AI calls, which cost real compute per request.
 *
 * Deliberately looser than the plan limits and keyed on IP — this is the
 * backstop against a script, not the product's quota.
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please slow down.' },
});

/** PDF/DOCX rendering — each one launches a browser, so it is expensive. */
export const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many downloads at once. Please wait a moment.' },
});
