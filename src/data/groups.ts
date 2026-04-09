import type { Fixture, GroupId, TournamentGroups } from '@/types';

export const GROUP_IDS: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const GROUPS: TournamentGroups = {
  A: ['Mexico', 'South Korea', 'South Africa', 'Czechia'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia and Herzegovina'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['USA', 'Australia', 'Paraguay', 'Turkey'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

function emptyGroups(): TournamentGroups {
  return GROUP_IDS.reduce((acc, group) => {
    acc[group] = [];
    return acc;
  }, {} as TournamentGroups);
}

export function buildGroupsFromFixtures(
  fixtures: Fixture[],
  fallback: TournamentGroups = GROUPS
): TournamentGroups {
  const derived = emptyGroups();
  const seen = new Map<GroupId, Set<string>>(GROUP_IDS.map((group) => [group, new Set<string>()]));

  const addTeam = (group: GroupId, team: string) => {
    const groupSeen = seen.get(group)!;
    if (groupSeen.has(team)) return;
    groupSeen.add(team);
    derived[group].push(team);
  };

  for (const fixture of fixtures) {
    addTeam(fixture.group, fixture.t1);
    addTeam(fixture.group, fixture.t2);
  }

  const groups = emptyGroups();
  for (const group of GROUP_IDS) {
    groups[group] = [...derived[group]];

    for (const team of fallback[group]) {
      if (!groups[group].includes(team)) {
        groups[group].push(team);
      }
    }
  }

  return groups;
}

export function getAllTeams(groups: TournamentGroups = GROUPS): string[] {
  return GROUP_IDS.flatMap((group) => groups[group]);
}

/** Find which group a team belongs to */
export function getTeamGroup(team: string, groups: TournamentGroups = GROUPS): GroupId | '?' {
  for (const [group, teams] of Object.entries(groups)) {
    if (teams.includes(team)) return group as GroupId;
  }
  return '?';
}
