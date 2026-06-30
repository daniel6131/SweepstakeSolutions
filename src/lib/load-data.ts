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
  buildKnockoutBracketFromLive,
  getCompletedKnockoutScoringMatches,
  type ProjectedKnockoutBracket,
} from '@/lib/knockout';
import { loadCurrentTournamentData } from '@/lib/current-tournament';
import { computeLedgerOfFate } from '@/lib/ledger-of-fate';
import { computeProvisional, isLiveFixture } from '@/lib/provisional';
import { computeGroupStandings, computeLeaderboard } from '@/lib/scoring';
import type { LedgerOfFate } from '@/lib/ledger-of-fate';
import type { Provisional } from '@/lib/provisional';
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
  ledger: LedgerOfFate;
  /** Live "if it ended now" overlay: the leaderboard diffed against a finished-only baseline. */
  provisional: Provisional;
  standings: Record<GroupId, GroupStanding[]>;
  bracket: ProjectedKnockoutBracket;
  dataSource: 'live' | 'static';
  /** Matches currently in play — > 0 means the UI shows a pulsing "LIVE" badge. */
  liveMatchCount: number;
  fetchedAt: string; // ISO timestamp
};

export async function loadSweepstakeData(): Promise<SweepstakeData> {
  const { fixtures, knockoutMatches, extraScoringMatches, liveMatchCount, dataSource } =
    await loadCurrentTournamentData();
  const groups = buildGroupsFromFixtures(fixtures);

  // Check for locked draft assignments (overrides hardcoded participants)
  let participants = PARTICIPANTS;
  try {
    const locked = await getLockedAssignments();
    if (locked && locked.length > 0) {
      participants = locked;
    }
  } catch {
    // Draft DB not available — use defaults
  }

  const standings = computeGroupStandings(fixtures, groups);
  // Once the knockouts exist in the feed, build the bracket from the real
  // fixtures (teams, dates, times, scores); otherwise project from standings.
  const bracket = buildKnockoutBracketFromLive(standings, knockoutMatches);
  const scoringMatches = [
    ...fixtures,
    ...getCompletedKnockoutScoringMatches(bracket),
    ...extraScoringMatches,
  ];
  const leaderboard = computeLeaderboard(scoringMatches, participants);
  const ledger = computeLedgerOfFate(scoringMatches, participants);

  // Provisional Hell: the displayed `leaderboard` already folds in live scores
  // (an in-play match arrives with its running score), so it IS the "if it
  // ended now" table. We recompute a finished-only baseline and diff them so the
  // UI can show who is climbing or being overtaken live. The two tables differ
  // only by live GROUP fixtures (live knockout/third-place matches aren't scored
  // until they finish), which is exactly the group-stage window this targets.
  const liveFixtures = fixtures.filter(isLiveFixture);
  const liveKnockoutMatches = knockoutMatches.filter((match) => match.status === 'live');
  const settledScoringMatches = [
    ...fixtures.filter((f) => f.status !== 'live'),
    ...getCompletedKnockoutScoringMatches(bracket),
    ...extraScoringMatches,
  ];
  const settledLeaderboard = computeLeaderboard(settledScoringMatches, participants);
  const provisional = computeProvisional(
    leaderboard,
    settledLeaderboard,
    liveFixtures,
    participants,
    liveKnockoutMatches
  );

  return {
    fixtures,
    groups,
    participants,
    leaderboard,
    ledger,
    provisional,
    standings,
    bracket,
    dataSource,
    liveMatchCount,
    fetchedAt: new Date().toISOString(),
  };
}
