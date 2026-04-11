# Football-Data Runbook

## Production contract

- Plan: football-data.org free tier
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
- Debug routes:
  - `GET /api/matches` returns group fixtures only
- `GET /api/matches?scope=all` returns group fixtures plus knockout match state
  - and any extra scoring matches such as the third-place playoff
  - `GET /api/standings` remains diagnostic only

## Free-tier refresh policy

- Active World Cup match windows: `60s`
- Non-match periods: prefer `300s` or slower if you change cadence later
- Do not add client-side polling on top of ISR for the public app

At `60s`, the app uses roughly one authenticated request per minute for the main feed, which stays comfortably below the free-tier limit of ten requests per minute as long as debug routes are not being hammered.

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
6. Confirm `/api/matches?scope=all` exposes knockout matches when they exist
7. Confirm the leaderboard changes after injecting known knockout outcomes in tests

## Failure modes

- Missing API key:
  - app falls back to static group-stage fixtures
  - knockout automation is unavailable because static fallback has no knockout feed
- Upstream API failure:
  - app falls back to static data
- Free-tier score delay:
  - source is still football-data.org
  - scores may lag real events

## Operational rule

Use the competition matches endpoint as the single source of truth. Do not build the app around per-team, per-match, or client-side API calls.
