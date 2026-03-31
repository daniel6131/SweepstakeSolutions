import { fetchLiveFixtures, isApiConfigured } from '@/lib/football-api';
import { FIXTURES } from '@/data/fixtures';
import { NextResponse } from 'next/server';

/**
 * GET /api/matches
 *
 * Returns the current fixture list. If the football-data.org API is
 * configured and reachable, returns live data. Otherwise falls back
 * to the static fixtures.
 *
 * Query params:
 *   ?source=static  — force static data
 *   ?source=live    — force API (errors if not configured)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');

  // Force static
  if (source === 'static') {
    return NextResponse.json({
      source: 'static',
      count: FIXTURES.length,
      fixtures: FIXTURES,
    });
  }

  // Try live API
  if (isApiConfigured()) {
    const live = await fetchLiveFixtures();
    if (live) {
      return NextResponse.json({
        source: 'football-data.org',
        count: live.length,
        fixtures: live,
      });
    }
  }

  // Force live but API not available
  if (source === 'live') {
    return NextResponse.json(
      {
        error: 'Live API not available',
        configured: isApiConfigured(),
        hint: 'Set FOOTBALL_DATA_API_KEY in your .env.local',
      },
      { status: 503 }
    );
  }

  // Default: fall back to static
  return NextResponse.json({
    source: 'static-fallback',
    count: FIXTURES.length,
    fixtures: FIXTURES,
  });
}
