/**
 * Generic short-lived KV lock for serialising read-modify-write work.
 *
 * Uses an atomic SET NX EX in KV; locally (no KV) it falls back to an in-process
 * flag, which is enough for a single dev process. `acquire` fails OPEN on a KV
 * error: a lock-service blip should not wedge the app, the worst case is the
 * rare race we were already living with. The lock always auto-expires via its
 * TTL, so a crashed holder can't keep it forever.
 */

import { getKv, isKVEnabled } from '@/lib/kv';

const localLocks = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function acquire(key: string, ttlSeconds: number): Promise<boolean> {
  if (!isKVEnabled()) {
    const now = Date.now();
    if (now < (localLocks.get(key) ?? 0)) return false;
    localLocks.set(key, now + ttlSeconds * 1000);
    return true;
  }
  try {
    const kv = await getKv();
    const res = await kv.set(`lock:${key}`, Date.now(), { nx: true, ex: ttlSeconds });
    return res === 'OK';
  } catch {
    return true; // fail open, see file header
  }
}

async function release(key: string): Promise<void> {
  if (!isKVEnabled()) {
    localLocks.delete(key);
    return;
  }
  try {
    const kv = await getKv();
    await kv.del(`lock:${key}`);
  } catch {
    // it'll expire on its own
  }
}

/**
 * Run `fn` while holding `key`. Waits a few short beats for a contended lock,
 * then gives up with an error rather than running unsynchronised.
 */
export async function withLock<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await acquire(key, ttlSeconds)) {
      try {
        return await fn();
      } finally {
        await release(key);
      }
    }
    await sleep(100);
  }
  throw new Error(`busy: could not acquire lock '${key}'`);
}
