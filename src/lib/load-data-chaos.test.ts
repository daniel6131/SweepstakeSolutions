import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PARTICIPANTS } from '@/data/participants';

// Keep the draft layer deterministic (no KV / local file): no locked draft, so
// the canonical PARTICIPANTS are used.
vi.mock('@/lib/draft-db', () => ({
  getLockedAssignments: async () => null,
}));

import { loadSweepstakeData } from './load-data';

// Pretend football-data is fully down (everything 429s) and check the loader
// still hands back complete data from static fixtures without throwing. The
// end-to-end version of the degrade contract.
beforeEach(() => {
  process.env.FOOTBALL_DATA_API_KEY = 'test-key';
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('rate limited', { status: 429 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.FOOTBALL_DATA_API_KEY;
});

describe('loadSweepstakeData under upstream outage', () => {
  it('degrades to static fixtures and returns complete data', async () => {
    const data = await loadSweepstakeData();

    expect(data.dataSource).toBe('static');
    expect(data.fixtures.length).toBeGreaterThan(0);
    expect(data.leaderboard.length).toBe(PARTICIPANTS.length);
    expect(Object.keys(data.standings).length).toBeGreaterThan(0);
    expect(data.bracket).toBeDefined();
    expect(data.ledger).toBeDefined();
    expect(data.provisional).toBeDefined();
  });
});
