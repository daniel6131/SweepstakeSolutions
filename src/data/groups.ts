import type { GroupId } from '@/types';

export const GROUPS: Record<GroupId, string[]> = {
  A: ['Mexico', 'South Korea', 'South Africa', 'Denmark'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Italy'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['USA', 'Australia', 'Paraguay', 'Turkey'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cabo Verde'],
  I: ['France', 'Senegal', 'Norway', 'Jamaica'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

/** Find which group a team belongs to */
export function getTeamGroup(team: string): GroupId | '?' {
  for (const [group, teams] of Object.entries(GROUPS)) {
    if (teams.includes(team)) return group as GroupId;
  }
  return '?';
}
