import { logger } from './logger';

/**
 * Free-action allowance for signed-out visitors.
 *
 * Two limits, because neither alone works:
 *
 *   • Per browser (a guest id the client generates and stores). This is the
 *     limit a real visitor experiences. Keying on this alone would be trivially
 *     bypassed by clearing storage.
 *
 *   • Per IP, set much higher, purely as an abuse ceiling. Keying on IP alone
 *     is worse than it looks: offices, universities and mobile carriers behind
 *     CGNAT all share addresses, so a low per-IP cap would lock out a whole
 *     building because one person tried the product. On localhost every
 *     visitor is ::1, which makes it useless in development too.
 *
 * In-memory by design — this bounds cost and abuse, it is not an audit trail.
 * A restart resets it, which is an acceptable trade for no Redis dependency.
 */

const PER_BROWSER = Number(process.env.GUEST_FREE_AI_ACTIONS || 5);
const PER_IP = Number(process.env.GUEST_IP_CEILING || 50);
const WINDOW_MS = Number(process.env.GUEST_QUOTA_WINDOW_MS || 24 * 60 * 60 * 1000);

interface Entry {
  used: number;
  resetAt: number;
}

const byBrowser = new Map<string, Entry>();
const byIp = new Map<string, Entry>();

const sweep = () => {
  const now = Date.now();
  for (const map of [byBrowser, byIp]) {
    for (const [key, entry] of map) if (entry.resetAt <= now) map.delete(key);
  }
};
setInterval(sweep, 60 * 60 * 1000).unref?.();

const entryFor = (map: Map<string, Entry>, key: string): Entry => {
  const now = Date.now();
  const existing = map.get(key);
  if (existing && existing.resetAt > now) return existing;
  const fresh = { used: 0, resetAt: now + WINDOW_MS };
  map.set(key, fresh);
  return fresh;
};

export interface QuotaState {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: number;
  /** Which limit stopped them, when blocked. */
  reason?: 'browser' | 'ip';
}

export const peekGuestQuota = (ip: string, guestId: string): QuotaState => {
  const browser = entryFor(byBrowser, guestId);
  const ipEntry = entryFor(byIp, ip);
  const blockedByIp = ipEntry.used >= PER_IP;
  return {
    allowed: browser.used < PER_BROWSER && !blockedByIp,
    used: browser.used,
    limit: PER_BROWSER,
    remaining: Math.max(0, PER_BROWSER - browser.used),
    resetAt: browser.resetAt,
    ...(blockedByIp ? { reason: 'ip' as const } : {}),
  };
};

/** Consume one action. Returns the state after the attempt. */
export const consumeGuestAction = (ip: string, guestId: string): QuotaState => {
  const browser = entryFor(byBrowser, guestId);
  const ipEntry = entryFor(byIp, ip);

  if (ipEntry.used >= PER_IP) {
    return { allowed: false, used: browser.used, limit: PER_BROWSER, remaining: 0, resetAt: ipEntry.resetAt, reason: 'ip' };
  }
  if (browser.used >= PER_BROWSER) {
    return { allowed: false, used: browser.used, limit: PER_BROWSER, remaining: 0, resetAt: browser.resetAt, reason: 'browser' };
  }

  browser.used += 1;
  ipEntry.used += 1;
  logger.debug(`[guestQuota] ${guestId.slice(0, 8)} ${browser.used}/${PER_BROWSER} (ip ${ipEntry.used}/${PER_IP})`);
  return {
    allowed: true,
    used: browser.used,
    limit: PER_BROWSER,
    remaining: PER_BROWSER - browser.used,
    resetAt: browser.resetAt,
  };
};

/** Clear all guest counters — exposed for local development only. */
export const resetGuestQuota = () => {
  byBrowser.clear();
  byIp.clear();
  logger.info('[guestQuota] all guest allowances reset');
};
