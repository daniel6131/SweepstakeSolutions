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
import {
  buildKnockoutResultsFromLiveMatches,
  buildProjectedKnockoutBracket,
  getCompletedKnockoutScoringMatches,
  type ProjectedKnockoutBracket,
} from '@/lib/knockout';
import { loadCurrentTournamentData } from '@/lib/current-tournament';
import { computeGroupStandings, computeLeaderboard } from '@/lib/scoring';
import type {
  GroupId,
  GroupStanding,
  LeaderboardEntry,
  Participant,
  TournamentGroups,
} from '@/types';

export type SweepstakeData = {
  fixtures: Awaited<ReturnType<typeof loadCurrentTournamentData>>['fixtures'];
  groups: TournamentGroups;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
  standings: Record<GroupId, GroupStanding[]>;
  bracket: ProjectedKnockoutBracket;
  dataSource: 'live' | 'static';
  fetchedAt: string; // ISO timestamp
};

export async function loadSweepstakeData(): Promise<SweepstakeData> {
  const { fixtures, knockoutMatches, extraScoringMatches, dataSource } =
    await loadCurrentTournamentData();
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

  const standings = computeGroupStandings(fixtures, groups);
  const knockoutResults = buildKnockoutResultsFromLiveMatches(standings, knockoutMatches);
  const bracket = buildProjectedKnockoutBracket(standings, knockoutResults);
  const leaderboard = computeLeaderboard(
    [...fixtures, ...getCompletedKnockoutScoringMatches(bracket), ...extraScoringMatches],
    participants
  );

  return {
    fixtures,
    groups,
    participants,
    leaderboard,
    standings,
    bracket,
    dataSource,
    fetchedAt: new Date().toISOString(),
  };
}
