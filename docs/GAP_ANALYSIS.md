# Production Readiness Gap Analysis

Of the 33 roadmap items verified against current code, 29 are done, 4 are partial, and 0 are fully open or not-applicable. Every partial is low severity and, by design, acceptable for a 12-friend no-account sweepstake; there are no critical or high-severity gaps. The critical original risk (unauthenticated draft mutations) is closed, auth fails closed in production, and the live-data paths degrade to static fixtures without throwing. Overall readiness: kickoff-ready, with a short list of optional low-severity hardening items below.

## Update: fixes applied

Two of the four partials were closed in code this session; the other two are deliberate defers. Baseline stays green: type-check, lint, 121 vitest tests, coverage above thresholds.

- Read coalescing is now regression-tested. `src/lib/snapshot-coalescing.test.ts` fires 50 concurrent `getSnapshotForRead()` against an expired snapshot and asserts exactly one upstream refresh, so a refactor that drops the stampede guard fails CI instead of silently blowing the 20-req-per-minute budget on kickoff.
- CSP violation reporting is now wired in code. `src/proxy.ts` adds `report-to csp-endpoint` + `report-uri /api/csp-report` plus a `Reporting-Endpoints` header; the new `src/app/api/csp-report/route.ts` is a log-only sink (returns 204, drops oversized bodies, never throws), covered by `route.test.ts`. Enforcement is unchanged, so this is pure observability.

Deliberately deferred (low value or disproportionate risk before kickoff):

- Nonce-based CSP to drop `'unsafe-inline'`: a genuinely involved change through Next 16 streaming SSR. Enforcement is unchanged and the reporting above now makes any violation observable. Revisit post-kickoff.
- Error-boundary alerting to Sentry: needs an external account and service. Structured `console.error` captured by Vercel logs is the reasonable ceiling at this scope.
- Optimistic CAS on draft mutations: `withLock` (SET NX EX) already serializes the one-time supervised draft, and the residual double-draw needs both a KV error and a duplicate POST. Adding CAS touches the critical draft path, so the fix risk outweighs the bug risk right before kickoff.

## Still open (fix these)

All remaining items are partials or noted caveats at low severity. Sorted by severity (none critical/high).

| Item                                                           | Area                       | Severity | What is missing / Evidence                                                                                                                                                                                                                                                                                                               | Fix                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------- | -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSP fully closes `unsafe-inline` + adds violation reporting    | headers-deps-ci-data       | low      | Partial. `unsafe-eval` is dev-gated and the eval sink is closed in prod, but `'unsafe-inline'` remains on prod `script-src` (src/proxy.ts:9) because no nonce is wired for Next hydration/streaming. No `report-to`/`report-uri` directive anywhere in src/proxy.ts.                                                                     | (a) Wire a nonce-based CSP through Next streaming SSR to drop `'unsafe-inline'` (larger change, deferred in-code). (b) Add a `report-uri`/`report-to` directive pointing at a collector so CSP violations are observable.                            |
| Load/stress test asserts read coalescing (<=1 upstream call)   | live-data-reliability      | low      | Partial. scripts/load-test.mjs fires N concurrent GETs and reports status/latency, but verification of "<=1 upstream call" is left to manual log inspection. No automated test fires concurrent `getSnapshotForRead` and asserts the upstream fetch ran <=1 time; snapshot-db.test.ts only checks lock exclusivity, not read coalescing. | Add a vitest that mocks fetch with a call counter, fires ~50 concurrent `getSnapshotForRead()` against a missing/expired snapshot, and asserts the fetch mock was called <=1 time, turning the stampede guarantee into a regression-proof assertion. |
| Error boundaries forward to an alerting sink, not just console | observability-dr-docs-a11y | low      | Partial. Three route-level boundaries exist; src/app/error.tsx:16-20 logs a structured `console.error('[error-boundary]', {message,digest,stack})` searchable in Vercel logs, but there is no Sentry/`captureException` or explicit forward to an alerting destination. Console is the only sink.                                        | If tighter alerting is wanted, wire the boundary to a reporting endpoint or Sentry. Structured console.error captured by Vercel logs is a reasonable ceiling at this scope.                                                                          |
| Optimistic version / CAS on draft mutations                    | draft-api-security         | low      | Done with caveat. All five mutators use `withLock` (SET NX EX) which is the real gate, but kv-lock.ts:27 fails OPEN on a KV error and `draw` is non-idempotent, so a KV outage plus a duplicate POST could draw twice. Acceptable for a supervised 12-person draft.                                                                      | Optional: add an optimistic version counter on `draft:state` (CAS on write) so a duplicate `draw` or a lock-fail-open race is rejected rather than double-applied.                                                                                   |

## Already done

### draft-api-security

- POST /api/draft requires a valid cookie/secret, 401 to anonymous. route.ts:63-64 gates POST via isAuthorized(); sha256(DRAFT_SECRET) cookie compared with timingSafeEqual (draft-auth.ts:46-51).
- Auth fails CLOSED in production when secrets unset; fail-open only in local dev. draft-auth.ts:32-38 noSecretAllows() denies in prod; dev-console.ts:38-46 mirrors for DEV_CONSOLE_PASSWORD.
- Rate limiting wired into /api/draft and /api/share/\*. rateLimit() invoked in draft/route.ts:31,67 (429 on !ok) and both share routes; fails open only on KV error, by design.
- POST body schema-validated per action; unknown action returns 400. route.ts:79-82 + draft-validation.ts:23-52 whitelist the 5 actions and enforce per-action shape; exhaustive never default.
- Error responses sanitized. route.ts:57-60 and 134-141 return fixed generic strings ('Draft is busy, try again' 409 / 'Draft action failed' 500); raw error never leaked.
- Append-only audit trail for mutations and auth decisions. audit-log.ts capped (500) KV list + stdout echo; route.ts:126-131 logs actor IP + before/after assignment hashes; draft/actions.ts:18-22 logs login success/fail.

### live-data-reliability

- 429 detected distinctly with Retry-After and greppable log line, not retried. football-api.ts:144-153 dedicated branch logs `[football-api] RATE_LIMIT_429`; retry loop only covers 5xx. Covered by football-api-degrade.test.ts.
- Retry-After cooloff / circuit breaker prevents hammering upstream. upstream-cooloff.ts KV marker clamped 1-300s; checked at top of apiFetch (football-api.ts:115-117), set from the 429 branch.
- releaseRefreshLock() called in finally. refresh-snapshot.ts:108 (`.finally`) and 115-121 (try/finally); LOCK_TTL_SECONDS=15 is only the crash ceiling.
- Fetch-path degrade + chaos test. football-api-degrade.test.ts covers 429/500/network->null; load-data-chaos.test.ts asserts complete SweepstakeData (dataSource==='static') without throwing under permanent 429.
- Read-only KV token wired for read paths. kv.ts getReadKv uses KV_REST_API_READ_ONLY_TOKEN, wired into snapshot-db.ts:29 and draft-db.ts:95; not a dead line.

### headers-deps-ci-data

- CI npm audit gate on runtime HIGH. ci.yml:49-50 runs `npm audit --omit=dev --audit-level=high` on push and PR.
- next >=16.2.9 and no runtime HIGH. package.json pins ^16.2.9 (resolves 16.2.9); audit exits 0 with only 4 MODERATE (postcss transitively via next), zero HIGH/CRITICAL.
- data/draft.json no longer tracked. `git ls-files data/` empty; .gitignore:77 ignores `data/`.
- Immutable locked-draft backup + scripts/draft-backup.mjs. draft-db.ts:155-173 writes `draft:locked:<stamp>` + `draft:locked:latest` at lock time; backup script wired as `npm run draft:backup`; integration test asserts the key.
- Coverage threshold gate. vitest.config.ts:29-34 thresholds (stmts 72 / branches 65 / funcs 78 / lines 73); CI runs `npm run test:coverage`.
- e2e + axe a11y run in CI. ci.yml:104-131 builds, starts next on 3100, runs Playwright chromium; a11y.spec.ts asserts zero serious/critical axe violations.

### observability-dr-docs-a11y

- Vercel Web Analytics + Speed Insights installed. layout.tsx:2-3 imports, mounted at :69-70.
- KV-outage runbook entry. docs/football-data-runbook.md:104-110.
- Top-level snapshot read try/catch degrades to static fixtures. refresh-snapshot.ts:78-86 getSnapshotForRead(); keeps last-known-good on upstream degrade.
- RTO/RPO stated. docs/football-data-runbook.md:116-120 (RTO ~30 min; live RPO ~0; draft RPO = last lockDraft backup).
- CACHING.md documents budget math, TTLs, invalidation, force-bust. docs/CACHING.md (6 layers, ~4-5/min vs 20/min ceiling, `npm run snapshot:bust`).
- DraftCeremony reel-spin respects prefers-reduced-motion. DraftCeremony.tsx:124-131 skips the JS-timer reel spin and jumps to reveal.
- Leaderboard aria-live region. LeaderboardTab.tsx:67-69 `role="status" aria-live="polite" sr-only`, keyed on order signature so it announces only on an overtake.
- `--color-fg-subtle` contrast passes AA. globals.css:48 raised to rgba(251,251,251,0.46) (~4.3:1 over --color-bg); axe color-contrast gate green across all four themes.
- ADRs exist. docs/adr/ has 4 accepted ADRs + README index.
- Mermaid architecture diagram in README. README.md:60-84 flowchart TD.
- API contracts documented. docs/api.md covers all six routes (auth, request/response, caching).

## Not applicable

None. Every roadmap item maps to a real code or docs concern in this project.

## Needs infrastructure, not code

These remaining items depend on platform configuration or external services rather than code in this repo:

- CSP violation reporting endpoint (`report-uri`/`report-to`): requires a collector or report-only endpoint (e.g. a Vercel endpoint or third-party CSP report collector) to point the directive at.
- Error-boundary alerting: forwarding beyond structured `console.error` requires an external destination (Sentry project or a reporting endpoint). Vercel log capture is already in place; a true alerting sink is an infra add.
- 429 alert/metric: the current signal is a structured log line for log-based alerting. A real counter/alert would need a metrics/alerting backend, not code changes here.
