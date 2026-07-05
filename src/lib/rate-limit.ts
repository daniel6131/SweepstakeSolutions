/**
 * Tiny fixed-window per-key rate limiter on top of Vercel KV.
 *
 * Deliberately fails open: if KV is down or missing it lets the request through.
 * I'd rather lose the limiter than block real traffic on a match day. Auth is
 * still the actual gate on the mutating routes; this just stops spam and keeps
 * the heavier endpoints from getting hammered.
 */

const isKVEnabled = (): boolean => Boolean(process.env.KV_REST_API_URL);

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  /** Seconds a throttled caller should wait before retrying (the window). */
  retryAfter: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!isKVEnabled()) return { ok: true, remaining: limit, limit, retryAfter: windowSeconds };

  try {
    const { kv } = await import('@vercel/kv');
    const bucketKey = `ratelimit:${key}`;
    const count = await kv.incr(bucketKey);
    // first hit in the window starts the TTL so the bucket expires on its own
    if (count === 1) await kv.expire(bucketKey, windowSeconds);
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
      retryAfter: windowSeconds,
    };
  } catch {
    // fail open, see above
    return { ok: true, remaining: limit, limit, retryAfter: windowSeconds };
  }
}

// best-effort client IP from the proxy headers Vercel puts in front of us
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
