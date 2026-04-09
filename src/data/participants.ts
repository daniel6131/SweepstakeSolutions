import type { Participant } from '@/types';

export const PARTICIPANTS: Participant[] = [
  { name: 'Adam', teams: ['Brazil', 'Japan', 'Algeria', 'Panama'] },
  { name: 'Daniel', teams: ['France', 'England', 'South Korea', 'Ecuador'] },
  { name: 'Little John', teams: ['Argentina', 'Netherlands', 'Morocco', 'Turkey'] },
  { name: 'Abdul', teams: ['Spain', 'Germany', 'Croatia', 'Senegal'] },
  { name: 'Michael', teams: ['Portugal', 'Belgium', 'Uruguay', 'Norway'] },
  { name: 'Big John', teams: ['USA', 'Italy', 'Colombia', 'Egypt'] },
  { name: 'Nathan', teams: ['Mexico', 'Switzerland', 'Austria', 'Tunisia'] },
  { name: 'Tui', teams: ['Canada', 'Iran', 'Scotland', 'Paraguay'] },
  { name: 'Steff', teams: ['Denmark', 'Australia', 'Ghana', 'Uzbekistan'] },
  { name: 'Nick', teams: ['Qatar', 'South Africa', 'Jordan', 'Haiti'] },
  { name: 'Heather', teams: ['Saudi Arabia', 'Ivory Coast', 'Jamaica', 'Curaçao'] },
  { name: 'John P', teams: ['Sweden', 'New Zealand', 'Cabo Verde', 'DR Congo'] },
];

/** Find which participant owns a given team */
export function getOwner(team: string): string {
  return PARTICIPANTS.find((p) => p.teams.includes(team))?.name ?? '—';
}
