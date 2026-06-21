import { describe, expect, it } from 'vitest';

import { computeProvisional, isLiveFixture } from '@/lib/provisional';
import { computeLeaderboard } from '@/lib/scoring';
import type { Fixture, Participant } from '@/types';

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
