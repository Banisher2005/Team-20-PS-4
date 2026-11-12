/**
 * Tiny in-memory fixed-window rate limiter.
 * Note: on Vercel each server instance has its own memory, so limits are per instance.
 * Good enough to protect the Gemini quota during a demo; use Redis/Upstash for production.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Returns true if the call is allowed, false if the limit is reached. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
