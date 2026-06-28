# 0001 - Vercel KV for draft and snapshot persistence

Status: Accepted

## Context

The app needs to persist two pieces of server state across requests and across
serverless instances: the draft ceremony state (who owns which teams) and the
canonical live-data snapshot. Vercel functions are stateless and their
filesystem is ephemeral, so in-process or on-disk storage does not survive
between invocations or scale across instances. We are already on Vercel and want
to avoid standing up and operating a separate database for a friend-group app.

## Decision

Use Vercel KV (Upstash Redis) as the persistence layer, keyed by a small fixed
set of keys: `draft:state`, `draft:locked:*` backups, `sweepstake:snapshot`, the
refresh lock, the upstream cooloff marker, and the `audit:log` list.

In local development KV is optional: `draft-db.ts` and `snapshot-db.ts` fall back
to a JSON file under `data/` so the app runs with no external services. In
production KV is required; the read/write paths fail loud rather than silently
serving stale local state (see `draft-db.ts`).

Hot read paths use a read-only KV token when one is configured
(`getReadKv` in `lib/kv.ts`), falling back to the read/write token otherwise.

## Consequences

- No separate database to operate; one managed dependency.
- The local file fallback keeps the dev loop friction-free and gives the draft a
  recovery artifact, but it is explicitly NOT authoritative in production.
- KV is a hard production dependency for writes; a KV outage degrades reads to a
  computed snapshot (see [0003](0003-degrade-to-static.md)) but blocks draft
  writes. Acceptable: draft writes happen once, pre-tournament.
- Backups of the irreplaceable locked draft are written on lock and restorable
  with `npm run draft:backup` (see [0002](0002-canonical-snapshot.md) for the
  snapshot side).
