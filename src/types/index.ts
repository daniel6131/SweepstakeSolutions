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

/** Lifecycle of a single match. `live` is what powers the Provisional Hell overlay. */
export type MatchStatus = 'scheduled' | 'live' | 'finished';

/**
 * Raw football-data.org status granularity, kept ONLY for live-phase display
 * (the approximate match clock). `status` above is still the canonical
 * three-state lifecycle everything else reads. `PAUSED` is half-time.
 */
export type DetailedMatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'EXTRA_TIME'
  | 'PENALTY_SHOOTOUT'
  | 'FINISHED'
  | 'AWARDED';

export type Fixture = {
  group: GroupId;
  t1: string;
  t2: string;
  date: string;
  time: string;
  utcDate?: string;
  venue: string;
  s1: number | null;
  s2: number | null;
  /** Absent on static fallback data (treated as not-live). Set from the live API. */
  status?: MatchStatus;
  /** Raw API status, for live-phase display only. Absent on static data. */
  detailedStatus?: DetailedMatchStatus;
  /** True once the half-time score is recorded, so the live clock can switch to
   *  second-half timing. Absent on static data. */
  halfTimeRecorded?: boolean;
};

export type KnockoutRoundKey = 'roundOf32' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final';

export type LiveKnockoutMatch = {
  roundKey: KnockoutRoundKey;
  t1: string;
  t2: string;
  date: string;
  time: string;
  venue: string;
  s1: number | null;
  s2: number | null;
  winner: 't1' | 't2' | null;
  status: MatchStatus;
};

export type LeaderboardEntry = {
  name: string;
  teams: string[];
  pts: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
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
