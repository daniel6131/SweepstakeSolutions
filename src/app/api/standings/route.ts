import { fetchLiveStandings, isApiConfigured } from '@/lib/football-api';
import { NextResponse } from 'next/server';

/**
 * GET /api/standings
 *
 * Returns group stage standings from football-data.org if available.
 * The main page computes standings from fixtures, so this endpoint
 * is mostly for debugging and direct API access.
 */
export async function GET() {
  if (!isApiConfigured()) {
    return NextResponse.json(
      {
        error: 'API not configured',
        hint: 'Set FOOTBALL_DATA_API_KEY in your .env.local',
      },
      { status: 503 }
    );
  }

  const standings = await fetchLiveStandings();
  if (!standings) {
    return NextResponse.json(
      { error: 'Failed to fetch standings from football-data.org' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    source: 'football-data.org',
    groups: Object.keys(standings).length,
    standings,
  });
}
