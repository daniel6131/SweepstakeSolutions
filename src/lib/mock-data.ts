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
import { computeProvisional, isLiveFixture } from '@/lib/provisional';
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

/** How many matches the demo puts "in play" to show off Provisional Hell. */
const DEMO_LIVE_MATCHES = 5;

export function mockSweepstakeData(data: SweepstakeData): SweepstakeData {
  const rng = makeRng(20260611);

  // 1. Every match kicks off finished with a plausible scoreline.
  const fixtures: Fixture[] = data.fixtures.map((fixture) => ({
    ...fixture,
    s1: mockGoals(rng),
    s2: mockGoals(rng),
    status: 'finished' as const,
  }));

  // 2. Send a handful of matches "live" with a decisive scoreline for a
  //    lower-table owner, so the if-it-ended-now overlay visibly reshuffles the
  //    board (live banner + movement arrows + live team chips). Lower-mid
  //    players are the most fun to watch surge.
  const settledOrder = computeLeaderboard(fixtures, data.participants).map((entry) => entry.name);
  const surgers = settledOrder.slice(6, 11);
  const liveIndices = new Set<number>();

  for (const name of surgers) {
    if (liveIndices.size >= DEMO_LIVE_MATCHES) break;
    const teams = data.participants.find((participant) => participant.name === name)?.teams ?? [];
    const index = fixtures.findIndex(
      (fixture, i) =>
        !liveIndices.has(i) && (teams.includes(fixture.t1) || teams.includes(fixture.t2))
    );
    if (index === -1) continue;

    liveIndices.add(index);
    const fixture = fixtures[index];
    const ownsHome = teams.includes(fixture.t1);
    // Pin kickoff to ~37 min ago so the demo shows a realistic first-half clock
    // (~37') on the live cards + leaderboard chips instead of a bare "LIVE".
    const kickoffMs = Date.now() - 37 * 60_000;
    fixtures[index] = {
      ...fixture,
      status: 'live',
      detailedStatus: 'IN_PLAY',
      halfTimeRecorded: false,
      utcDate: new Date(kickoffMs).toISOString(),
      s1: ownsHome ? 2 : 0,
      s2: ownsHome ? 0 : 2,
    };
  }

  const standings = computeGroupStandings(fixtures, data.groups);
  const bracket = buildProjectedKnockoutBracket(standings);
  const leaderboard = computeLeaderboard(fixtures, data.participants);
  const ledger = computeLedgerOfFate(fixtures, data.participants);

  const settledLeaderboard = computeLeaderboard(
    fixtures.filter((fixture) => fixture.status !== 'live'),
    data.participants
  );
  const provisional = computeProvisional(
    leaderboard,
    settledLeaderboard,
    fixtures.filter(isLiveFixture),
    data.participants
  );

  return {
    ...data,
    fixtures,
    standings,
    bracket,
    leaderboard,
    ledger,
    provisional,
    liveMatchCount: liveIndices.size,
    dataSource: 'live',
  };
}
