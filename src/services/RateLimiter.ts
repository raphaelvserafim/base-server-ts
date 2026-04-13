import { getRedis } from "@app/database/redis.js";

const SCRIPT = `
local key        = KEYS[1]
local now        = tonumber(ARGV[1])
local windowMs   = tonumber(ARGV[2])
local max        = tonumber(ARGV[3])
local ttlSec     = tonumber(ARGV[4])
local id         = ARGV[5]
local windowStart = now - windowMs

redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
local count = tonumber(redis.call('ZCARD', key))

if count < max then
  redis.call('ZADD', key, now, id)
  redis.call('EXPIRE', key, ttlSec)
  return {1, 0}
end

-- Return time (ms) until the oldest entry leaves the window
local oldest = tonumber(redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')[2]) or now
local retryAfterMs = (oldest + windowMs) - now
return {0, retryAfterMs}
`;

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the next slot opens (only set when blocked) */
  retryAfterMs: number;
}

/**
 * Sliding-window rate limiter backed by Redis.
 *
 * @param key        Unique Redis key (e.g. `rate:instance:42`)
 * @param max        Max requests allowed in the window
 * @param windowMs   Window size in milliseconds
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const ttlSec = Math.ceil(windowMs / 1000) + 1;
  const id = `${now}-${Math.random().toString(36).slice(2)}`;

  try {
    const result = await getRedis().eval(
      SCRIPT, 1, key,
      String(now), String(windowMs), String(max), String(ttlSec), id,
    ) as [number, number];

    return {
      allowed: result[0] === 1,
      retryAfterMs: result[1] ?? 0,
    };
  } catch (error) {
    console.error(`[RateLimit] Redis unavailable for ${key}:`, (error as Error)?.message ?? error);
    return {
      allowed: true,
      retryAfterMs: 0,
    };
  }
}

/**
 * Convenience: throws if rate-limited, so callers can just `await assertRateLimit(...)`.
 * Suitable for use inside BullMQ workers (triggers the retry mechanism).
 */
export async function assertRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<void> {
  const { allowed, retryAfterMs } = await checkRateLimit(key, max, windowMs);
  if (!allowed) {
    throw new Error(
      `[RateLimit] key=${key} blocked — retry in ${Math.ceil(retryAfterMs)}ms`,
    );
  }
}
