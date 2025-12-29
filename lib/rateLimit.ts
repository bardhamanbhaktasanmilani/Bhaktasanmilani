
type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const store = new Map<string, RateLimitEntry>();

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
