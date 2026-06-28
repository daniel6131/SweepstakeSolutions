import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchLiveFixtures, fetchLiveTournamentData } from './football-api';

// The contract that keeps match day alive: every upstream failure resolves to
// null (caller falls back to last-good/static), never throws. A 429 also needs
// its own log line so I can alert on the rate limit.
beforeEach(() => {
  process.env.FOOTBALL_DATA_API_KEY = 'test-key';
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.FOOTBALL_DATA_API_KEY;
});

describe('football-api degrade-to-null contract', () => {
  it('returns null on a 429 and logs a distinct RATE_LIMIT_429 signal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('rate limited', { status: 429 }))
    );
    const errorSpy = console.error as unknown as ReturnType<typeof vi.fn>;

    await expect(fetchLiveTournamentData()).resolves.toBeNull();

    const logged = errorSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(logged).toContain('RATE_LIMIT_429');
  });

  it('returns null on a 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('server error', { status: 500 }))
    );
    await expect(fetchLiveTournamentData()).resolves.toBeNull();
  });

  it('returns null on a network error rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNRESET');
      })
    );
    await expect(fetchLiveFixtures()).resolves.toBeNull();
  });

  it('retries once on a transient 5xx before degrading', async () => {
    const fetchMock = vi.fn(async () => new Response('server error', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchLiveTournamentData()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 429 (respects the rate limit)', async () => {
    const fetchMock = vi.fn(async () => new Response('rate limited', { status: 429 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchLiveTournamentData()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
