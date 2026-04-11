import { describe, expect, it } from 'vitest';

import { GROUPS } from '@/data/groups';
import { PARTICIPANTS } from '@/data/participants';
import {
  buildKnockoutResultsFromLiveMatches,
  buildProjectedKnockoutBracket,
  getCompletedKnockoutScoringMatches,
} from '@/lib/knockout';
import { computeLeaderboard } from '@/lib/scoring';
import type { GroupId, GroupStanding } from '@/types';

function createCompleteStandings(): Record<GroupId, GroupStanding[]> {
  return Object.fromEntries(
    Object.entries(GROUPS).map(([group, teams]) => [
      group,
      [
        { team: teams[0], p: 3, w: 3, d: 0, l: 0, gf: 8, ga: 2, pts: 9 },
        { team: teams[1], p: 3, w: 2, d: 0, l: 1, gf: 5, ga: 3, pts: 6 },
        { team: teams[2], p: 3, w: 1, d: 0, l: 2, gf: 3, ga: 5, pts: 3 },
        { team: teams[3], p: 3, w: 0, d: 0, l: 3, gf: 1, ga: 7, pts: 0 },
      ],
    ])
  ) as Record<GroupId, GroupStanding[]>;
}

describe('buildKnockoutResultsFromLiveMatches', () => {
  it('maps live knockout matches onto the internal bracket round by round', () => {
    const standings = createCompleteStandings();

    const results = buildKnockoutResultsFromLiveMatches(standings, [
      {
        roundKey: 'roundOf32',
        t1: 'South Korea',
        t2: 'Switzerland',
        date: 'Jun 28',
        time: '18:00',
        venue: 'Los Angeles Stadium',
        s1: 1,
        s2: 2,
        winner: 't2',
        status: 'finished',
      },
      {
        roundKey: 'roundOf32',
        t1: 'Netherlands',
        t2: 'Morocco',
        date: 'Jun 29',
        time: '18:00',
        venue: 'Estadio Monterrey',
        s1: 3,
        s2: 0,
        winner: 't1',
        status: 'finished',
      },
      {
        roundKey: 'roundOf16',
        t1: 'Netherlands',
        t2: 'Switzerland',
        date: 'Jul 4',
        time: '18:00',
        venue: 'Houston Stadium',
        s1: 1,
        s2: 0,
        winner: 't1',
        status: 'finished',
      },
    ]);

    expect(results).toEqual({
      73: { homeScore: 1, awayScore: 2, winner: 'away' },
      75: { homeScore: 3, awayScore: 0, winner: 'home' },
      90: { homeScore: 0, awayScore: 1, winner: 'away' },
    });
  });

  it('feeds completed knockout results back into leaderboard scoring', () => {
    const standings = createCompleteStandings();
    const knockoutResults = buildKnockoutResultsFromLiveMatches(standings, [
      {
        roundKey: 'roundOf32',
        t1: 'South Korea',
        t2: 'Switzerland',
        date: 'Jun 28',
        time: '18:00',
        venue: 'Los Angeles Stadium',
        s1: 1,
        s2: 2,
        winner: 't2',
        status: 'finished',
      },
      {
        roundKey: 'roundOf32',
        t1: 'Netherlands',
        t2: 'Morocco',
        date: 'Jun 29',
        time: '18:00',
        venue: 'Estadio Monterrey',
        s1: 3,
        s2: 0,
        winner: 't1',
        status: 'finished',
      },
      {
        roundKey: 'roundOf16',
        t1: 'Netherlands',
        t2: 'Switzerland',
        date: 'Jul 4',
        time: '18:00',
        venue: 'Houston Stadium',
        s1: 1,
        s2: 0,
        winner: 't1',
        status: 'finished',
      },
    ]);

    const bracket = buildProjectedKnockoutBracket(standings, knockoutResults);
    const leaderboard = computeLeaderboard(
      [
        ...getCompletedKnockoutScoringMatches(bracket),
        { t1: 'Portugal', t2: 'Colombia', s1: 2, s2: 1, winner: 't1' },
      ],
      PARTICIPANTS
    );

    const michael = leaderboard.find((entry) => entry.name === 'Michael');
    const nathan = leaderboard.find((entry) => entry.name === 'Nathan');
    const daniel = leaderboard.find((entry) => entry.name === 'Daniel');
    const littleJohn = leaderboard.find((entry) => entry.name === 'Little John');

    expect(littleJohn?.pts).toBe(6);
    expect(littleJohn?.w).toBe(2);
    expect(nathan?.pts).toBe(3);
    expect(nathan?.l).toBe(1);
    expect(daniel?.pts).toBe(0);
    expect(michael?.pts).toBe(3);
  });
});
