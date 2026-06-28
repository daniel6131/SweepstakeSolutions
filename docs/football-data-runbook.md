# Football-Data Runbook

## Production contract

- Plan: football-data.org paid tier (20 requests/minute; live scores, fixtures, schedules, league tables)
- Competition: `WC`
- Season: `2026`
- Primary endpoint: `GET /v4/competitions/WC/matches?season=2026`
- Optional diagnostics endpoint: `GET /v4/competitions/WC/standings?season=2026`

## What the app uses

- Public homepage and leaderboard:
  - one server-side World Cup matches fetch
  - group-stage fixtures derived from the response
  - group standings computed locally from the same feed
  - knockout results mapped onto the internal bracket and folded into leaderboard scoring
  - third-place playoff is scored from the same live feed even though it is not part of the public bracket UI
- Fixtures tab:
  - group-stage schedule remains the schedule view
  - knockout tab shows the internal bracket with live or finished knockout scores when available
- Live read path:
  - `GET /api/live` serves the canonical KV snapshot (stale-while-revalidate)
  - the snapshot is the single source of truth; the standalone `/api/matches` and
    `/api/standings` debug routes were removed because they bypassed the refresh
    lock and could exhaust the free-tier budget

## Free-tier refresh policy

- Active World Cup match windows: `60s`
- Non-match periods: prefer `300s` or slower if you change cadence later
- Do not add client-side polling on top of ISR for the public app

At `60s`, the app uses roughly one authenticated request per minute for the main feed, which stays comfortably below the paid-tier limit of twenty requests per minute. Concurrent readers are coalesced by the KV refresh lock in `refresh-snapshot.ts`, so a crowd on match day still produces about one upstream fetch per refresh window rather than one per visitor.

## Local and staging checks

### Automated tests

```bash
npm test
```

### Typecheck and lint

```bash
npm run type-check
npm run lint
```

### Production build

```bash
npm run build
```

### Live API smoke test

This checks the real endpoint, logs quota headers, and prints stage/status counts.

```bash
npm run test:football-api-smoke
```

Expected output includes:

- `requests-available`
- `request-counter-reset`
- total `match-count`
- per-stage counts
- per-status counts

## Rehearsal checklist before the tournament

1. Run `npm test`
2. Run `npm run test:football-api-smoke`
3. Verify the smoke test returns World Cup matches for season `2026`
4. Confirm stage counts include group and knockout phases as the tournament progresses
5. Confirm the homepage loads with `dataSource: live`
6. Confirm the leaderboard changes after injecting known knockout outcomes in tests
7. Run a load test against the preview deployment and confirm the upstream stays coalesced:
   ```bash
   npm run load-test -- --url=https://<preview> --requests=200 --concurrency=50
   ```
   Watch the logs: a healthy run shows few or no `[football-api] RATE_LIMIT_429` lines.

## Match-day monitoring

- The only distinct, alertable upstream signal is the log line
  `[football-api] RATE_LIMIT_429` (emitted on any 429, with the `Retry-After` value).
  Set a Vercel log alert on that string; if it appears repeatedly the refresh
  cadence or the lock TTL needs attention.
- Scores going stale (not wrong) is the expected degraded state: the app keeps
  serving the last known-good live snapshot rather than resetting to the schedule.

## Failure modes

- Missing API key:
  - app falls back to static group-stage fixtures
  - knockout automation is unavailable because static fallback has no knockout feed
- Upstream API failure (429 / 5xx / network):
  - app falls back to the last known-good snapshot, then static data
  - a 429 emits the distinct `RATE_LIMIT_429` log line
- KV outage (snapshot store unreachable):
  - `getSnapshotForRead()` catches the failure and degrades to a freshly computed
    snapshot (static fixtures), so the page still renders instead of 500ing
  - recovery: confirm `KV_REST_API_URL` / `KV_REST_API_TOKEN` in the Vercel project,
    redeploy; to force the static path deliberately, unset `KV_REST_API_URL` and redeploy
  - the draft is the irreplaceable state: restore it with
    `npm run draft:backup -- restore --write` (see `scripts/draft-backup.mjs`)
- Free-tier score delay:
  - source is still football-data.org
  - scores may lag real events

## Recovery objectives (informal)

- RTO (time to restore service): about 30 minutes, bounded by a Vercel redeploy.
- Live-score RPO: about 0; scores recompute from upstream on the next refresh.
- Draft RPO: the last `lockDraft()` backup (`draft:locked:latest`), which is the
  only state that cannot be recomputed.

## Operational rule

Use the competition matches endpoint as the single source of truth. Do not build the app around per-team, per-match, or client-side API calls.
