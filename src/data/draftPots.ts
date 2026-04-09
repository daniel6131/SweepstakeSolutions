export type DraftPot = 1 | 2 | 3 | 4;

const POT_ORDER_BY_ROUND = [4, 3, 2, 1] as const;

// Pot assignments are based on the FIFA World Cup 2026 final draw on 5 Dec 2025,
// with the pot 4 play-off placeholders replaced by the eventual qualifiers.
const TEAMS_BY_POT: Record<DraftPot, string[]> = {
  1: [
    'Canada',
    'Mexico',
    'USA',
    'Spain',
    'Argentina',
    'France',
    'England',
    'Brazil',
    'Portugal',
    'Netherlands',
    'Belgium',
    'Germany',
  ],
  2: [
    'Croatia',
    'Morocco',
    'Colombia',
    'Uruguay',
    'Switzerland',
    'Japan',
    'Senegal',
    'Iran',
    'South Korea',
    'Ecuador',
    'Austria',
    'Australia',
  ],
  3: [
    'Norway',
    'Panama',
    'Egypt',
    'Algeria',
    'Scotland',
    'Paraguay',
    'Tunisia',
    'Ivory Coast',
    'Uzbekistan',
    'Qatar',
    'Saudi Arabia',
    'South Africa',
  ],
  4: [
    'Jordan',
    'Cape Verde',
    'Ghana',
    'Curaçao',
    'Haiti',
    'New Zealand',
    'Bosnia and Herzegovina',
    'Sweden',
    'Turkey',
    'Czechia',
    'DR Congo',
    'Iraq',
  ],
};

const TEAM_TO_POT = Object.entries(TEAMS_BY_POT).reduce(
  (acc, [pot, teams]) => {
    teams.forEach((team) => {
      acc[team] = Number(pot) as DraftPot;
    });
    return acc;
  },
  {} as Record<string, DraftPot>
);

export function getPotForRound(round: number): DraftPot | null {
  return POT_ORDER_BY_ROUND[round] ?? null;
}

export function getPotForTeam(team: string): DraftPot | null {
  return TEAM_TO_POT[team] ?? null;
}

export function getTeamsForPot(pot: DraftPot): string[] {
  return TEAMS_BY_POT[pot];
}
