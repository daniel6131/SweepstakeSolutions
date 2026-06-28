# 0003 - Degrade to static and circuit-break on upstream failure

Status: Accepted

## Context

The live-data provider can fail in several ways on a match day: a 429 when we
brush the rate limit, a transient 5xx, a network blip, or a full outage. KV can
also be briefly unreachable. None of these should ever show the user an error
page, and a 429 in particular must not turn into a retry storm that digs the hole
deeper. Scores going slightly stale is fine; the page breaking is not.

## Decision

Degrade, never throw to the user:

- Every football-data fetch path resolves to `null` on failure, and the caller
  falls back to the last known-good live snapshot, then to the static fixture
  table (`src/data/fixtures.ts`). A transient 429 never blanks the leaderboard
  back to the pre-tournament schedule.
- A 429 opens a short circuit breaker (`upstream-cooloff.ts`): a KV marker set
  for the `Retry-After` window during which refreshes skip upstream entirely. It
  also emits a distinct `RATE_LIMIT_429` log line for alerting.
- Transient 5xx and network errors get one jittered retry before degrading.
- A KV outage on the read path degrades to a directly computed snapshot
  (`getSnapshotForRead`) instead of returning a 500.

## Consequences

- The worst observable failure is stale scores, not an error page.
- Upstream is treated as politely as the free/paid tier expects: after a 429 we
  back off rather than hammer.
- The degrade contract is pinned by tests (`football-api-degrade.test.ts`,
  `load-data-chaos.test.ts`) so a refactor cannot quietly turn a 429 into a
  user-facing throw.
- Recovery and the "KV outage" runbook step live in
  [docs/football-data-runbook.md](../football-data-runbook.md).
