'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { SweepstakeData } from '@/lib/load-data';

/** How often we poll `/api/live` while the tab is visible. */
const POLL_INTERVAL_MS = 25_000;

export type LiveData = {
  /** Latest data — starts as the server-rendered snapshot, then updates in place. */
  data: SweepstakeData;
  /** Epoch ms of the last successful sync, or null before the first client fetch. */
  syncedAt: number | null;
  /** True while a refresh request is in flight (for a subtle "updating" affordance). */
  refreshing: boolean;
  /** Force an immediate refresh (e.g. a manual "refresh" tap). */
  refresh: () => void;
};

/**
 * Keeps `SweepstakeData` live on the client without depending on page ISR.
 *
 * - Hydrates instantly from the server-rendered snapshot (no loading flash).
 * - Polls `/api/live` every 25s while the tab is visible.
 * - Pauses polling when the tab is hidden, and refreshes immediately when the
 *   user returns or the network reconnects — so it always feels up-to-date.
 * - Never throws: on a failed fetch it keeps the last good data.
 */
export function useLiveData(initial: SweepstakeData): LiveData {
  const [data, setData] = useState<SweepstakeData>(initial);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const res = await fetch('/api/live', { cache: 'no-store' });
      if (res.ok) {
        const next = (await res.json()) as SweepstakeData;
        setData(next);
        setSyncedAt(Date.now());
      }
    } catch {
      // Network blip — keep showing the last good data rather than breaking the UI.
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      stop();
      timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void refresh(); // instant catch-up on return to the tab
        start();
      }
    };
    const onOnline = () => void refresh();

    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, [refresh]);

  return { data, syncedAt, refreshing, refresh: () => void refresh() };
}
