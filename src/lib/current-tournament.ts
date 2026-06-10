import { buildGroupsFromFixtures } from '@/data/groups';
import { FIXTURES } from '@/data/fixtures';
import {
  fetchLiveTournamentData,
  isApiConfigured,
  type LiveTournamentData,
} from '@/lib/football-api';
import type { Fixture, LiveKnockoutMatch, TournamentGroups } from '@/types';

/**
 * Venue backfill. football-data.org (v4) does not expose a venue for any match
 * — the field is simply absent, so live fixtures arrive with `venue: 'TBC'`.
 * The static FIXTURES table carries the authoritative per-match stadium, keyed
 * by the (order-independent) team pairing, which is unique across the group
 * stage. We overlay it onto the live data so venues populate in production.
 */
const pairKey = (a: string, b: string): string => [a, b].sort().join(' :: ');
const VENUE_BY_PAIR = new Map(FIXTURES.map((f) => [pairKey(f.t1, f.t2), f.venue]));

function mergeVenues(fixtures: Fixture[]): Fixture[] {
  return fixtures.map((fixture) => {
    if (fixture.venue && fixture.venue !== 'TBC') return fixture;
    const venue = VENUE_BY_PAIR.get(pairKey(fixture.t1, fixture.t2));
    return venue ? { ...fixture, venue } : fixture;
  });
}

export async function loadCurrentTournamentData(): Promise<{
  fixtures: Fixture[];
  knockoutMatches: LiveKnockoutMatch[];
  extraScoringMatches: LiveTournamentData['extraScoringMatches'];
  dataSource: 'live' | 'static';
}> {
  if (isApiConfigured()) {
    const live = await fetchLiveTournamentData();
    if (live && live.fixtures.length > 0) {
      return {
        fixtures: mergeVenues(live.fixtures),
        knockoutMatches: live.knockoutMatches,
        extraScoringMatches: live.extraScoringMatches,
        dataSource: 'live',
      };
    }
  }

  return { fixtures: FIXTURES, knockoutMatches: [], extraScoringMatches: [], dataSource: 'static' };
}

export async function loadCurrentTournamentFixtures(): Promise<{
  fixtures: Fixture[];
  dataSource: 'live' | 'static';
}> {
  const { fixtures, dataSource } = await loadCurrentTournamentData();
  return { fixtures, dataSource };
}

export async function loadCurrentTournamentGroups(): Promise<TournamentGroups> {
  const { fixtures } = await loadCurrentTournamentFixtures();
  return buildGroupsFromFixtures(fixtures);
}
