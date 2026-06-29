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

describe('knockout bracket ordering', () => {
  // The renderer draws the tree by pairing each round's adjacent matches
  // (matches[2i], matches[2i+1]) into the next round's matches[i], so the
  // arrays MUST be in bracket-tree order. These expected orders are the official
  // 2026 layout (in-order walk of the winner-feeds tree from the final).
  it('orders each round top-to-bottom by bracket position, not match number', () => {
    const bracket = buildProjectedKnockoutBracket(createCompleteStandings());
    const order = (key: string) =>
      bracket.rounds.find((round) => round.key === key)!.matches.map((m) => m.match);

    // prettier-ignore
    expect(order('roundOf32')).toEqual([
      74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87,
    ]);
    expect(order('roundOf16')).toEqual([89, 90, 93, 94, 91, 92, 95, 96]);
    expect(order('quarterFinals')).toEqual([97, 98, 99, 100]);
    expect(order('semiFinals')).toEqual([101, 102]);
    expect(order('final')).toEqual([104]);
  });

  it('keeps each adjacent R32 pair feeding the same R16 match', () => {
    const bracket = buildProjectedKnockoutBracket(createCompleteStandings());
    const r32 = bracket.rounds.find((round) => round.key === 'roundOf32')!.matches;
    // Official R16 feeds, in bracket order: 89←74,77 · 90←73,75 · 93←83,84 …
    // prettier-ignore
    const expectedPairs = [
      [74, 77], [73, 75], [83, 84], [81, 82], [76, 78], [79, 80], [86, 88], [85, 87],
    ];
    for (let i = 0; i < expectedPairs.length; i++) {
      expect([r32[i * 2].match, r32[i * 2 + 1].match]).toEqual(expectedPairs[i]);
    }
  });

  it('draws opposite-half teams (England and France) apart until the final', () => {
    const bracket = buildProjectedKnockoutBracket(createCompleteStandings());
    const r32 = bracket.rounds.find((round) => round.key === 'roundOf32')!.matches;
    const indexOfTeam = (team: string) =>
      r32.findIndex((m) => m.home.team === team || m.away.team === team);

    const france = indexOfTeam('France');
    const england = indexOfTeam('England');
    expect(france).toBeGreaterThanOrEqual(0);
    expect(england).toBeGreaterThanOrEqual(0);

    // 16 R32 matches: indices 0–7 are the top half (road to semi-final 1),
    // 8–15 the bottom half (semi-final 2). England and France are drawn into
    // opposite halves, so the bracket must seat them on different sides — they
    // can only meet in the final.
    const inTopHalf = (index: number) => index < 8;
    expect(inTopHalf(france)).not.toBe(inTopHalf(england));
  });
});

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

  it('overlays the real fixtures onto the full bracket at the right positions', () => {
    const standings = createCompleteStandings();
    const bracket = buildKnockoutBracketFromLive(standings, LIVE_SAMPLE);

    // The whole bracket is shown (the road to the final), not just the games
    // that have been drawn — undrawn slots stay as projected placeholders.
    const r32 = bracket.rounds.find((round) => round.key === 'roundOf32')!;
    expect(r32.matches).toHaveLength(16);

    // South Korea vs Switzerland is the real A2 v B2 game → bracket match 73,
    // carrying its real teams, kickoff and score from the feed.
    const m73 = r32.matches.find((m) => m.match === 73)!;
    expect(m73.home.team).toBe('South Korea');
    expect(m73.away.team).toBe('Switzerland');
    expect(m73.date).toBe('Jun 28');
    expect(m73.time).toBe('18:00');
    expect(m73.homeScore).toBe(1);
    expect(m73.awayScore).toBe(2);
    expect(m73.winner).toBe('away');
    expect(m73.isPlayed).toBe(true);

    // Netherlands vs Morocco is F1 v C2 → bracket match 75.
    const m75 = r32.matches.find((m) => m.match === 75)!;
    expect(m75.home.team).toBe('Netherlands');
    expect(m75.winner).toBe('home');

    // The R16 game feeds off the right R32 winners: match 90 = W73 (Switzerland)
    // v W75 (Netherlands), with Netherlands winning per the live feed.
    const m90 = bracket.rounds
      .find((round) => round.key === 'roundOf16')!
      .matches.find((m) => m.match === 90)!;
    expect(m90.home.team).toBe('Switzerland');
    expect(m90.away.team).toBe('Netherlands');
    expect(m90.winner).toBe('away');
    expect(m90.utcDate).toBe('2026-07-04T18:00:00Z');
  });

  it('leaves a not-yet-drawn round as projected placeholders without scores', () => {
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

    // A live game with no teams yet can't be placed, so the full R16 still
    // renders as projected placeholders rather than collapsing to one card.
    const r16 = bracket.rounds.find((round) => round.key === 'roundOf16')!;
    expect(r16.matches).toHaveLength(8);
    expect(r16.matches.every((m) => !m.isPlayed)).toBe(true);
    const match = r16.matches[0];
    expect(match.home.team).toBeNull();
    expect(match.home.status).toBe('placeholder');
    expect(match.isReady).toBe(false);
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
