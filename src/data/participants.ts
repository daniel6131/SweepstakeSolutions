import type { Participant } from '@/types';

export const PARTICIPANTS: Participant[] = [
  { name: 'Alex', teams: ['Brazil', 'Japan', 'Algeria', 'Panama'] },
  { name: 'Jordan', teams: ['France', 'England', 'South Korea', 'Ecuador'] },
  { name: 'Sam', teams: ['Argentina', 'Netherlands', 'Morocco', 'Turkey'] },
  { name: 'Casey', teams: ['Spain', 'Germany', 'Croatia', 'Senegal'] },
  { name: 'Riley', teams: ['Portugal', 'Belgium', 'Uruguay', 'Norway'] },
  { name: 'Morgan', teams: ['USA', 'Italy', 'Colombia', 'Egypt'] },
  { name: 'Taylor', teams: ['Mexico', 'Switzerland', 'Austria', 'Tunisia'] },
  { name: 'Jamie', teams: ['Canada', 'Iran', 'Scotland', 'Paraguay'] },
  { name: 'Drew', teams: ['Denmark', 'Australia', 'Ghana', 'Uzbekistan'] },
  { name: 'Quinn', teams: ['Qatar', 'South Africa', 'Jordan', 'Haiti'] },
  { name: 'Avery', teams: ['Saudi Arabia', 'Ivory Coast', 'Jamaica', 'Curaçao'] },
  { name: 'Reese', teams: ['Sweden', 'New Zealand', 'Cabo Verde', 'DR Congo'] },
];

/** Find which participant owns a given team */
export function getOwner(team: string): string {
  return PARTICIPANTS.find((p) => p.teams.includes(team))?.name ?? '—';
}
