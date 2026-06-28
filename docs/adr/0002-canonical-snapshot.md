# 0002 - One canonical snapshot, lock-guarded, as the source of truth

Status: Accepted

## Context

football-data.org is rate limited (paid tier: 20 requests/minute). On a match
day many viewers poll for live scores at once. A naive "every render fetches
upstream" design would blow the request budget within seconds and 429 everyone,
and different viewers could see different data depending on which fetch they hit.

## Decision

Compute one `SweepstakeData` snapshot and persist it in KV
(`sweepstake:snapshot`). Every surface (the SSR home page and `/api/live`) reads
that one snapshot, so all devices see identical data and a read never touches
upstream.

The snapshot is refreshed by exactly one writer (`refresh-snapshot.ts`), gated by
an atomic `SET NX EX` KV lock so only one refresh calls upstream at a time no
matter how many readers arrive. Readers apply a stale-while-revalidate policy
(`snapshot-freshness.ts`): fresh snapshots serve as-is, stale ones serve
immediately and refresh in the background, expired ones refresh inline. A daily
cron (`/api/cron/refresh`) keeps the snapshot warm when nobody is watching.

## Consequences

- Upstream calls are bounded to roughly one per refresh window (about 4/min)
  plus the cron, comfortably under the 20/min budget regardless of traffic. Full
  budget math in [docs/CACHING.md](../CACHING.md).
- One source of truth: no per-viewer divergence.
- Invalidation is TTL-only (one snapshot key, no per-tag invalidation); the
  organiser can force a recompute with `npm run snapshot:bust`.
- The lock is released in a `finally` as soon as a refresh settles and
  auto-expires by TTL if a refresh dies, so a crash cannot wedge it.
- A schema-version guard forces a recompute when a stored snapshot predates a
  newer field, so a deploy never serves a snapshot missing data.
