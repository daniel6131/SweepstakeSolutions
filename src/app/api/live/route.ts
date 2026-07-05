import { after, NextResponse } from 'next/server';

import { getSnapshotForRead } from '@/lib/refresh-snapshot';

/**
 * Live data endpoint — every device polls this and gets the SAME canonical
 * snapshot, so the leaderboard/fixtures are identical across all of them.
 *
 * This is a cheap KV read, not an upstream call: `getSnapshotForRead` serves the
 * persisted snapshot and only touches football-data.org when the snapshot is
 * stale — and even then a KV lock means just one refresh runs no matter how many
 * clients arrive at once. Background refreshes run via `after()` so the response
 * isn't blocked.
 */
export const dynamic = 'force-dynamic';
// Bound the function: a refresh is one ~5s upstream fetch plus compute, well
// inside this ceiling, so a pathological stall is capped rather than open-ended.
export const maxDuration = 15;

export async function GET() {
  const { snapshot, background } = await getSnapshotForRead();
  if (background) after(background);

  return NextResponse.json(
    { ...snapshot.data, updatedAt: snapshot.updatedAt },
    {
      headers: {
        // Short shared-cache window coalesces simultaneous clients at the CDN
        // without holding data longer than our refresh cadence.
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    }
  );
}
