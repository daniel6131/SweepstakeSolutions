/**
 * TEMPORARY demo helper — fills the whole app with a plausible "group stage
 * complete" snapshot so all four tabs can be previewed populated before the
 * tournament starts. Activated via the `?demo` query param in HomeClient.
 *
 * It only fabricates fixture scores, then runs the REAL scoring/standings/
 * bracket logic, so every screen stays internally consistent. Safe to delete
 * this file and the `demo` wiring in HomeClient once previewing is done.
 */
import { buildProjectedKnockoutBracket } from '@/lib/knockout';
import { computeLedgerOfFate } from '@/lib/ledger-of-fate';
import type { SweepstakeData } from '@/lib/load-data';
import { computeGroupStandings, computeLeaderboard } from '@/lib/scoring';
import type { Fixture } from '@/types';

/** Tiny deterministic PRNG so the demo data is stable across renders/reloads. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function mockGoals(rng: () => number): number {
  const r = rng();
  if (r < 0.42) return 0;
  if (r < 0.72) return 1;
  if (r < 0.89) return 2;
  if (r < 0.97) return 3;
  return 4;
}

export function mockSweepstakeData(data: SweepstakeData): SweepstakeData {
  const rng = makeRng(20260611);
  const fixtures: Fixture[] = data.fixtures.map((fixture) => ({
    ...fixture,
    s1: mockGoals(rng),
    s2: mockGoals(rng),
  }));

  const standings = computeGroupStandings(fixtures, data.groups);
  const bracket = buildProjectedKnockoutBracket(standings);
  const leaderboard = computeLeaderboard(fixtures, data.participants);
  const ledger = computeLedgerOfFate(fixtures, data.participants);

  return { ...data, fixtures, standings, bracket, leaderboard, ledger };
}
