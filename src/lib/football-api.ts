/**
 * football-data.org API Client (v4)
 *
 * Server-side only. Fetches World Cup match data and transforms it
 * into our internal Fixture format.
 *
 * Paid tier: 20 requests/minute, but we still cache aggressively to stay under.
 *
 * Endpoints used:
 *   GET /v4/competitions/WC/matches   → all matches for current WC season
 *   GET /v4/competitions/WC/standings → group stage tables
 */

import { isUpstreamCoolingOff, markUpstreamCooloff } from '@/lib/upstream-cooloff';
import type { ScoringMatch } from '@/lib/scoring';
import type {
  DetailedMatchStatus,
  Fixture,
  GroupId,
  KnockoutRoundKey,
  LiveKnockoutMatch,
  MatchStatus,
} from '@/types';

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC'; // FIFA World Cup
const WORLD_CUP_SEASON = 2026;

/* ── In-memory cache ────────────────────────────────────────────
   Only `refreshSnapshot` reaches this client now, and the canonical-snapshot
   layer (KV lock + freshness policy) is what governs how often we refresh. So
   this tiny in-memory cache only dedupes a genuine within-request double call;
   each lock-gated refresh (≥15s apart) still gets fresh upstream data. */

type CacheEntry<T> = { data: T; fetchedAt: number };
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5_000; // brief within-request dedupe only
const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'SUSPENDED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']);
const FINISHED_STATUSES = new Set(['FINISHED', 'AWARDED']);
const KNOCKOUT_STAGE_MAP: Partial<Record<string, KnockoutRoundKey>> = {
  LAST_32: 'roundOf32',
  ROUND_OF_32: 'roundOf32',
  LAST_16: 'roundOf16',
  ROUND_OF_16: 'roundOf16',
  QUARTER_FINALS: 'quarterFinals',
  SEMI_FINALS: 'semiFinals',
  FINAL: 'final',
};

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, fetchedAt: Date.now() });
}

/* ── Team name mapping ──────────────────────────────────────────
   football-data.org uses official FIFA names which sometimes differ
   from our display names. This map normalizes API names → our names. */

const TEAM_NAME_MAP: Record<string, string> = {
  // Names that differ between API and our data
  'Korea Republic': 'South Korea',
  "Côte d'Ivoire": 'Ivory Coast',
  'Iran, Islamic Republic of': 'Iran',
  'IR Iran': 'Iran',
  'United States': 'USA',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'Bosnia-H.': 'Bosnia and Herzegovina',
  Türkiye: 'Turkey',
  'New Zealand / Aotearoa': 'New Zealand',
  'Cape Verde': 'Cape Verde',
  'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  // Add more as the API reveals them
};

function normalizeTeamName(apiName: string): string {
  return TEAM_NAME_MAP[apiName] ?? apiName;
}

/* ── Group letter mapping ──────────────────────────────────────
   The API returns groups as "GROUP_A", "GROUP_B" etc.
   We need just the letter. */

function parseGroup(apiGroup: string | null): GroupId {
  if (!apiGroup) return 'A';
  const letter = apiGroup.replace('GROUP_', '');
  return (letter.length === 1 ? letter : 'A') as GroupId;
}

/* ── API fetch helper ──────────────────────────────────────────*/

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// jittered backoff between retries; no wait under test so the suite stays fast
const retryDelay = () => (process.env.NODE_ENV === 'test' ? 0 : 150 + Math.random() * 350);

async function apiFetch<T>(endpoint: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) {
    throw new Error(
      'FOOTBALL_DATA_API_KEY not set. Get a free key at https://www.football-data.org/client/register'
    );
  }

  // if we 429'd recently, don't even ask: serve last-known-good instead of
  // poking a limiter that already told us to back off.
  if (await isUpstreamCoolingOff()) {
    throw new Error('football-data.org cooloff active, skipping upstream call');
  }

  const url = `${API_BASE}${endpoint}`;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'X-Auth-Token': token },
        // No Data Cache: the snapshot refresh is already lock-gated, so each
        // refresh should pull live data rather than a revalidation-cached copy.
        cache: 'no-store',
      });
    } catch (err) {
      // transport error (network/DNS): one retry, then give up
      if (attempt < maxAttempts) {
        await sleep(retryDelay());
        continue;
      }
      throw err;
    }

    if (res.ok) return res.json() as Promise<T>;

    const body = await res.text().catch(() => '');

    if (res.status === 429) {
      // open the breaker, then surface it as its own greppable line so I can
      // alert on the rate limit separately from ordinary 5xx noise.
      const retryAfter = Number(res.headers.get('retry-after')) || 60;
      await markUpstreamCooloff(retryAfter);
      console.error(
        `[football-api] RATE_LIMIT_429 endpoint=${endpoint} retry-after=${retryAfter}s, backing off and serving last-known-good/static`
      );
      throw new Error(`football-data.org 429: ${body.slice(0, 200)}`);
    }

    // 5xx is usually transient: retry once before degrading
    if (res.status >= 500 && attempt < maxAttempts) {
      await sleep(retryDelay());
      continue;
    }

    throw new Error(`football-data.org ${res.status}: ${body.slice(0, 200)}`);
  }

  // the loop only exits via return/throw; this satisfies the type checker
  throw new Error('football-data.org request failed');
}

function formatDateParts(utcDate: string): { date: string; time: string } {
  const date = new Date(utcDate);

  return {
    date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function isMatchStarted(status: string): boolean {
  return LIVE_STATUSES.has(status) || FINISHED_STATUSES.has(status);
}

function getApiScoreValue(score: ApiScore | undefined, side: 'home' | 'away'): number | null {
  if (!score) return null;

  if (side === 'home') {
    return score.home ?? null;
  }

  return score.away ?? null;
}

/**
 * The on-pitch score for one side: goals scored in regulation + extra time, with
 * any penalty-shootout kicks removed. football-data.org folds the shootout into
 * `fullTime` (fullTime = regularTime + extraTime + penalties), so for a match
 * that went to penalties we subtract the kicks back out. A 1-1 draw won 5-4 on
 * pens arrives as fullTime 6-5; this returns the real 1-1, never the shootout.
 */
function getOnPitchScoreValue(score: ApiMatch['score'], side: 'home' | 'away'): number | null {
  const full = getApiScoreValue(score.fullTime, side);
  if (full === null) return null;

  const pens = getApiScoreValue(score.penalties, side);
  return pens === null ? full : full - pens;
}

function getFixtureScores(match: ApiMatch): Pick<Fixture, 's1' | 's2'> {
  if (!isMatchStarted(match.status)) {
    return { s1: null, s2: null };
  }

  return {
    s1: getOnPitchScoreValue(match.score, 'home'),
    s2: getOnPitchScoreValue(match.score, 'away'),
  };
}

/** Penalty-shootout tally, present only once a knockout match reaches penalties. */
function getPenaltyScores(match: ApiMatch): { p1: number | null; p2: number | null } {
  return {
    p1: getApiScoreValue(match.score.penalties, 'home'),
    p2: getApiScoreValue(match.score.penalties, 'away'),
  };
}

/**
 * Who advances. Resolved ONLY when the match is FINISHED. A match in extra time
 * or a penalty shootout is still being played, so it returns null and nobody is
 * marked through until the final whistle. We trust the API's `winner` field
 * (which already accounts for the shootout) and fall back to the on-pitch score
 * only if it is somehow missing (knockouts cannot end level).
 */
function getKnockoutWinner(
  match: ApiMatch,
  s1: number | null,
  s2: number | null
): 't1' | 't2' | null {
  if (!FINISHED_STATUSES.has(match.status)) return null;

  if (match.score.winner === 'HOME_TEAM') return 't1';
  if (match.score.winner === 'AWAY_TEAM') return 't2';

  if (s1 !== null && s2 !== null && s1 !== s2) {
    return s1 > s2 ? 't1' : 't2';
  }
  return null;
}

/** Collapse the API's many status strings into our three-state lifecycle. */
function getMatchStatus(match: ApiMatch): MatchStatus {
  if (FINISHED_STATUSES.has(match.status)) return 'finished';
  if (LIVE_STATUSES.has(match.status)) return 'live';
  return 'scheduled';
}

/**
 * The live-phase status used only for labels (ET / PENS). football-data keeps
 * `status` at IN_PLAY/PAUSED right through extra time and the shootout, and
 * carries the actual phase in `score.duration` instead, so a live match that
 * has gone to penalties arrives as status IN_PLAY + duration PENALTY_SHOOTOUT.
 * For a live match we surface that duration; otherwise the coarse status is the
 * detail (SCHEDULED / PAUSED / FINISHED ...).
 */
function getDetailedStatus(match: ApiMatch): DetailedMatchStatus {
  if (LIVE_STATUSES.has(match.status)) {
    if (match.score.duration === 'PENALTY_SHOOTOUT') return 'PENALTY_SHOOTOUT';
    if (match.score.duration === 'EXTRA_TIME') return 'EXTRA_TIME';
  }
  return match.status as DetailedMatchStatus;
}

/** Whether the half-time score is recorded yet — flips the live clock to 2nd-half timing. */
function isHalfTimeRecorded(match: ApiMatch): boolean {
  return match.score.halfTime.home != null || match.score.halfTime.away != null;
}

function normalizeMatchTeams(match: ApiMatch): { t1: string; t2: string } {
  return {
    t1: normalizeTeamName(match.homeTeam.shortName ?? match.homeTeam.name),
    t2: normalizeTeamName(match.awayTeam.shortName ?? match.awayTeam.name),
  };
}

/* ── API response types (partial — only what we need) ──────────*/

type ApiScore = {
  home: number | null;
  away: number | null;
};

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | etc
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: { name: string; shortName?: string; tla?: string };
  awayTeam: { name: string; shortName?: string; tla?: string };
  score: {
    winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration?: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
    /** For a shootout, the API folds the kicks INTO fullTime:
     *  fullTime = regularTime + extraTime + penalties. So fullTime alone is NOT
     *  the on-pitch scoreline once a match goes to penalties. */
    fullTime: ApiScore;
    halfTime: ApiScore;
    /** Present only for EXTRA_TIME / PENALTY_SHOOTOUT matches. */
    regularTime?: ApiScore;
    extraTime?: ApiScore;
    penalties?: ApiScore;
  };
  venue?: string;
};

type ApiMatchesResponse = {
  matches: ApiMatch[];
  resultSet: { count: number; played: number };
};

type ApiStandingRow = {
  position: number;
  team: { name: string; shortName?: string; tla?: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

type ApiStandingsGroup = {
  stage: string;
  type: string;
  group: string;
  table: ApiStandingRow[];
};

type ApiStandingsResponse = {
  standings: ApiStandingsGroup[];
};

export type LiveTournamentData = {
  fixtures: Fixture[];
  knockoutMatches: LiveKnockoutMatch[];
  extraScoringMatches: ScoringMatch[];
  /** Number of matches currently in play — drives the live "● LIVE" indicator. */
  liveMatchCount: number;
};

export function transformCompetitionMatches(data: ApiMatchesResponse): LiveTournamentData {
  const fixtures: Fixture[] = [];
  const knockoutMatches: LiveKnockoutMatch[] = [];
  const extraScoringMatches: ScoringMatch[] = [];
  let liveMatchCount = 0;

  for (const match of data.matches) {
    if (LIVE_STATUSES.has(match.status)) liveMatchCount++;

    const { date, time } = formatDateParts(match.utcDate);
    const { t1, t2 } = normalizeMatchTeams(match);

    if (match.stage === 'GROUP_STAGE' && match.group) {
      fixtures.push({
        group: parseGroup(match.group),
        t1,
        t2,
        date,
        time,
        utcDate: match.utcDate,
        venue: match.venue ?? 'TBC',
        status: getMatchStatus(match),
        detailedStatus: getDetailedStatus(match),
        halfTimeRecorded: isHalfTimeRecorded(match),
        ...getFixtureScores(match),
      });
      continue;
    }

    const { s1, s2 } = getFixtureScores(match);
    if (match.stage === 'THIRD_PLACE') {
      // Only score the third-place play-off once it has actually finished. A
      // live one is still being decided (and a level shootout would otherwise be
      // miscounted as a draw). Matches the "knockouts only score when finished"
      // rule used for the bracket.
      if (FINISHED_STATUSES.has(match.status)) {
        extraScoringMatches.push({
          t1,
          t2,
          s1,
          s2,
          winner: getKnockoutWinner(match, s1, s2),
        });
      }
      continue;
    }

    const roundKey = KNOCKOUT_STAGE_MAP[match.stage];
    if (!roundKey) continue;

    const { p1, p2 } = getPenaltyScores(match);
    knockoutMatches.push({
      roundKey,
      t1,
      t2,
      date,
      time,
      utcDate: match.utcDate,
      venue: match.venue ?? 'TBC',
      s1,
      s2,
      p1,
      p2,
      winner: getKnockoutWinner(match, s1, s2),
      status: getMatchStatus(match),
      detailedStatus: getDetailedStatus(match),
    });
  }

  return { fixtures, knockoutMatches, extraScoringMatches, liveMatchCount };
}

/* ── Public functions ──────────────────────────────────────────*/

/**
 * Fetch all World Cup matches and transform to our Fixture format.
 * Returns null if the API key is missing or the request fails,
 * so the caller can fall back to static data.
 */
export async function fetchLiveFixtures(): Promise<Fixture[] | null> {
  const cached = getCached<LiveTournamentData>('matches');
  if (cached) return cached.fixtures;

  const liveData = await fetchLiveTournamentData();
  return liveData?.fixtures ?? null;
}

export async function fetchLiveTournamentData(): Promise<LiveTournamentData | null> {
  // Check in-memory cache first
  const cached = getCached<LiveTournamentData>('matches');
  if (cached) return cached;

  try {
    const data = await apiFetch<ApiMatchesResponse>(
      `/competitions/${COMPETITION}/matches?season=${WORLD_CUP_SEASON}`
    );
    const tournamentData = transformCompetitionMatches(data);

    setCache('matches', tournamentData);
    return tournamentData;
  } catch (err) {
    console.error('[football-api] Failed to fetch matches:', err);
    return null;
  }
}

/**
 * Fetch group standings directly from the API.
 * Returns null on failure (caller falls back to computing from fixtures).
 */
export async function fetchLiveStandings(): Promise<Record<string, ApiStandingRow[]> | null> {
  const cached = getCached<Record<string, ApiStandingRow[]>>('standings');
  if (cached) return cached;

  try {
    const data = await apiFetch<ApiStandingsResponse>(
      `/competitions/${COMPETITION}/standings?season=${WORLD_CUP_SEASON}`
    );

    const standings: Record<string, ApiStandingRow[]> = {};
    for (const group of data.standings) {
      if (group.stage === 'GROUP_STAGE') {
        const letter = parseGroup(group.group);
        standings[letter] = group.table.map((row) => ({
          ...row,
          team: {
            ...row.team,
            name: normalizeTeamName(row.team.shortName ?? row.team.name),
          },
        }));
      }
    }

    setCache('standings', standings);
    return standings;
  } catch (err) {
    console.error('[football-api] Failed to fetch standings:', err);
    return null;
  }
}

/**
 * Check whether the API is configured and reachable.
 */
export function isApiConfigured(): boolean {
  return !!process.env.FOOTBALL_DATA_API_KEY;
}
