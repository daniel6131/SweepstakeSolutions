import { describe, expect, it } from 'vitest';

import { computeProvisional, isLiveFixture } from '@/lib/provisional';
import { computeLeaderboard } from '@/lib/scoring';
import type { Fixture, LiveKnockoutMatch, Participant } from '@/types';

const ROSTER: Participant[] = [
  { name: 'Ann', teams: ['Ann1'] },
  { name: 'Bob', teams: ['Bob1'] },
  { name: 'Cat', teams: ['Cat1'] },
];

function fixture(partial: Partial<Fixture> & Pick<Fixture, 't1' | 't2'>): Fixture {
  return {
    group: 'A',
    date: 'Jun 13',
    time: '15:00',
    venue: 'Stadium',
    s1: null,
    s2: null,
    ...partial,
  };
}

function knockout(
  partial: Partial<LiveKnockoutMatch> & Pick<LiveKnockoutMatch, 't1' | 't2'>
): LiveKnockoutMatch {
  return {
    roundKey: 'roundOf32',
    date: 'Jun 30',
    time: '20:00',
    utcDate: '2026-06-30T20:00:00Z',
    venue: 'Stadium',
    s1: null,
    s2: null,
    p1: null,
    p2: null,
    winner: null,
    status: 'scheduled',
    ...partial,
  };
}

/** Finished baseline: Ann won (3), Bob drew (1), Cat lost (0). */
const SETTLED: Fixture[] = [
  fixture({ t1: 'Ann1', t2: 'OppA', s1: 1, s2: 0, status: 'finished' }),
  fixture({ t1: 'Bob1', t2: 'OppB', s1: 0, s2: 0, status: 'finished' }),
  fixture({ t1: 'Cat1', t2: 'OppC', s1: 0, s2: 1, status: 'finished' }),
];

describe('computeProvisional', () => {
  it('is inert when nothing is in play', () => {
    const settled = computeLeaderboard(SETTLED, ROSTER);
    const prov = computeProvisional(settled, settled, [], ROSTER);

    expect(prov.active).toBe(false);
    expect(prov.reordered).toBe(false);
    expect(prov.liveOwnedMatchCount).toBe(0);
    expect(prov.liveMatches).toHaveLength(0);
    expect(prov.entries.every((e) => e.rankDelta === 0 && e.ptsDelta === 0)).toBe(true);
    expect(prov.entries.every((e) => e.liveTeams.length === 0)).toBe(true);
  });

  it("surfaces a player climbing past rivals on their team's live winner", () => {
    // Cat's team is winning 2-0 live, enough to leap Bob and edge Ann on goals.
    const live = fixture({ t1: 'Cat1', t2: 'OppD', s1: 2, s2: 0, status: 'live' });
    const settledBoard = computeLeaderboard(SETTLED, ROSTER);
    const liveBoard = computeLeaderboard([...SETTLED, live], ROSTER);

    const prov = computeProvisional(liveBoard, settledBoard, [live], ROSTER);

    expect(prov.active).toBe(true);
    expect(prov.reordered).toBe(true);
    expect(prov.liveOwnedMatchCount).toBe(1);
    expect(prov.liveMatches).toEqual([
      { group: 'A', t1: 'Cat1', t2: 'OppD', s1: 2, s2: 0, owner1: 'Cat', owner2: null },
    ]);

    const byName = new Map(prov.entries.map((e) => [e.name, e]));

    const cat = byName.get('Cat')!;
    expect(cat.settledRank).toBe(3);
    expect(cat.liveRank).toBe(1);
    expect(cat.rankDelta).toBe(2); // climbed two places
    expect(cat.ptsDelta).toBe(3); // a live win is worth three provisional points
    expect(cat.liveTeams).toEqual([
      { team: 'Cat1', opponent: 'OppD', group: 'A', gf: 2, ga: 0, state: 'winning' },
    ]);

    // Ann banked her points but is being overtaken live without kicking a ball.
    const ann = byName.get('Ann')!;
    expect(ann.rankDelta).toBe(-1);
    expect(ann.ptsDelta).toBe(0);
    expect(ann.liveTeams).toHaveLength(0);
  });

  it('treats a level live match as a one-point draw swing', () => {
    const live = fixture({ t1: 'Cat1', t2: 'OppD', s1: 1, s2: 1, status: 'live' });
    const settledBoard = computeLeaderboard(SETTLED, ROSTER);
    const liveBoard = computeLeaderboard([...SETTLED, live], ROSTER);

    const prov = computeProvisional(liveBoard, settledBoard, [live], ROSTER);
    const cat = prov.entries.find((e) => e.name === 'Cat')!;

    expect(cat.ptsDelta).toBe(1);
    expect(cat.liveTeams[0].state).toBe('drawing');
  });

  it('surfaces a live knockout shootout on the board without flagging a winner', () => {
    const settledBoard = computeLeaderboard(SETTLED, ROSTER);
    // Ann's team is in a live R32 shootout: level 1-1 on the pitch, 3-2 on pens.
    const ko = knockout({
      t1: 'Ann1',
      t2: 'OppK',
      s1: 1,
      s2: 1,
      p1: 3,
      p2: 2,
      status: 'live',
      detailedStatus: 'PENALTY_SHOOTOUT',
    });

    const prov = computeProvisional(settledBoard, settledBoard, [], ROSTER, [ko]);

    expect(prov.active).toBe(true);
    expect(prov.liveOwnedMatchCount).toBe(1);

    const ann = prov.entries.find((e) => e.name === 'Ann')!;
    expect(ann.liveTeams).toHaveLength(1);
    const swing = ann.liveTeams[0];
    expect(swing.gf).toBe(1);
    expect(swing.ga).toBe(1);
    expect(swing.state).toBe('drawing'); // neutral, penalties never read as win/lose
    expect(swing.isShootout).toBe(true);
    expect(swing.roundLabel).toBe('R32');
    expect(swing.pens).toBe(3);
    expect(swing.oppPens).toBe(2);

    // Display-only: a live knockout does not bank points or move ranks here.
    expect(ann.ptsDelta).toBe(0);
    expect(ann.rankDelta).toBe(0);
  });

  it('keeps a scheduled (not-yet-live) knockout match inert', () => {
    const settledBoard = computeLeaderboard(SETTLED, ROSTER);
    const ko = knockout({ t1: 'Ann1', t2: 'OppK', status: 'scheduled' });
    const prov = computeProvisional(settledBoard, settledBoard, [], ROSTER, [ko]);

    expect(prov.active).toBe(false);
    expect(prov.liveOwnedMatchCount).toBe(0);
    expect(prov.entries.every((e) => e.liveTeams.length === 0)).toBe(true);
  });
});

describe('isLiveFixture', () => {
  it('requires both a live status and a running score', () => {
    expect(isLiveFixture(fixture({ t1: 'A', t2: 'B', status: 'live', s1: 0, s2: 0 }))).toBe(true);
    expect(isLiveFixture(fixture({ t1: 'A', t2: 'B', status: 'live' }))).toBe(false); // no score yet
    expect(isLiveFixture(fixture({ t1: 'A', t2: 'B', status: 'finished', s1: 1, s2: 0 }))).toBe(
      false
    );
    expect(isLiveFixture(fixture({ t1: 'A', t2: 'B', s1: 1, s2: 0 }))).toBe(false); // static data
  });
});
