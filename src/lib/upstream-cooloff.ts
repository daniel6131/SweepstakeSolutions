/**
 * Tiny circuit breaker for football-data.org.
 *
 * After a 429 we set a KV marker that expires after the Retry-After window.
 * While it's set, refreshes skip the upstream call entirely and serve
 * last-known-good instead of poking a limiter that's already told us to back
 * off. No KV (local dev) means no marker, so it's a no-op there.
 */

import { getKv, isKVEnabled } from '@/lib/kv';

const COOLOFF_KEY = 'sweepstake:upstream-cooloff';

export async function isUpstreamCoolingOff(): Promise<boolean> {
  if (!isKVEnabled()) return false;
  try {
    const kv = await getKv();
    return (await kv.get(COOLOFF_KEY)) != null;
  } catch {
    return false; // never block a fetch because the breaker check itself failed
  }
}

export async function markUpstreamCooloff(seconds: number): Promise<void> {
  if (!isKVEnabled()) return;
  try {
    const kv = await getKv();
    // clamp so a bogus Retry-After can't freeze us out for ages
    await kv.set(COOLOFF_KEY, Date.now(), { ex: Math.max(1, Math.min(seconds, 300)) });
  } catch {
    // best effort
  }
}
