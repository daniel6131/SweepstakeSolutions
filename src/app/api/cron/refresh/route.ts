import { NextResponse } from 'next/server';

import { refreshSnapshot } from '@/lib/refresh-snapshot';

/**
 * Cron-triggered refresh — keeps the canonical snapshot warm even when nobody is
 * watching. It's a SAFETY NET, not the live engine: while anyone has the app
 * open, the on-demand stale-while-revalidate in `/api/live` keeps data fresh.
 *
 * Schedule lives in `vercel.json`. It's set to once-daily (`0 4 * * *`) because
 * the Hobby plan throttles crons to ~once/day — a sub-daily schedule won't run
 * as written. On Vercel Pro, change it to `* * * * *` for a 60s heartbeat.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is
 * set; we require it so this upstream-touching refresh can't be triggered by
 * the public.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const snapshot = await refreshSnapshot();
  return NextResponse.json({ ok: true, updatedAt: snapshot.updatedAt });
}
