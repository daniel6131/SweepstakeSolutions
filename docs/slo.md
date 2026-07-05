# Service Level Objectives (SLOs)

Scope: a single shared 2026 World Cup sweepstake for 12 friends. These targets are
deliberately lightweight. They exist to make "good enough" answerable on match day, not to run
an enterprise error-budget program. Two user journeys carry an SLO; everything else is
best-effort.

## Journeys and targets

| Journey                   | SLI                                                      | Target (28-day window)                     | Measured by                                      |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| Home render (`/`)         | Fraction of loads returning 200 with live-or-static data | Availability >= 99.5%, p95 render < 800 ms | Vercel Analytics + Speed Insights, function logs |
| Live scores (`/api/live`) | Fraction of requests served a snapshot without a 5xx     | Availability >= 99.9%, p95 < 500 ms        | Function logs, `/api/health` readiness probe     |

Both journeys degrade to static fixtures rather than erroring, so "availability" here means
"served usable data", which the degrade-to-last-known-good path already guarantees under an
upstream outage.

## Error budget (lightweight)

At 99.5% over 28 days the home journey may be down for about 3.4 hours before the budget is
spent. Policy: if the budget is spent during the tournament, freeze non-essential deploys and
fix reliability first. No burn-rate automation; the maintainer watches the `[error-boundary]`
and `RATE_LIMIT_429` log signals plus the uptime probe.

## Upstream budget (the real constraint)

The binding limit is the football-data.org request quota, not compute. Refreshes are serialised
by a KV lock (SET NX EX) so N concurrent readers collapse to at most one upstream call per
stale window; `src/lib/snapshot-coalescing.test.ts` pins that guarantee.

The upstream tier is the football-data.org **paid tier at 20 req/min** (authoritative in
`CLAUDE.md`, `docs/football-data-runbook.md`, and `snapshot-freshness.ts`). The lock-coalesced
worst case (about 4 to 8 req/min) sits comfortably under that ceiling. Note: the historical
`PRODUCTION_READINESS_AUDIT.md` threat model still says "free tier ~10 req/min"; that is stale,
treat 20 req/min as the budget.

## Detection

- `/api/health` readiness probe (KV reachability + cooloff state) for an external uptime monitor.
- Log signals: `RATE_LIMIT_429` (upstream throttle) and `[error-boundary]` (a rendered error).
- Speed Insights for field Core Web Vitals against the render targets above.
