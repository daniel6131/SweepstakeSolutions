'use client';

import { useEffect, useState } from 'react';

/**
 * A client clock for approximate live-match minutes. Establishes a baseline
 * `now` after mount (deferred off the render, mirroring LiveIndicator), then
 * re-ticks every 30s ONLY while `active` (a match is live) so idle tabs do no
 * work. 30s is plenty for minute-granularity. Returns null on the server and
 * until the first tick, so callers render no minute until the clock is ready.
 */
export function useLiveClock(active: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // setState lives in the timer callbacks, never synchronously in the effect
    // body (keeps SSR/first render pure and avoids cascading renders).
    const baseline = window.setTimeout(() => setNow(Date.now()), 0);
    const ticker = active ? window.setInterval(() => setNow(Date.now()), 30_000) : undefined;
    return () => {
      window.clearTimeout(baseline);
      if (ticker) window.clearInterval(ticker);
    };
  }, [active]);

  return now;
}
