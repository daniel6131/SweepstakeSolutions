/**
 * Snapshot freshness policy (pure — no I/O, so it's trivially unit-testable).
 *
 * Tuned for the football-data.org paid tier (~20 req/min). The upstream is only
 * touched by the lock-guarded refresh, so on-demand refreshes run at most once
 * per STALE window (~4/min) + the 1/min cron — well under budget.
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
