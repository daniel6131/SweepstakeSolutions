/**
 * Server-side data loader
 *
 * Attempts to fetch live data from football-data.org.
 * Falls back to static fixture data if the API is unavailable.
 *
 * This runs on the server during ISR (Incremental Static Regeneration),
 * so the page rebuilds with fresh scores every `revalidate` seconds.
 */

import { FIXTURES } from '@/data/fixtures';
import { fetchLiveFixtures, isApiConfigured } from '@/lib/football-api';
import { computeGroupStandings, computeLeaderboard } from '@/lib/scoring';
import type { Fixture, GroupId, GroupStanding, LeaderboardEntry } from '@/types';

export type SweepstakeData = {
  fixtures: Fixture[];
  leaderboard: LeaderboardEntry[];
  standings: Record<GroupId, GroupStanding[]>;
  dataSource: 'live' | 'static';
  fetchedAt: string; // ISO timestamp
};

export async function loadSweepstakeData(): Promise<SweepstakeData> {
  let fixtures: Fixture[] = FIXTURES;
  let dataSource: 'live' | 'static' = 'static';

  // Try live API if configured
  if (isApiConfigured()) {
    const live = await fetchLiveFixtures();
    if (live && live.length > 0) {
      fixtures = live;
      dataSource = 'live';
    }
  }

  const leaderboard = computeLeaderboard(fixtures);
  const standings = computeGroupStandings(fixtures);

  return {
    fixtures,
    leaderboard,
    standings,
    dataSource,
    fetchedAt: new Date().toISOString(),
  };
}
