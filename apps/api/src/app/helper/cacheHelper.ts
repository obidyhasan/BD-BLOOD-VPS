import { getRedis } from "../shared/redis";

/**
 * Generic read-through cache for expensive, rarely-changing (or
 * tolerant-of-a-little-staleness) queries — public platform stats, location
 * reference data, blood group lists, etc.
 *
 * Design goals, matching the rest of this codebase's Redis usage
 * (see otpHelper.ts): caching must never be able to break a request. If
 * Redis isn't configured, or a call to it fails for any reason, this simply
 * falls back to calling `fn` directly — the cache is a pure optimization,
 * never a dependency.
 */
const getOrSetCache = async <T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> => {
  try {
    const redis = await getRedis();
    if (!redis) return fn();

    const cached = await redis.get(key);
    if (cached !== null && cached !== undefined) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // Corrupted cache entry — fall through and recompute.
      }
    }

    const fresh = await fn();
    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(fresh));
    } catch {
      // Cache write failing must never fail the request itself.
    }
    return fresh;
  } catch {
    // Any unexpected cache-layer failure: serve the real query result.
    return fn();
  }
};

/** Invalidate one or more cache keys (e.g. after a mutation that affects them). */
const invalidateCache = async (...keys: string[]): Promise<void> => {
  try {
    const redis = await getRedis();
    if (!redis || !keys.length) return;
    await redis.del(keys);
  } catch {
    // Best-effort: a failed invalidation just means that key serves stale
    // data until its TTL naturally expires, which is an acceptable
    // trade-off for endpoints that opt into this cache in the first place.
  }
};

export const cacheHelper = {
  getOrSetCache,
  invalidateCache,
};
