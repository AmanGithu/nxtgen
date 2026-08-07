import type { Request } from 'express';

/**
 * Best-effort country for the current request, used only to pick which price
 * list to show first.
 *
 * CDN headers are the only reliable source here and they cost nothing —
 * Cloudflare, Vercel and App Engine all resolve the country at the edge and
 * pass it down. Doing our own IP lookup would mean shipping a MaxMind database
 * and keeping it current, for a result the proxy already computed.
 *
 * Returns null rather than a guess when nothing is available, so callers fall
 * back to the default price list instead of quoting someone the wrong currency
 * with false confidence. In local development that is the normal case.
 */

const HEADERS = [
  'cf-ipcountry',            // Cloudflare
  'x-vercel-ip-country',     // Vercel
  'x-appengine-country',     // Google App Engine
  'x-geo-country',           // generic / our own nginx
];

/** Cloudflare sends these for requests it cannot place. */
const NON_COUNTRIES = new Set(['XX', 'T1', 'ZZ']);

export const countryFromRequest = (req: Request): string | null => {
  for (const name of HEADERS) {
    const raw = req.headers[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) continue;
    const code = value.trim().toUpperCase();
    if (code.length === 2 && !NON_COUNTRIES.has(code)) return code;
  }
  return null;
};

/**
 * Country to quote in, honouring an explicit choice.
 *
 * A visitor who picks a currency from the switcher has told us something the
 * network cannot, so their choice wins over any header. Travel and VPNs make
 * the detected value wrong often enough that this override is not an edge case.
 */
export const resolveDisplayCountry = (req: Request, override?: string | null): string | null => {
  if (override && /^[A-Za-z]{2}$/.test(override)) return override.toUpperCase();
  return countryFromRequest(req);
};
