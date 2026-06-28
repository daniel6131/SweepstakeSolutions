import { describe, expect, it } from 'vitest';

import { GROUPS } from '@/data/groups';
import { PARTICIPANTS } from '@/data/participants';
import {
  buildKnockoutBracketFromLive,
  buildKnockoutResultsFromLiveMatches,
  buildProjectedKnockoutBracket,
  getCompletedKnockoutScoringMatches,
} from '@/lib/knockout';
import { computeLeaderboard } from '@/lib/scoring';
import type { GroupId, GroupStanding, LiveKnockoutMatch } from '@/types';

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

function liveMatch(
  over: Partial<LiveKnockoutMatch> & Pick<LiveKnockoutMatch, 'roundKey'>
): LiveKnockoutMatch {
  return {
    t1: 'South Korea',
    t2: 'Switzerland',
    date: 'Jun 28',
    time: '18:00',
    utcDate: '2026-06-28T18:00:00Z',
    venue: 'TBC',
    s1: null,
    s2: null,
    winner: null,
    status: 'scheduled',
    ...over,
  };
}

const LIVE_SAMPLE: LiveKnockoutMatch[] = [
  liveMatch({
    roundKey: 'roundOf32',
    t1: 'South Korea',
    t2: 'Switzerland',
    date: 'Jun 28',
    utcDate: '2026-06-28T18:00:00Z',
    s1: 1,
    s2: 2,
    winner: 't2',
    status: 'finished',
  }),
  liveMatch({
    roundKey: 'roundOf32',
    t1: 'Netherlands',
    t2: 'Morocco',
    date: 'Jun 29',
    utcDate: '2026-06-29T18:00:00Z',
    s1: 3,
    s2: 0,
    winner: 't1',
    status: 'finished',
  }),
  liveMatch({
    roundKey: 'roundOf16',
    t1: 'Netherlands',
    t2: 'Switzerland',
    date: 'Jul 4',
    utcDate: '2026-07-04T18:00:00Z',
    s1: 1,
    s2: 0,
    winner: 't1',
    status: 'finished',
  }),
];

describe('buildKnockoutResultsFromLiveMatches', () => {
  it('maps live knockout matches onto the internal bracket round by round', () => {
    const standings = createCompleteStandings();
    const results = buildKnockoutResultsFromLiveMatches(standings, LIVE_SAMPLE);

    expect(results).toEqual({
      73: { homeScore: 1, awayScore: 2, winner: 'away' },
      75: { homeScore: 3, awayScore: 0, winner: 'home' },
      90: { homeScore: 0, awayScore: 1, winner: 'away' },
    });
  });

  it('feeds completed knockout results back into leaderboard scoring', () => {
    const standings = createCompleteStandings();
    const knockoutResults = buildKnockoutResultsFromLiveMatches(standings, LIVE_SAMPLE);

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

describe('buildKnockoutBracketFromLive', () => {
  it('falls back to the projection when there are no live knockout matches', () => {
    const standings = createCompleteStandings();
    const fromLive = buildKnockoutBracketFromLive(standings, []);
    const projected = buildProjectedKnockoutBracket(standings);
    expect(fromLive.rounds.map((r) => r.key)).toEqual(projected.rounds.map((r) => r.key));
  });

  it('builds the bracket from the real fixtures (teams, dates, times, scores)', () => {
    const standings = createCompleteStandings();
    const bracket = buildKnockoutBracketFromLive(standings, LIVE_SAMPLE);

    const r32 = bracket.rounds.find((round) => round.key === 'roundOf32');
    expect(r32?.matches).toHaveLength(2);

    // ordered by kickoff, real teams/dates/times carried through from the feed
    const [first, second] = r32!.matches;
    expect(first.home.team).toBe('South Korea');
    expect(first.away.team).toBe('Switzerland');
    expect(first.date).toBe('Jun 28');
    expect(first.time).toBe('18:00');
    expect(first.homeScore).toBe(1);
    expect(first.awayScore).toBe(2);
    expect(first.winner).toBe('away');
    expect(first.isPlayed).toBe(true);

    expect(second.home.team).toBe('Netherlands');
    expect(second.winner).toBe('home');
  });

  it('renders a not-yet-determined match as TBD without a score', () => {
    const standings = createCompleteStandings();
    const bracket = buildKnockoutBracketFromLive(standings, [
      liveMatch({
        roundKey: 'roundOf16',
        t1: '',
        t2: '',
        date: 'Jul 4',
        utcDate: '2026-07-04T17:00:00Z',
        s1: null,
        s2: null,
        winner: null,
        status: 'scheduled',
      }),
    ]);

    const r16 = bracket.rounds.find((round) => round.key === 'roundOf16');
    const match = r16!.matches[0];
    expect(match.home.team).toBeNull();
    expect(match.home.status).toBe('placeholder');
    expect(match.isReady).toBe(false);
    expect(match.isPlayed).toBe(false);
    expect(match.date).toBe('Jul 4');
  });

  it('completed live knockout matches still feed leaderboard scoring', () => {
    const standings = createCompleteStandings();
    const bracket = buildKnockoutBracketFromLive(standings, LIVE_SAMPLE);
    const scoring = getCompletedKnockoutScoringMatches(bracket);
    // 2 finished R32 + 1 finished R16
    expect(scoring).toHaveLength(3);
    expect(scoring).toContainEqual({
      t1: 'South Korea',
      t2: 'Switzerland',
      s1: 1,
      s2: 2,
      winner: 't2',
    });
  });
});
