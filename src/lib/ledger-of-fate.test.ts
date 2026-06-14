import { computeLedgerOfFate } from './ledger-of-fate';
import type { ScoringMatch } from './scoring';

describe('computeLedgerOfFate', () => {
  // Each player holds one team from each pot, the balanced hand the draft deals.
  const participants = [
    { name: 'Alice', teams: ['Brazil', 'Croatia', 'Norway', 'Ghana'] }, // pots 1,2,3,4
    { name: 'Bob', teams: ['France', 'Morocco', 'Panama', 'Haiti'] }, // pots 1,2,3,4
  ];

  function makeFixture(t1: string, s1: number, t2: string, s2: number): ScoringMatch {
    return { t1, s1, t2, s2 };
  }

  it('returns one entry per participant, each with four graded teams', () => {
    const ledger = computeLedgerOfFate([], participants);
    expect(ledger.entries).toHaveLength(2);
    ledger.entries.forEach((entry) => expect(entry.teams).toHaveLength(4));
  });

  it('orders each hand Pot 1 → Pot 4', () => {
    const ledger = computeLedgerOfFate([], participants);
    const alice = ledger.entries.find((e) => e.name === 'Alice')!;
    expect(alice.teams.map((t) => t.pot)).toEqual([1, 2, 3, 4]);
  });

  it('grades every draw PAR before its pot has any results', () => {
    const ledger = computeLedgerOfFate([], participants);
    ledger.entries.forEach((entry) =>
      entry.teams.forEach((team) => expect(team.verdict).toBe('PAR'))
    );
    expect(ledger.potAverages[1]).toBe(0);
  });

  it('computes pot par as the mean points of all 12 teams in the pot', () => {
    // Brazil 3-0 France → 3 pts in pot 1, everyone else 0 → avg 3/12.
    const ledger = computeLedgerOfFate([makeFixture('Brazil', 3, 'France', 0)], participants);
    expect(ledger.potAverages[1]).toBeCloseTo(0.25, 5);
  });

  it('stamps GIFTED for the best team in a tier and ROBBED for the worst', () => {
    const ledger = computeLedgerOfFate([makeFixture('Brazil', 3, 'France', 0)], participants);
    const alice = ledger.entries.find((e) => e.name === 'Alice')!;
    const bob = ledger.entries.find((e) => e.name === 'Bob')!;

    const brazil = alice.teams.find((t) => t.team === 'Brazil')!;
    expect(brazil.potRank).toBe(1);
    expect(brazil.verdict).toBe('GIFTED');

    const france = bob.teams.find((t) => t.team === 'France')!;
    expect(france.potRank).toBe(12); // worst goal difference in pot 1
    expect(france.verdict).toBe('ROBBED');
  });

  it('sets fateDelta to actual points minus par', () => {
    const ledger = computeLedgerOfFate([makeFixture('Brazil', 3, 'France', 0)], participants);
    const alice = ledger.entries.find((e) => e.name === 'Alice')!;
    expect(alice.actualPts).toBe(3);
    expect(alice.parPts).toBeCloseTo(0.25, 5); // only pot 1 has any points
    expect(alice.fateDelta).toBeCloseTo(2.75, 5);
  });

  it('does not diverge from the leaderboard when every hand is balanced', () => {
    const ledger = computeLedgerOfFate([makeFixture('Brazil', 3, 'France', 0)], participants);
    expect(ledger.divergesFromLeaderboard).toBe(false);
    expect(ledger.entries[0]!.name).toBe('Alice'); // sorted by raw points
  });

  it('lists all 12 pot teams ranked and owner-tagged, matching the hand cards', () => {
    const ledger = computeLedgerOfFate([makeFixture('Brazil', 3, 'France', 0)], participants);
    const pot1 = ledger.leagues[1];
    expect(pot1).toHaveLength(12); // every team in the tier, gap-free
    // Brazil tops pot 1; France is bottom of the 12 (worst goal difference).
    expect(pot1[0]).toMatchObject({ name: 'Alice', team: 'Brazil', pts: 3, rank: 1 });
    expect(pot1[11]).toMatchObject({ name: 'Bob', team: 'France', pts: 0, rank: 12 });
    expect(pot1.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    // A league row's rank must equal the same team's potRank on its owner's hand.
    const bob = ledger.entries.find((e) => e.name === 'Bob')!;
    const franceOnHand = bob.teams.find((t) => t.team === 'France')!;
    expect(pot1[11]!.rank).toBe(franceOnHand.potRank);
  });

  it('handles an uneven (traded) hand with two teams from one pot', () => {
    const traded = [{ name: 'Cara', teams: ['Brazil', 'France', 'Norway', 'Ghana'] }]; // pots 1,1,3,4
    const ledger = computeLedgerOfFate([makeFixture('Brazil', 3, 'France', 0)], traded);
    const cara = ledger.entries[0]!;
    expect(cara.teams.filter((t) => t.pot === 1)).toHaveLength(2);
    // par counts pot 1 twice: 2 × 0.25, pots 3 & 4 contribute 0.
    expect(cara.parPts).toBeCloseTo(0.5, 5);
  });
});
