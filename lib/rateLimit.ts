// lib/rateLimit.ts
type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const store = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter.
 * key: unique key (e.g. `admin-login:1.2.3.4`)
 * limit: max attempts
 * windowMs: time window in ms
 *
 * Returns { allowed, remaining, resetAt }.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.expiresAt < now) {
    store.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.expiresAt };
  }

  entry.count += 1;
  store.set(key, entry);

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.expiresAt };
}
