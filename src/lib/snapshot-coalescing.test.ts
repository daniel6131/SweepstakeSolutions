import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Stampede-guard regression test for the read orchestrator. The whole
 * 20-req-per-minute budget rests on concurrent readers collapsing to a single
 * upstream refresh: exactly one reader takes the refresh lock and hits
 * football-data, every other reader serves the current snapshot. This pins that
 * behaviour so a refactor that lets every match-day visitor trigger their own
 * refresh fails CI instead of silently blowing the budget on kickoff.
 *
 * The KV lock primitive itself (SET NX EX atomicity) is covered by
 * snapshot-db.test.ts; here the lock is mocked deterministically so the test
 * targets the coalescing logic in getSnapshotForRead, not the KV client.
 */

const h = vi.hoisted(() => ({
  upstream: { count: 0 },
  lock: { held: false },
  snap: { value: null as unknown },
}));

vi.mock('@/lib/snapshot-db', () => ({
  readSnapshot: async () => h.snap.value,
  writeSnapshot: async (data: unknown, updatedAt: number) => {
    h.snap.value = { data, updatedAt };
    return h.snap.value;
  },
  // Synchronous critical section: exactly one concurrent caller wins.
  acquireRefreshLock: async () => {
    if (h.lock.held) return false;
    h.lock.held = true;
    return true;
  },
  releaseRefreshLock: async () => {
    h.lock.held = false;
  },
}));

// refreshSnapshot() calls loadSweepstakeData exactly once per real upstream
// refresh, so counting it counts upstream hits. The tick makes concurrent
// callers genuinely overlap on the lock rather than running one at a time.
vi.mock('@/lib/load-data', () => ({
  loadSweepstakeData: vi.fn(async () => {
    h.upstream.count += 1;
    await new Promise((r) => setTimeout(r, 5));
    return { dataSource: 'live', ledger: {}, provisional: {} };
  }),
}));

import { getSnapshotForRead } from './refresh-snapshot';

beforeEach(() => {
  h.upstream.count = 0;
  h.lock.held = false;
  // Present but expired: readers serve it immediately while exactly one of them
  // refreshes inline, rather than all diving into a cold-start refresh.
  h.snap.value = { data: { ledger: {}, provisional: {} }, updatedAt: Date.now() - 60_000 };
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('snapshot read coalescing (stampede guard)', () => {
  it('collapses N concurrent reads of an expired snapshot into a single refresh', async () => {
    const N = 50;
    const results = await Promise.all(Array.from({ length: N }, () => getSnapshotForRead()));

    // The core budget guarantee: never more than one upstream refresh, no matter
    // how many readers arrive together.
    expect(h.upstream.count).toBeLessThanOrEqual(1);
    // And it did refresh once (the snapshot was expired), not zero.
    expect(h.upstream.count).toBe(1);

    // Every caller still receives a usable snapshot.
    expect(results).toHaveLength(N);
    for (const { snapshot } of results) {
      expect(snapshot.data).toBeDefined();
    }
  });
});
