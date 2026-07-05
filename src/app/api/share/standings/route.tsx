/**
 * Standings share-card image route: GET /api/share/standings -> a 1080x1350 PNG
 * of the whole leaderboard. A static segment, so it takes precedence over the
 * sibling `[player]` route. Reads the canonical snapshot (no extra upstream calls).
 */

import { ImageResponse } from 'next/og';
import { after } from 'next/server';

import { LeaderboardShareCard } from '@/components/share/LeaderboardShareCard';
import { COUNTRY_CODES } from '@/data/countryCodes';
import { mockSweepstakeData } from '@/lib/mock-data';
import { loadOgFonts } from '@/lib/og-fonts';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { getSnapshotForRead } from '@/lib/refresh-snapshot';

export const dynamic = 'force-dynamic';

function flagUrlFor(team: string): string {
  const code = COUNTRY_CODES[team];
  return code ? `https://flagcdn.com/w160/${code}.png` : '';
}

export async function GET(req: Request) {
  // rate-limit the render (fails open if KV is down)
  const limit = await rateLimit(`share:${clientIp(req)}`, 60, 60);
  if (!limit.ok)
    return new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfter) },
    });

  const url = new URL(req.url);
  const origin = url.origin;

  const { snapshot, background } = await getSnapshotForRead();
  if (background) after(background);

  const data = url.searchParams.has('demo') ? mockSweepstakeData(snapshot.data) : snapshot.data;
  const leaderboard = data.leaderboard;
  const leaderPts = leaderboard[0]?.pts ?? 0;
  const rows = leaderboard.map((e, i) => ({
    rank: i + 1,
    name: e.name,
    pts: e.pts,
    gap: Math.max(0, leaderPts - e.pts),
    flagUrls: e.teams.map(flagUrlFor),
  }));

  const fonts = await loadOgFonts(origin);

  return new ImageResponse(<LeaderboardShareCard rows={rows} />, {
    width: 1080,
    height: 1350,
    fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
