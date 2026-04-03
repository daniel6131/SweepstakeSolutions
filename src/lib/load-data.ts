/**
 * Server-side data loader
 *
 * Attempts to fetch live data from football-data.org.
 * Falls back to static fixture data if the API is unavailable.
 *
 * If the draft ceremony is locked, uses those team assignments
 * instead of the hardcoded participant data.
 */

import { FIXTURES } from '@/data/fixtures';
import { getLockedAssignments } from '@/lib/draft-db';
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

  // Check for locked draft assignments (overrides hardcoded participants)
  let draftParticipants;
  try {
    const locked = getLockedAssignments();
    if (locked && locked.length > 0) {
      draftParticipants = locked;
    }
  } catch {
    // Draft DB not available — use defaults
  }

  const leaderboard = computeLeaderboard(fixtures, draftParticipants || undefined);
  const standings = computeGroupStandings(fixtures);

  return {
    fixtures,
    leaderboard,
    standings,
    dataSource,
    fetchedAt: new Date().toISOString(),
  };
}
