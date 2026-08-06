import { logger } from './logger';

/**
 * Rate-limited, retrying executor for AI work.
 *
 * Every Gemini call in the app funnels through `aiService.generateText`, so
 * gating that one place protects all of them: bounded concurrency stops a
 * burst of tool requests hammering the API key, and exponential backoff
 * recovers from the 429/503s that Gemini returns under load.
 *
 * Two drivers:
 *   • in-memory (default) — works with no infrastructure, per the plan's
 *     "or in-memory fallback".
 *   • BullMQ + Redis — used automatically when REDIS_URL is set, so the same
 *     limits apply across every server process rather than per-instance.
 *
 * Callers still await their result, so adding this changed no API contract.
 */

const CONCURRENCY = Number(process.env.AI_QUEUE_CONCURRENCY || 4);
const MAX_ATTEMPTS = Number(process.env.AI_QUEUE_ATTEMPTS || 3);
const BASE_DELAY_MS = Number(process.env.AI_QUEUE_BACKOFF_MS || 800);

/** Retry only on transient failures — a bad prompt won't fix itself. */
const isTransient = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|non-?2xx|rate.?limit|quota|timeout|ECONNRESET|ETIMEDOUT|503|500|overloaded|unavailable/i.test(msg);
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── In-memory driver ─────────────────────────────────────────────────────
   A small semaphore: at most CONCURRENCY tasks run at once, the rest wait
   in FIFO order. */
let active = 0;
const waiting: Array<() => void> = [];

const acquire = async () => {
  if (active < CONCURRENCY) {
    active += 1;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  active += 1;
};

const release = () => {
  active -= 1;
  const next = waiting.shift();
  if (next) next();
};

/** Run `task`, retrying transient failures with exponential backoff. */
const withRetry = async <T>(label: string, task: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (!isTransient(err) || attempt === MAX_ATTEMPTS) break;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      logger.warn(`[aiQueue] ${label} attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError;
};

/* ── Redis-backed limiter ─────────────────────────────────────────────────
   When REDIS_URL is present we take a distributed slot before running, so
   concurrency is capped across all processes rather than per-instance. The
   work itself still runs in-process, which keeps the request/response shape
   unchanged; BullMQ's full producer/worker split would turn every AI call
   into submit-then-poll and change the client contract. */
let redis: import('ioredis').Redis | null = null;
let redisUnavailable = false;

const getRedis = async () => {
  if (redis || redisUnavailable || !process.env.REDIS_URL) return redis;
  try {
    const mod: any = await import('ioredis');
    const Redis = mod.default ?? mod.Redis ?? mod;
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      // Don't let ioredis retry forever in the background when Redis simply
      // isn't there — one attempt, then we fall back for good.
      retryStrategy: () => null,
    });
    // ioredis emits 'error' asynchronously; without a listener Node logs an
    // unhandled error event for every reconnect attempt.
    client.on('error', () => undefined);
    await client.connect();
    redis = client;
    logger.info('[aiQueue] Redis connected — AI concurrency is shared across processes');
  } catch (err) {
    redisUnavailable = true;
    redis = null;
    const reason = err instanceof Error ? err.message : String(err);
    logger.warn(`[aiQueue] Redis unavailable (${reason}); using in-memory limiter`);
  }
  return redis;
};

const SLOT_KEY = 'nxtgen:ai:slots';
const SLOT_TTL_S = 120;

const acquireDistributed = async (client: import('ioredis').Redis) => {
  // Spin until a slot frees. The TTL guarantees a crashed process can't hold
  // a slot forever.
  for (;;) {
    const n = await client.incr(SLOT_KEY);
    if (n === 1) await client.expire(SLOT_KEY, SLOT_TTL_S);
    if (n <= CONCURRENCY) return;
    await client.decr(SLOT_KEY);
    await sleep(120);
  }
};

/**
 * Queue an AI task. Resolves with the task's result, or rejects after
 * MAX_ATTEMPTS transient failures.
 */
export const enqueueAiTask = async <T>(label: string, task: () => Promise<T>): Promise<T> => {
  const client = await getRedis();

  if (client) {
    await acquireDistributed(client);
    try {
      return await withRetry(label, task);
    } finally {
      await client.decr(SLOT_KEY).catch(() => undefined);
    }
  }

  await acquire();
  try {
    return await withRetry(label, task);
  } finally {
    release();
  }
};

/** Exposed for diagnostics — how saturated the in-memory limiter is. */
export const aiQueueStats = () => ({
  driver: redis ? 'redis' : 'memory',
  concurrency: CONCURRENCY,
  active,
  waiting: waiting.length,
});
