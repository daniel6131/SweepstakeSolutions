/**
 * football-data.org API Client (v4)
 *
 * Server-side only. Fetches World Cup match data and transforms it
 * into our internal Fixture format.
 *
 * Free tier: 10 requests/minute — we cache aggressively to stay well under.
 *
 * Endpoints used:
 *   GET /v4/competitions/WC/matches   → all matches for current WC season
 *   GET /v4/competitions/WC/standings → group stage tables
 */

import type { Fixture, GroupId } from '@/types';

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC'; // FIFA World Cup

/* ── In-memory cache ────────────────────────────────────────────
   Vercel serverless functions have ephemeral memory, so this cache
   lives only for the lifetime of a single function invocation/container.
   ISR handles the durable caching layer (revalidate every 60s). This
   in-memory cache prevents duplicate API calls within a single request. */

type CacheEntry<T> = { data: T; fetchedAt: number };
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 55_000; // 55s — just under ISR's 60s revalidate

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
  'Türkiye': 'Turkey',
  'New Zealand / Aotearoa': 'New Zealand',
  'Cape Verde': 'Cabo Verde',
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

async function apiFetch<T>(endpoint: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) {
    throw new Error(
      'FOOTBALL_DATA_API_KEY not set. Get a free key at https://www.football-data.org/client/register'
    );
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'X-Auth-Token': token },
    // No Next.js cache here — we control caching via ISR + in-memory
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`football-data.org ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
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
    fullTime: ApiScore;
    halfTime: ApiScore;
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

/* ── Public functions ──────────────────────────────────────────*/

/**
 * Fetch all World Cup matches and transform to our Fixture format.
 * Returns null if the API key is missing or the request fails,
 * so the caller can fall back to static data.
 */
export async function fetchLiveFixtures(): Promise<Fixture[] | null> {
  // Check in-memory cache first
  const cached = getCached<Fixture[]>('matches');
  if (cached) return cached;

  try {
    const data = await apiFetch<ApiMatchesResponse>(
      `/competitions/${COMPETITION}/matches?stage=GROUP_STAGE`
    );

    const fixtures: Fixture[] = data.matches.map((m) => {
      const date = new Date(m.utcDate);
      const dateStr = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const isFinished = m.status === 'FINISHED' || m.status === 'AWARDED';
      const isLive = m.status === 'IN_PLAY' || m.status === 'PAUSED';

      return {
        group: parseGroup(m.group),
        t1: normalizeTeamName(m.homeTeam.shortName ?? m.homeTeam.name),
        t2: normalizeTeamName(m.awayTeam.shortName ?? m.awayTeam.name),
        date: dateStr,
        time: timeStr,
        venue: m.venue ?? 'TBC',
        s1: isFinished || isLive ? m.score.fullTime.home : null,
        s2: isFinished || isLive ? m.score.fullTime.away : null,
      };
    });

    setCache('matches', fixtures);
    return fixtures;
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
      `/competitions/${COMPETITION}/standings`
    );

    const standings: Record<string, ApiStandingRow[]> = {};
    for (const group of data.standings) {
      if (group.stage === 'GROUP_STAGE') {
        const letter = parseGroup(group.group);
        standings[letter] = group.table;
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
