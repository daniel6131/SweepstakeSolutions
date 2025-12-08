// Shared types used across multiple components
// Component-specific types should be in their own folders

export interface Team {
  name: string;
  group: string;
  flag: string;
}

export interface Player {
  name: string;
  teams: Team[];
}

export interface GroupStanding {
  pos: number;
  country: string;
  p: number;
  w: number;
  d: number;
  l: number;
  f: number;
  a: number;
  pts: number;
}

export interface Fixture {
  date: string;
  home: string;
  away: string;
  score: string;
  venue: string;
  round: string;
}

export interface OverallStanding {
  rank: number;
  player: string;
  points: number;
}
