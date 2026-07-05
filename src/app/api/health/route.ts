/**
 * GET /api/health . readiness probe.
 *
 * Cheap and unauthenticated: does a tiny KV round-trip and reports the upstream
 * cooloff state, so an external uptime monitor (or a human on match day) can
 * tell whether the app can serve fresh data. Returns 200 when KV is reachable,
 * 503 when it is not. Liveness is delegated to the platform: a running Vercel
 * function is by definition alive, so there is no separate liveness route.
 */

import { NextResponse } from 'next/server';

import { getKv, isKVEnabled } from '@/lib/kv';
import { isUpstreamCoolingOff } from '@/lib/upstream-cooloff';

export const dynamic = 'force-dynamic';

export async function GET() {
  let kvStatus: 'ok' | 'down' | 'disabled' = 'disabled';

  if (isKVEnabled()) {
    try {
      const kv = await getKv();
      // A tiny read (a key that does not exist) proves reachability without
      // pulling the large snapshot value.
      await kv.get('health:ping');
      kvStatus = 'ok';
    } catch {
      kvStatus = 'down';
    }
  }

  let upstreamCooloff = false;
  try {
    upstreamCooloff = await isUpstreamCoolingOff();
  } catch {
    // A cooloff-read failure is not itself a readiness failure; report false.
  }

  const healthy = kvStatus !== 'down';
  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', kv: kvStatus, upstreamCooloff },
    { status: healthy ? 200 : 503 }
  );
}
