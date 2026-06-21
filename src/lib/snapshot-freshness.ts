/**
 * Snapshot freshness policy (pure — no I/O, so it's trivially unit-testable).
 *
 * Sized for the football-data.org FREE tier (10 req/min). Upstream is only
 * touched by the lock-guarded refresh, so even under load the budget is roughly
 * one fetch per STALE window (about 4/min) plus the cron, comfortably under
 * 10/min. See docs/CACHING.md for the full budget math.
 */

/** Below this age a snapshot is current; no refresh needed. */
export const STALE_MS = 15_000;

/** Above this age the reader refreshes inline (returns fresh data this request);
 *  between STALE and EXPIRED it serves the current snapshot and refreshes in the
 *  background (stale-while-revalidate). */
export const EXPIRED_MS = 45_000;

export type SnapshotFreshness =
  | 'missing' // nothing stored yet → must compute
  | 'fresh' // serve as-is
  | 'stale' // serve now, refresh in the background
  | 'expired'; // too old → refresh inline before serving

export function classifyAge(updatedAt: number | null | undefined, now: number): SnapshotFreshness {
  if (updatedAt == null) return 'missing';
  const age = now - updatedAt;
  if (age <= STALE_MS) return 'fresh';
  if (age <= EXPIRED_MS) return 'stale';
  return 'expired';
}
