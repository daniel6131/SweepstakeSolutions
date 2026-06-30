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
  utcDate: string;
  venue: string;
  /** On-pitch score (regulation + extra time), with any penalty-shootout kicks
   *  stripped out, so a shootout never inflates the scoreline or goal totals. */
  s1: number | null;
  s2: number | null;
  /** Penalty-shootout tally, present only when the match went (or is going) to
   *  penalties. Used purely as an indicator, never as the match scoreline. */
  p1: number | null;
  p2: number | null;
  /** Only set once the match is FINISHED. A team in extra time or a shootout is
   *  still playing, so this stays null and nobody advances mid-match. */
  winner: 't1' | 't2' | null;
  status: MatchStatus;
  /** Raw API status, for the live-phase label (ET / PENS) on knockout cards. */
  detailedStatus?: DetailedMatchStatus;
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
