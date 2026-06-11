'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** Matches currently in play. > 0 → the badge pulses "LIVE". */
  liveMatchCount: number;
  /** Epoch ms of the last successful client sync (null before the first poll). */
  syncedAt: number | null;
  /** Server snapshot timestamp (ISO) — the baseline age before the first poll. */
  fetchedAt: string;
  /** True while a refresh is in flight. */
  refreshing: boolean;
  /** Whether the underlying data is live or the static fallback. */
  dataSource: 'live' | 'static';
};

function relativeLabel(ageMs: number): string {
  const secs = Math.max(0, Math.round(ageMs / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

/**
 * A broadcast-style "live bug" pinned to the bottom-left corner.
 *
 * Shows a pulsing "LIVE" when a match is in play, otherwise a calm dot, plus a
 * ticking "updated Xs ago" so it always reads as a connected, real-time feed.
 * Mounts client-only to avoid hydrating a timestamp that's stale by render time.
 */
export function LiveIndicator({
  liveMatchCount,
  syncedAt,
  fetchedAt,
  refreshing,
  dataSource,
}: Props) {
  // Null until the client's first tick — keeps SSR and first client render
  // identical (no timestamp hydration mismatch). Updates come only from the
  // async timer callbacks below, never synchronously inside the effect body.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const isLive = liveMatchCount > 0 && dataSource === 'live';
  const baseline = syncedAt ?? Date.parse(fetchedAt);
  const label = now === null || Number.isNaN(baseline) ? '' : relativeLabel(now - baseline);

  return (
    <div
      className="pointer-events-none fixed left-4 z-90 md:left-6"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      aria-live="polite">
      <div
        className="pointer-events-auto flex items-center gap-2.5 rounded-full px-3 py-1.5 backdrop-blur-md"
        style={{
          background: 'color-mix(in srgb, var(--color-bg) 72%, transparent)',
          border: '1px solid var(--card-border-strong)',
          boxShadow: 'var(--shadow-card)',
          opacity: refreshing ? 0.78 : 1,
          transition: 'opacity var(--duration-base, 320ms) var(--ease-standard)',
        }}>
        {/* Dot (+ ping ring when live) */}
        <span className="relative flex h-2 w-2 items-center justify-center">
          {isLive && (
            <span
              className="absolute inline-flex h-2 w-2 rounded-full"
              style={{
                background: 'var(--color-accent)',
                animation: 'live-ping 1.8s var(--ease-standard) infinite',
              }}
            />
          )}
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{
              background: isLive ? 'var(--color-accent)' : 'var(--color-accent-a32)',
              animation: isLive ? 'live-dot 1.8s ease-in-out infinite' : 'none',
            }}
          />
        </span>

        <span
          className="font-heading text-[10px] font-bold tracking-[2px] uppercase md:text-[11px]"
          style={{ color: isLive ? 'var(--color-accent)' : 'var(--color-accent-a64)' }}>
          {isLive ? 'Live' : 'Updated'}
        </span>

        {label && (
          <span
            className="font-heading text-[10px] font-medium tracking-[1px] tabular-nums md:text-[11px]"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
