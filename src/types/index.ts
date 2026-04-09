export type TabKey = 'Leaderboard' | 'Fixtures' | 'Groups' | 'Teams';

export type ThemeColors = {
  bg: string;
  accent: string;
  accent2: string;
  card: string;
};

export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';
export type TournamentGroups = Record<GroupId, string[]>;

export type Participant = {
  name: string;
  teams: string[];
};

export type Fixture = {
  group: GroupId;
  t1: string;
  t2: string;
  date: string;
  time: string;
  venue: string;
  s1: number | null;
  s2: number | null;
};

export type LeaderboardEntry = {
  name: string;
  teams: string[];
  pts: number;
  w: number;
  d: number;
  l: number;
};

export type GroupStanding = {
  team: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
};
