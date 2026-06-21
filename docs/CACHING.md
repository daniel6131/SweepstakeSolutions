# Caching and the request budget

The whole live-data design exists to keep us under the football-data.org paid
tier limit of **20 requests per minute** while still showing near-live scores.
This is the one number that can take the site down on a match day, so the layers
below all point at protecting it. (The plan also exposes live scores, fixtures,
schedules, and league tables; we compute the tables ourselves from the same
match feed, so we never spend a request on the standings endpoint.)

## The layers

1. **Canonical KV snapshot** (`snapshot-db.ts`). One computed `SweepstakeData`
   blob (`sweepstake:snapshot`) is read by every surface: the SSR home page and
   `/api/live`. Everyone sees the same data and a read never touches upstream.

2. **Refresh lock** (`snapshot-db.ts` + `refresh-snapshot.ts`). Only one refresh
   may call football-data.org at a time, via an atomic `SET NX EX` on
   `sweepstake:refresh-lock`. Concurrent readers that find a stale snapshot do
   not each fetch: one wins the lock and refreshes, the rest serve the current
   snapshot. The lock is released in a `finally` as soon as the refresh settles,
   and auto-expires after `LOCK_TTL_SECONDS` (15s) if a refresh dies.

3. **Freshness policy** (`snapshot-freshness.ts`). `STALE_MS` (15s) and
   `EXPIRED_MS` (45s) decide whether a read serves as-is, serves now and
   refreshes in the background (stale-while-revalidate), or refreshes inline.

4. **In-memory dedupe** (`football-api.ts`, `CACHE_TTL_MS` = 5s). Only collapses
   a genuine within-request double call. It is per-instance under Fluid Compute,
   so it is NOT what protects the budget; the KV lock is.

5. **Circuit breaker** (`upstream-cooloff.ts`). On a 429 we set
   `sweepstake:upstream-cooloff` for the `Retry-After` window. While it is set,
   refreshes skip upstream entirely and serve last-known-good.

6. **CDN cache** on the share-image routes (`s-maxage` + SWR). These read the
   snapshot, so they never cost an upstream call.

## Budget math

- A refresh happens at most once per `STALE_MS` window: about **4/min**.
- Plus the cron warmer: once daily on Hobby, or 1/min if you move to Vercel Pro.
- Worst case at 1/min cron + on-demand: still about **5/min**, well under the
  20/min ceiling, with plenty of headroom for a retry.
- The single retry on a transient 5xx (`football-api.ts`) can add at most one
  extra call per refresh, still inside budget.
- There is enough headroom at 20/min to refresh faster (lower `STALE_MS`) for
  fresher live scores if we want it; at 8s windows that is about 8/min, still
  comfortably under the ceiling.

## Invalidation

Invalidation is **TTL-only**: a snapshot ages out via `STALE_MS` / `EXPIRED_MS`
and the next read recomputes it. There is no per-tag invalidation because there
is exactly one snapshot key.

Worst-case time for a real score change to appear:
`STALE_MS` (serve-stale window) + the CDN `s-maxage` on the consuming route,
on the order of **20s**.

A snapshot is also force-recomputed when it predates a newer field (the
schema-version guard in `refresh-snapshot.ts`), so a deploy that adds a field
never serves a snapshot that is missing it.

## Force a refresh

If a snapshot is wrong and you do not want to wait for it to age out, bust it:

```bash
npm run snapshot:bust
```

That deletes `sweepstake:snapshot`; the next read recomputes from upstream.
