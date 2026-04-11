import { buildGroupsFromFixtures } from '@/data/groups';
import { FIXTURES } from '@/data/fixtures';
import {
  fetchLiveTournamentData,
  isApiConfigured,
  type LiveTournamentData,
} from '@/lib/football-api';
import type { Fixture, LiveKnockoutMatch, TournamentGroups } from '@/types';

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
        fixtures: live.fixtures,
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
