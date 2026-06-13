/**
 * The single upstream caller + read orchestrator for the canonical snapshot.
 *
 * `refreshSnapshot()` is the ONLY thing that fetches football-data.org and
 * computes standings/leaderboard/knockout. `getSnapshotForRead()` is what the
 * page and `/api/live` call: it returns the persisted snapshot (identical for
 * everyone) and decides whether to refresh inline, in the background, or not at
 * all — with a KV lock so concurrent readers never stampede the upstream API.
 */

import { loadSweepstakeData } from '@/lib/load-data';
import {
  acquireRefreshLock,
  readSnapshot,
  writeSnapshot,
  type StoredSnapshot,
} from '@/lib/snapshot-db';
import { classifyAge } from '@/lib/snapshot-freshness';

/** Lock lifetime — a little above the worst-case refresh duration, so a crashed
 *  refresh can't wedge the lock for long. Auto-expires regardless. */
const LOCK_TTL_SECONDS = 15;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch upstream + compute + persist. Resilient: `loadSweepstakeData` already
 * degrades to static data rather than throwing; if the KV write fails we still
 * return the freshly computed snapshot so the current request isn't broken.
 */
export async function refreshSnapshot(): Promise<StoredSnapshot> {
  const data = await loadSweepstakeData();
  const updatedAt = Date.now();
  try {
    return await writeSnapshot(data, updatedAt);
  } catch (err) {
    console.error('[snapshot] persist failed, serving computed data anyway:', err);
    return { data, updatedAt };
  }
}

export type SnapshotRead = {
  snapshot: StoredSnapshot;
  /** A background refresh to hand to `after()` — null when none was started. */
  background: Promise<unknown> | null;
};

/**
 * Return the snapshot for a read (page render or `/api/live`), applying the
 * stale-while-revalidate policy from `snapshot-freshness.ts`.
 */
export async function getSnapshotForRead(): Promise<SnapshotRead> {
  const current = await readSnapshot();
  const freshness = classifyAge(current?.updatedAt, Date.now());

  if (current && freshness === 'fresh') {
    return { snapshot: current, background: null };
  }

  if (current && freshness === 'stale') {
    // Serve immediately; refresh in the background only if we win the lock.
    if (await acquireRefreshLock(LOCK_TTL_SECONDS)) {
      const background = refreshSnapshot().catch((err) =>
        console.error('[snapshot] background refresh failed:', err)
      );
      return { snapshot: current, background };
    }
    return { snapshot: current, background: null };
  }

  // 'missing' or 'expired' — we want fresh data in this response.
  if (await acquireRefreshLock(LOCK_TTL_SECONDS)) {
    return { snapshot: await refreshSnapshot(), background: null };
  }

  // Another worker holds the lock. If we have a (stale) snapshot, serve it.
  if (current) return { snapshot: current, background: null };

  // Cold start with no snapshot and someone else refreshing — wait briefly for
  // them to publish, then fall back to forcing a refresh ourselves.
  for (let i = 0; i < 6; i++) {
    await sleep(400);
    const published = await readSnapshot();
    if (published) return { snapshot: published, background: null };
  }
  return { snapshot: await refreshSnapshot(), background: null };
}
