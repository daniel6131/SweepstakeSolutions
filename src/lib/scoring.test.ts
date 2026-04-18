import { computeLeaderboard } from './scoring';
import type { ScoringMatch } from './scoring';

describe('computeLeaderboard', () => {
  const participants = [
    { name: 'Alice', teams: ['Brazil', 'France'] },
    { name: 'Bob', teams: ['England', 'Germany'] },
  ];

  function makeFixture(t1: string, s1: number, t2: string, s2: number): ScoringMatch {
    return { t1, s1, t2, s2 };
  }

  it('returns one entry per participant', () => {
    const result = computeLeaderboard([], participants);
    expect(result).toHaveLength(2);
  });

  it('awards 3 pts for a win', () => {
    const fixtures = [makeFixture('Brazil', 2, 'England', 0)];
    const result = computeLeaderboard(fixtures, participants);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.pts).toBe(3);
    expect(alice.w).toBe(1);
  });

  it('awards 1 pt each for a draw', () => {
    const fixtures = [makeFixture('Brazil', 1, 'England', 1)];
    const result = computeLeaderboard(fixtures, participants);
    const alice = result.find((e) => e.name === 'Alice')!;
    const bob = result.find((e) => e.name === 'Bob')!;
    expect(alice.pts).toBe(1);
    expect(bob.pts).toBe(1);
  });

  it('accumulates stats from multiple teams per participant', () => {
    const fixtures = [
      makeFixture('Brazil', 3, 'England', 0),
      makeFixture('France', 2, 'Germany', 1),
    ];
    const result = computeLeaderboard(fixtures, participants);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.pts).toBe(6);
    expect(alice.gf).toBe(5);
    expect(alice.ga).toBe(1);
    expect(alice.gd).toBe(4);
  });

  it('sorts by points descending', () => {
    const fixtures = [makeFixture('Brazil', 1, 'England', 0)];
    const result = computeLeaderboard(fixtures, participants);
    expect(result[0]!.name).toBe('Alice');
  });

  it('ignores pending fixtures (null scores)', () => {
    const fixtures: ScoringMatch[] = [{ t1: 'Brazil', s1: null, t2: 'England', s2: null }];
    const result = computeLeaderboard(fixtures, participants);
    result.forEach((e) => expect(e.pts).toBe(0));
  });
});
