/**
 * Canonical snapshot store — the single source of truth for live tournament data.
 *
 * One computed `SweepstakeData` snapshot is persisted here and read by every
 * surface (the SSR page + `/api/live`), so all devices see identical data. The
 * ONLY writer is `refresh-snapshot.ts`, and upstream fetches are serialized by
 * a KV lock so traffic can never fan out into the football-data.org API.
 *
 * Uses Vercel KV in production (when KV_REST_API_URL is set); falls back to a
 * local JSON file + in-process lock for development — mirrors `draft-db.ts`.
 */

import type { SweepstakeData } from '@/lib/load-data';

const SNAPSHOT_KEY = 'sweepstake:snapshot';
const LOCK_KEY = 'sweepstake:refresh-lock';

const isKVEnabled = (): boolean => Boolean(process.env.KV_REST_API_URL);

export type StoredSnapshot = {
  data: SweepstakeData;
  /** Epoch ms the snapshot was computed (drives staleness + the "updated" UI). */
  updatedAt: number;
};

/* ── Snapshot read/write ───────────────────────────────────── */

export async function readSnapshot(): Promise<StoredSnapshot | null> {
  if (isKVEnabled()) {
    const { kv } = await import('@vercel/kv');
    return kv.get<StoredSnapshot>(SNAPSHOT_KEY);
  }
  const { existsSync, readFileSync } = await import('fs');
  const { join } = await import('path');
  const path = join(process.cwd(), 'data', 'snapshot.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as StoredSnapshot;
  } catch {
    return null;
  }
}

export async function writeSnapshot(
  data: SweepstakeData,
  updatedAt: number
): Promise<StoredSnapshot> {
  const snapshot: StoredSnapshot = { data, updatedAt };
  if (isKVEnabled()) {
    const { kv } = await import('@vercel/kv');
    await kv.set(SNAPSHOT_KEY, snapshot);
    return snapshot;
  }
  const { existsSync, mkdirSync, writeFileSync } = await import('fs');
  const { join } = await import('path');
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'snapshot.json'), JSON.stringify(snapshot, null, 2));
  return snapshot;
}

/* ── Refresh lock (stampede protection) ────────────────────────
   Only one refresh may hit the upstream API at a time, no matter how many
   readers arrive at once. KV uses an atomic SET NX EX; the local fallback uses
   an in-process expiry (single dev process, so that's sufficient). */

let localLockUntil = 0;

/** Try to take the refresh lock. Returns true if acquired. Auto-expires. */
export async function acquireRefreshLock(ttlSeconds: number): Promise<boolean> {
  if (isKVEnabled()) {
    const { kv } = await import('@vercel/kv');
    const res = await kv.set(LOCK_KEY, Date.now(), { nx: true, ex: ttlSeconds });
    return res === 'OK';
  }
  const now = Date.now();
  if (now < localLockUntil) return false;
  localLockUntil = now + ttlSeconds * 1000;
  return true;
}

/** Release the lock early (best-effort; it also auto-expires via TTL). */
export async function releaseRefreshLock(): Promise<void> {
  if (isKVEnabled()) {
    const { kv } = await import('@vercel/kv');
    await kv.del(LOCK_KEY);
    return;
  }
  localLockUntil = 0;
}
