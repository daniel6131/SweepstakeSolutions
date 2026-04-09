import { buildGroupsFromFixtures } from '@/data/groups';
import { FIXTURES } from '@/data/fixtures';
import { fetchLiveFixtures, isApiConfigured } from '@/lib/football-api';
import type { Fixture, TournamentGroups } from '@/types';

export async function loadCurrentTournamentFixtures(): Promise<{
  fixtures: Fixture[];
  dataSource: 'live' | 'static';
}> {
  if (isApiConfigured()) {
    const live = await fetchLiveFixtures();
    if (live && live.length > 0) {
      return { fixtures: live, dataSource: 'live' };
    }
  }

  return { fixtures: FIXTURES, dataSource: 'static' };
}

export async function loadCurrentTournamentGroups(): Promise<TournamentGroups> {
  const { fixtures } = await loadCurrentTournamentFixtures();
  return buildGroupsFromFixtures(fixtures);
}
