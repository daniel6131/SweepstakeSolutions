import { NextResponse } from 'next/server';

import { loadSweepstakeData } from '@/lib/load-data';

/**
 * Live data endpoint — polled by the client every ~25s (see `use-live-data.ts`).
 *
 * This route re-runs on every request, but the upstream football-data.org call
 * inside `loadSweepstakeData` is gated by the Data Cache + in-memory cache
 * (`FETCH_REVALIDATE_SECONDS` / `CACHE_TTL_MS` in `football-api.ts`). So no
 * matter how many tabs are open and polling, the actual API is hit at most
 * ~3×/min — comfortably under the 10 req/min free tier. On any failure
 * `loadSweepstakeData` degrades to static data rather than throwing.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await loadSweepstakeData();

  return NextResponse.json(data, {
    headers: {
      // Coalesce bursts of clients at the CDN for a few seconds while staying
      // well inside our refresh cadence.
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
    },
  });
}
