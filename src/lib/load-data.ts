/**
 * Server-side data loader
 *
 * Attempts to fetch live data from football-data.org.
 * Falls back to static fixture data if the API is unavailable.
 *
 * If the draft ceremony is locked, uses those team assignments
 * instead of the hardcoded participant data.
 */

import { buildGroupsFromFixtures } from '@/data/groups';
import { PARTICIPANTS } from '@/data/participants';
import { getLockedAssignments } from '@/lib/draft-db';
import { loadCurrentTournamentFixtures } from '@/lib/current-tournament';
import { computeGroupStandings, computeLeaderboard } from '@/lib/scoring';
import type {
  GroupId,
  GroupStanding,
  LeaderboardEntry,
  Participant,
  TournamentGroups,
} from '@/types';

export type SweepstakeData = {
  fixtures: Awaited<ReturnType<typeof loadCurrentTournamentFixtures>>['fixtures'];
  groups: TournamentGroups;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
  standings: Record<GroupId, GroupStanding[]>;
  dataSource: 'live' | 'static';
  fetchedAt: string; // ISO timestamp
};

export async function loadSweepstakeData(): Promise<SweepstakeData> {
  const { fixtures, dataSource } = await loadCurrentTournamentFixtures();
  const groups = buildGroupsFromFixtures(fixtures);

  // Check for locked draft assignments (overrides hardcoded participants)
  let participants = PARTICIPANTS;
  try {
    const locked = getLockedAssignments();
    if (locked && locked.length > 0) {
      participants = locked;
    }
  } catch {
    // Draft DB not available — use defaults
  }

  const leaderboard = computeLeaderboard(fixtures, participants);
  const standings = computeGroupStandings(fixtures, groups);

  return {
    fixtures,
    groups,
    participants,
    leaderboard,
    standings,
    dataSource,
    fetchedAt: new Date().toISOString(),
  };
}
