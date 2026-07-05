# Production Readiness Audit

> **Status note (current):** This is the original audit and much of it has since been delivered. For the reconciled current state (of 33 items verified against live code: 29 done, 4 low-severity partials, 0 critical or high open), see [docs/GAP_ANALYSIS.md](./GAP_ANALYSIS.md). In particular the "wide open write surface" described below is HISTORICAL: `POST /api/draft` now requires a valid cookie and returns 401 to anonymous callers, auth fails closed in production, rate limiting is wired, and `next` is patched. Two remaining hardening partials (read-coalescing regression test, CSP violation reporting) were closed this session; the rest are deliberate low-severity defers documented in the gap analysis.

This audit covers the World Cup Sweepstake app against the hard deadline of kickoff. The headline finding is that the app's live-data engine is genuinely well built (one canonical KV snapshot, an atomic refresh lock, degrade-to-last-known-good on a 429) but the privileged write surface is wide open. The top three ship-blockers, in plain language: (1) anyone on the public internet can POST to `/api/draft` and reset, lock, re-roll or trade the entire draft, because the route has no authentication at all and the draft cookie is path-scoped so it cannot even reach the API; (2) the auth model fails OPEN when `DRAFT_SECRET` is unset, so a single missed Vercel env var silently unlocks the draft page; (3) two legacy routes (`/api/matches`, `/api/standings`) bypass the snapshot lock and call the rate-limited football-data upstream directly, which can burn the 10 req/min budget on match day. Everything else is hardening, resilience, and operational polish on top of an otherwise solid core. The good news is that the most dangerous issues are small, surgical fixes (mostly S-effort) that can land before kickoff.

## Scope & threat model

IN scope: a single shared 2026 World Cup sweepstake for one friend group of 12, deployed to Vercel, with a one-time organiser-run draft and live match-day score tracking. The crown jewels are match-day reliability (the live snapshot staying fresh under the football-data 10 req/min free-tier limit) and the integrity of the locked draft assignments. There are NO end-user accounts, NO per-user PII beyond already-public participant names, NO payments, and NO multi-tenancy, so the threat model is "a curious or malicious anonymous internet caller who knows the deployment URL", not "an authenticated tenant attacking another tenant".

Deliberately marked NOT-APPLICABLE:

- IDOR / object-level authorization (#6, #33): no per-user accounts or per-user records, so there is no `ownerId` to confuse.
- AI tool authorization and prompt injection (#39, #40): no runtime LLM; the only AI is the dev-only `gen-image.mjs` reference-image script.
- Multi-tenant data isolation (#49): one shared dataset keyed on two fixed KV keys, no tenant id.
- Object-storage / bucket policies (#8): persistence is KV only; imagery is static files in `public/`.
- JWT validation (#26) and password reset / account recovery (#24): no JWTs are issued and there is no account system (reset = rotate the env var).
- TLS termination, certificate rotation, and KV encryption-at-rest (#48): delegated to the Vercel / Upstash managed platform.
- Staging / preview exposure (#29): no separate privileged staging environment exists; the only override surface (dev-console) is already disabled in production unless explicitly enabled.

## Findings by severity

### Critical

- **Unauthenticated draft mutation API (`POST /api/draft`)** · refs #4, #5, #9, #15, #18, #20 · `src/app/api/draft/route.ts:31-74`. The POST handler reads `body.action` and dispatches straight to `startDraft`/`drawNext`/`tradePlayers`/`lockDraft`/`resetDraft` with no cookie read, no secret check, and no `isValidDraftCookie` call; the mutators in `src/lib/draft-db.ts:172-269` enforce only phase invariants, not auth. The draft cookie is path-scoped to `/draft` (`src/app/draft/actions.ts:23`) so it never reaches the API, and the client posts credential-free (`src/app/draft/draft-types.ts:97-98`). Gap: any anonymous caller can `POST {"action":"reset"}` to wipe all assignments or re-roll the single run-once ceremony, with no rate limit. Fix: guard the handler with a server-side cookie/secret check (mirroring `src/app/draft/page.tsx`), widen the cookie path or send an explicit token, and fail closed when `DRAFT_SECRET` is unset.

### High

- **MATCH-DAY · Cookie gating on the draft is cosmetic** · refs #27, #47 · `src/app/api/draft/route.ts:31-74`. Same root cause as the critical above, viewed from the sessions angle: the cookie protects only the animated UI, not the state-mutating API, so `curl -X POST .../api/draft -d '{"action":"reset"}'` wipes the draft. Fix: read the cookie via `next/headers` and call `isValidDraftCookie` at the top of POST; consider a hard lock so `reset`/`trade` 403 after `lock`.

- **MATCH-DAY · `/api/matches` and `/api/standings` bypass the snapshot lock** · refs #28, #45 · `src/app/api/matches/route.ts:38,51`, `src/app/api/standings/route.ts:22`. These call `fetchLiveTournamentData`/`fetchLiveFixtures`/`fetchLiveStandings` directly (cache `no-store`, guarded only by a per-instance 5s Map), never touching `acquireRefreshLock`. They are dead (no client references them) but publicly reachable and unauthenticated, so a tight loop can each force an upstream call and exhaust the 10 req/min budget. Fix: delete them, or rewrite to read `getSnapshotForRead()` like `/api/live`.

- **MATCH-DAY · `next@16.2.1` has unpatched HIGH advisories** · refs #37, #38 · `package.json:32`. `npm audit` flags GHSA-q4gf-8mx6-v5v3 / GHSA-8h8q-6873-q5fj (RSC DoS, CVSS 7.5) and GHSA-26hh-7cqf-hhc6 (proxy bypass), all fixed below 16.2.6; latest 16.2.9 is in-caret. The DoS hits the live RSC home page. Fix: `npm update next` to 16.2.9, commit the lockfile, verify build + e2e.

- **MATCH-DAY · football-data fetch / cache / 429-fallback path is untested** · refs integration, chaos · `src/lib/football-api.ts:113-118, 346-348, 381-383`. Only the pure `transformCompetitionMatches` is covered; the no-store fetch, the in-memory cache window, and the 429 to null degradation are not. A refactor that throws a 429 to the user instead of degrading would pass every current test. Fix: add a Vitest suite stubbing `global fetch` to assert 429/500/network-error resolve to null (caller falls back to `src/data/fixtures.ts`) and that two calls within the window issue one fetch.

- **Public repo exposes the unauthenticated draft API** · refs #10, #13, #14 · `gh repo view` => PUBLIC, `src/app/api/draft/route.ts:31-73`. The repo is public, so the exact endpoint and action names are discoverable, and the path-scoped cookie model (`actions.ts:23`) is architecturally incompatible with guarding the API. Fix: add a server-side guard (header secret via the existing `timingSafeEqual`, or re-scope the cookie to `/`), and make the secret REQUIRED in production (fail closed).

- **Auth fails OPEN when the secret env var is unset** · refs #27 · `src/lib/draft-auth.ts:26-37`, `src/lib/dev-console.ts:22-43`. `isValidDraftPassword`/`isValidDraftCookie` return `true` when the secret hash is null, so an unset or whitespace `DRAFT_SECRET` makes `/draft` fully public with no startup warning. Fix: in production, treat a missing secret as DENY (return 401 / `notFound`), keep fail-open only for local dev.

- **`data/draft.json` is committed and not gitignored** · refs #7, #41 · tracked in git, `git check-ignore` exits 1, `.gitignore:1-74` has no `data/` entry. The committed file holds real mid-draft state (status `drafting`, 30 player to team assignments), leaking the surprise in a public repo and, if KV env vars are ever absent, silently serving this stale committed snapshot (`draft-db.ts:88-103`). Fix: add `data/` to `.gitignore`, `git rm --cached`, and add a prod assert that loud-fails when `isKVEnabled()` is false.

- **Unauthenticated, unthrottled `/api/draft` POST allows spam mutations** · refs #28, #30 · `src/app/api/draft/route.ts:31-66`. No rate limit on the mutation surface, so `reset` is a cheap KV-write amplification. Fix: the auth guard above plus a per-IP cap (Vercel WAF or `@upstash/ratelimit` on `@vercel/kv`).

- **Zero integration tests for API route handlers** · refs integration · no test imports any route. The most dangerous behaviour in the app has no automated test, so the eventual auth fix has no regression lock. Fix: add Vitest integration tests that import the route handlers, mock `@vercel/kv` and the cookie, and assert reject-without-cookie / accept-with-cookie / 400-on-unknown-action; land them in the same PR as the auth fix.

- **KV `draft:state` has no backup** · refs #44 · `src/lib/draft-db.ts:15`, write at `:130`. The locked assignments (the whole premise) live only in Upstash KV with no export, versioning, or prior-value capture; an accidental (and currently unauthenticated) `reset` permanently destroys them. Fix: after `lockDraft`, write an immutable copy to `draft:locked:<ts>` and/or commit final assignments to static participants; add `scripts/draft-backup.mjs`.

### Medium

- **MATCH-DAY · football-data 429 is indistinguishable in logs and triggers no alert** · refs #43, #42 · `src/lib/football-api.ts:116-119`. Any non-OK status throws one generic Error, logged identically to a 500; the degrade warning fires for any degradation, not specifically rate-limiting, and goes only to unwatched Vercel logs. Scores go stale, not wrong, but silently. Fix: branch on `res.status === 429`, read `Retry-After`, log a distinct line, increment a KV metric, and wire a cheap webhook alert.

- **MATCH-DAY · `/api/matches` and `/api/standings` serve uncached and lock-bypassing JSON** · caching dimension · same routes as above, no `Cache-Control`, `fetchLiveStandings` uses a `standings` cache key the snapshot path never populates. Fix: route them through `getSnapshotForRead()` or delete them; if kept, add `s-maxage=5` + SWR and gate them.

- **MATCH-DAY · Dev-console manual override never updates the canonical snapshot** · caching dimension · `src/app/dev-console/DevConsoleClient.tsx:86-88`. Overrides apply only in client render, never write `sweepstake:snapshot`, so a match-day correction is invisible to other devices and wiped on the next poll. Fix: if it should be authoritative, persist to KV and overlay in `refreshSnapshot`, then bust the snapshot; otherwise document it as a local what-if tool.

- **MATCH-DAY · No load/stress test for the 10 req/min budget** · refs load, stress · no k6/autocannon/artillery in `package.json`. Nothing verifies that N concurrent visitors collapse to <=1 upstream call. Fix: add a lightweight load test with an instrumented fetch counter, run manually pre-kickoff.

- **MATCH-DAY · No chaos/resilience test for a football-data outage end-to-end** · refs chaos · the degrade contract is implemented but never verified through `load-data.ts`. Fix: an integration test that forces the fetchers to fail and asserts `load-data.ts` still returns complete `SweepstakeData` from static fixtures without throwing.

- **MATCH-DAY · No documented DR plan for a KV outage during a match** · DR dimension · `readSnapshot`/`acquireRefreshLock` have no try/catch on the main read path; the runbook covers only API failures. Fix: add a "KV outage" runbook entry (unset `KV_REST_API_URL` to force static fixtures, redeploy) and optionally wrap the top-level read in a try/catch returning a static snapshot.

- **`/api/draft` returns `String(error)` to the client** · refs #12 · `src/app/api/draft/route.ts:27,72`. Raw KV/parse error text is echoed to anonymous callers, unlike the sanitized standings/matches routes. Fix: log server-side, return a generic `{ error: 'Draft action failed' }`.

- **Auth default-allow when secret unset (authz angle)** · refs #5, #15 · `src/lib/draft-auth.ts:32-37`, `src/lib/dev-console.ts:32-43`. A single missing env var flips both privileged surfaces from protected to public. Fix: fail closed in production; optionally fail the build or log loudly.

- **Static, replayable bearer cookie** · refs #5, #34 · `src/app/draft/actions.ts:15-25`. The cookie value is `sha256(DRAFT_SECRET)` verbatim, identical for every user, replayable for the full 12h/8h window with no per-session token or rotation. Mitigated by httpOnly + secure + sameSite=lax and the trusted audience. Fix (lower priority): issue a signed, expiring session token.

- **No security headers via `next.config.ts` and no central middleware (authz angle)** · refs #32, #34 · `next.config.ts` has no `headers()`. Note: a security-header layer DOES exist in `src/proxy.ts` (see Implemented), so this is partly superseded; the residual point is the lack of a single choke point for `/api` auth. Fix: centralise the `/api/draft` guard.

- **POST body has no schema validation (combined with no CSP, in the injection dimension)** · refs #16, #19 · `src/app/api/draft/route.ts:33-53`. Trade params are passed downstream untyped; bad input degrades to a 500 (no corruption). Fix: a zod schema per action; pairs with the error-sanitisation fix.

- **`draft:state` writes are read-modify-write with no lock** · refs #7 · `src/lib/draft-db.ts:187-229, 234-253`. `kv.get` then `kv.set` with no compare-and-set, unlike the snapshot path which locks. Two near-simultaneous (and currently unauthenticated) POSTs can interleave into a corrupted draft. Fix: wrap mutations in the same `SET NX EX` lock proven in `snapshot-db.ts`, or add an optimistic version field.

- **No rate limiting anywhere** · refs #28 · no `middleware.ts`, no WAF rules, no `@upstash/ratelimit`. The primary live path is lock-coalesced (good), but the mutation route and the CPU-heavy `next/og` share routes are unthrottled. Fix: Vercel WAF per-IP rules on `/api/draft` and `/api/share/*`, plus a thin app-level limiter.

- **Share-card (`next/og`) routes are CPU-heavy, unauthenticated, unthrottled** · refs #28 · `src/app/api/share/standings/route.tsx`, `src/app/api/share/[player]/route.tsx`. They correctly read the snapshot (no upstream cost) but `?demo`/arbitrary `[player]` bust the CDN cache, so distinct URLs drive serverless compute. Fix: per-IP WAF limit and normalise `[player]` to the known 12 (fast 404 otherwise).

- **CSP allows `'unsafe-eval'` and `'unsafe-inline'` in production** · refs #46 · `src/proxy.ts:11`. The loose `script-src` is applied in every environment despite the "dev only" comment, neutering XSS mitigation. Fix: gate the loose `script-src` to dev, or move to a per-request nonce; at minimum drop `'unsafe-eval'` in production.

- **CI uses `--no-audit` and has no audit/Snyk gate** · refs #37, #38 · `ci.yml:30,57,78`. The pipeline stays green while shipping the HIGH `next` advisory. Fix: add `npm audit --omit=dev --audit-level=high` as a CI job.

- **No audit trail for the draft mutation API** · refs #42 · `src/app/api/draft/route.ts:36-66`. A `reset`/`lock` is executed with no record of origin, timestamp, or prior state. Fix: append-only KV log (`audit:draft`) on each mutation, capturing the pre-mutation assignments hash.

- **No audit trail for login / auth attempts** · refs #42 · `src/lib/draft-auth.ts:26-30`, `src/app/dev-console/actions.ts:13-37`. Failed logins just redirect with no record, so credential-guessing is invisible. Fix: emit a structured log line per auth decision; log loudly when the secret is null in production.

- **No monitoring, error reporting, or analytics** · refs #43 · no Sentry / `@vercel/analytics` / SpeedInsights / log drain. Error boundaries `console.error` to the client only. Fix: add free-tier Vercel Web Analytics + Speed Insights and a lightweight error/429 alert.

- **Refresh lock has a fixed 15s TTL with no renewal** · concurrency dimension · `src/lib/refresh-snapshot.ts:22`. `releaseRefreshLock` exists but is never called, so a fast refresh holds the lock 15s and a slow refresh (>15s) lets a second upstream call start. Fix: call `releaseRefreshLock()` in a `finally` after `writeSnapshot`; size the TTL to worst-case latency.

- **Draft draw/trade/lock race (concurrency angle)** · concurrency dimension · `src/lib/draft-db.ts:183-262`. Same non-atomic RMW as above; `draw`/`trade`/`reset` are non-idempotent and (currently) world-callable. Fix: KV lock plus an idempotency key on `draw`.

- **In-memory cache is per-instance; budget rests on the KV lock, undocumented** · caching dimension · `src/lib/football-api.ts:34-36`. On Fluid Compute the Map gives near-zero cross-instance coalescing; the worst-case req/min is never written down. Fix: document the budget math next to `LOCK_TTL_SECONDS`/`STALE_MS` and add an assertion/test.

- **No explicit invalidation/tagging plan** · caching dimension · no `cacheTag`/`revalidateTag`/`updateTag` anywhere; invalidation is TTL-only. Worst-case score-visibility latency (`STALE_MS` + CDN `s-maxage`, ~20s) is undocumented. Fix: write the plan into a `CACHING.md` and add an organiser force-bust (`kv.del('sweepstake:snapshot')`).

- **No coverage threshold gate in CI** · refs coverage · `vitest.config.ts:13-17` declares coverage but no `thresholds`; `ci.yml:32` never computes it. Fix: add `test:coverage`, a thresholds block, and run it in CI.

- **Playwright e2e exists but never runs in CI** · refs e2e · `e2e/smoke.spec.ts` (6 tests) is configured but `ci.yml` never installs browsers or runs it. Fix: add a `test:e2e` CI job (needs build) that installs chromium and serves the app.

- **No integration tests around KV persistence and the local fallback** · refs integration · no `vi.mock('@vercel/kv')` anywhere. The `draft.json` safety net is never tested. Fix: Vitest suites mocking KV to assert round-trips and the fallback-to-file path.

- **Draft ceremony reel-spin ignores `prefers-reduced-motion`** · a11y · `src/app/draft/components/DraftCeremony.tsx:150,221`. The 55ms-interval spin is JS-timer-driven, so the global CSS reduced-motion block does not catch it, violating the project's reduced-motion mandate. Organiser-only, run-once, hence medium. Fix: read `matchMedia` once and jump to the reveal phase when reduced.

- **Live leaderboard changes are not announced to screen readers** · a11y · `src/components/leaderboard/LeaderboardTable.tsx:56`. The standings `<ol>` has no `aria-live`; the marquee live feature is silent for AT users (WCAG 4.1.3). Fix: a visually-hidden `aria-live="polite"` region emitting a debounced diff.

- **`--color-fg-subtle` (0.25 alpha) fails WCAG AA on all four themes** · a11y · `globals.css:45`. Contrast ~2.1 to 2.2; used 33 times including inactive desktop tab text (`Nav.tsx:167,245`). Fix: raise to ~0.38 to 0.42 alpha for secondary text and >=4.5 for interactive labels; keep 0.25 only for aria-hidden glyphs.

- **Committed `data/draft.json` is a stale artifact masquerading as a backup** · refs #44 · last touched in PR #7/#8, holds an incomplete draft, never read in production. Fix: delete and gitignore, or repurpose to hold the final locked state at lock time. Pick one.

### Low

- **MATCH-DAY · No retry/backoff or 429-aware circuit breaker; `Retry-After` ignored** · concurrency dimension · `src/lib/football-api.ts:109-122`. After a 429 the next stale read hits upstream again. Mitigated heavily by the KV lock (bounded to ~4 to 8 req/min) and degrade-to-last-good, so it cannot exhaust the budget, but it is impolite on the free tier. Fix: persist a `sweepstake:upstream-cooloff` marker honouring `Retry-After`; retry-once-with-jitter on transient 5xx only.

- **No security headers in `next.config.ts` (secrets angle)** · refs #36 · low impact given the headers ship via `src/proxy.ts`; this duplicate finding is superseded by the Implemented entry below.

- **POST `/api/draft` trusts JSON body shape with no schema** · refs #16, #17 · `src/app/api/draft/route.ts:33-53`. Worst case is a 500 (no corruption sink). Fix: zod schema + generic 400.

- **Share `[player]` route reflects an unvalidated id, but only into a 404/Satori image** · refs #16, #22 · `src/app/api/share/[player]/route.tsx:26-27`. No XSS (text/plain or PNG). Fix: optionally validate against `PARTICIPANTS`.

- **`KV_REST_API_READ_ONLY_TOKEN` is declared but never used** · refs #7, #41 · `.env.local.example:24`. Read paths run with the write-capable token. Fix: wire a read-only client, or remove the dead config line.

- **Snapshot write is last-write-wins with no CAS; cron can race on-demand refresh** · concurrency dimension · `src/lib/snapshot-db.ts:44-60`, `src/app/api/cron/refresh/route.ts:26`. Self-healing on next refresh, low blast radius. Fix (defer): route the cron through the lock or stamp `updatedAt`.

- **Cron warmer runs once daily (Hobby), not a match-day heartbeat** · caching dimension · `vercel.json:3-8`. Freshness depends on a viewer being present. Fix: on Vercel Pro set the cron to `* * * * *`.

- **Stale, inconsistent caching comments** · caching dimension · `football-api.ts:7` ("55s cache" vs actual 5s), `snapshot-freshness.ts:4-6` ("paid ~20 req/min" vs free 10). Fix: reconcile the docs and state the real TTLs and budget math in one place.

- **No regression/snapshot suite for past live-data bugs** · refs regression · recent fixes (#25 to #29) are not pinned by named tests. Fix: convert each notable fix into a named regression test.

- **No PR template and no in-repo branch-protection signal** · refs code-review · only CODEOWNERS exists. Fix: add `.github/pull_request_template.md` and enable branch protection requiring CI + review.

- **`role="tab"` widgets lack tabpanel/aria-controls and arrow-key navigation** · a11y · `Nav.tsx:142,161`. Fix: either downgrade to plain nav buttons (simplest) or complete the ARIA tabs pattern.

- **No axe/Lighthouse a11y gate in CI** · a11y · the contrast and tabs gaps reaching production is direct evidence nothing catches them. Fix: add `@axe-core/playwright` to the smoke spec and wire into `pre-push`.

- **No RTO/RPO targets defined** · DR dimension · no SLO statement anywhere. Fix: a 3-line target in the runbook (RTO ~30 min, live-score RPO ~0, draft RPO = last manual lock-time backup).

- **`CRON_SECRET` undocumented in `.env.local.example`** · docs · the cron route requires it (fail-safe 401) but it is undiscoverable. Fix: add it (and `KV_*`, `DRAFT_SECRET`) to `.env.local.example` and the README table.

- **No ADRs** · docs · the load-bearing decisions live only in code comments. Fix: add 3 to 4 one-page ADRs (KV persistence, canonical snapshot, free-tier caching, degrade-to-static).

- **No maintained architecture diagram** · docs · the README ASCII predates the snapshot/KV design and still says Next.js 15. Fix: replace with a small Mermaid diagram.

- **API request/response contracts are typed but undocumented** · docs · no exported response types, README omits `/api/live`, `/api/draft`, `/api/cron/refresh`, `/api/share/*`. Fix: export the types (or zod-validate) and add a one-table API surface section.

- **CSP source list mismatch; missing `object-src`/`base-uri`/`upgrade-insecure-requests`** · refs #46 · `src/proxy.ts:14-15`. `connect-src` lists football-data.org (server-side only) and `font-src` lists gstatic (next/font self-hosts). Fix: tighten to actual browser needs and add the missing hardening directives plus a `report-to`.

- **Most other audit highs/moderates are dev-tooling transitives, not shipped** · refs #37, #38 · `undici`/`ws`/`vite`/`protobufjs` etc. via jsdom/genai/vitest. Fix: let the Dependabot dev-tooling group carry them; `npm audit fix` clears them.

- **No structured request/access logging on API routes** · refs #43, #42 · the cron 401 rejection is not logged. Fix: a small wrapper or middleware emitting one structured line per `/api/*` request.

### Implemented (green)

- **Snapshot refresh lock correctly serializes upstream fetches** · MATCH-DAY · `src/lib/snapshot-db.ts:73` atomic `SET NX EX`, gated in `refresh-snapshot.ts:86,96`. This is the core thing protecting the 10 req/min quota.
- **Refresh keeps the last known-good LIVE snapshot when upstream degrades to static** · MATCH-DAY · `src/lib/refresh-snapshot.ts:41-51`. A transient 429 cannot blank the leaderboard back to the pre-tournament schedule.
- **Every football-data fetch path degrades to static fixtures, never throws** · `football-api.ts:338-385`, `current-tournament.ts:35-55`, `load-data.ts:50-52`.
- **KV write failures during refresh still serve computed data** · `refresh-snapshot.ts:53-58`.
- **Cron refresh requires Bearer `CRON_SECRET` and fails CLOSED** · `src/app/api/cron/refresh/route.ts:18-21`. The correct secure-default pattern to mirror for `/api/draft`.
- **Read-only data APIs (live/standings/matches/share) expose no write capability** · GET-only; the only snapshot writer is `refresh-snapshot.ts`.
- **No secret literals in source or the served bundle; no `.env` ever committed; clean git history** · refs #1, #2, #3, #11, #13.
- **`.gitignore` covers all env variants; only the non-secret `NEXT_PUBLIC_BASE_URL` reaches the client.**
- **`/dev-console` gated by `NODE_ENV` / `ENABLE_DEV_CONSOLE`; dev-console override is client-only localStorage** (no server write race).
- **Production browser source maps not served; CI uses stub KV creds (no secret leak).**
- **Full security-header set ships via `src/proxy.ts`** · refs #46 · X-Content-Type-Options, X-Frame-Options:DENY, Referrer-Policy, Permissions-Policy, HSTS (2yr + preload + includeSubDomains), and a CSP with `frame-ancestors 'none'`. The "no headers / no middleware" premise was outdated (Next 16 renamed middleware to `proxy.ts`).
- **Cookie flags (httpOnly, secure-in-prod, sameSite=lax, path-scoped) and constant-time comparison** · `actions.ts`, `draft-auth.ts:9-14`.
- **Strong unit coverage of core domain logic** · 8 lib suites + UI primitives (scoring, knockout, provisional, ledger, fixture-filters, match-time, snapshot-freshness, football-api transform).
- **CODEOWNERS + husky pre-commit/pre-push hooks + PR-title semantic gate.**
- **Skip link, native `<dialog>` focus trap, mobile-menu focus trap with restoration, `:focus-visible` rings, alt text on all images, core motion gated on `prefers-reduced-motion`.**
- **Strong documentation: README, dedicated football-data match-day runbook, exhaustive contributor guidelines.**
- **Snapshot schema-version guard forces a recompute when a stored snapshot predates a new field** · `refresh-snapshot.ts:74-78`.

## Phased roadmap

### Phase 0 — Ship blockers (before kickoff)

Ordered by blast radius (widest first).

| Task                                                                                                                                                                      | Closes                                                                                                                                                           | Effort | Acceptance                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a server-side auth guard to `POST /api/draft` (read cookie/header, reject 401 when invalid) and widen the cookie path or send an explicit token so it reaches the API | draft-api-post-unauthenticated, draft-post-unauthenticated-mutation, api-draft-post-unauthenticated, public-repo-unauth-draft-api, draft-post-unauth-no-throttle | S      | An anonymous `curl -X POST /api/draft -d '{"action":"reset"}'` returns 401; a request with a valid draft cookie/token succeeds; an integration test asserts both. |
| Make auth fail CLOSED in production: deny when `DRAFT_SECRET` / `DEV_CONSOLE_PASSWORD` is unset and `NODE_ENV==='production'`                                             | auth-fails-open-when-secret-unset, auth-default-allow-secret-unset, auth-opens-when-secret-unset, default-creds-fail-open                                        | S      | With the secret unset in a production build, `/draft` redirects to login (does not render); local dev with a blank secret still opens.                            |
| Delete `/api/matches` and `/api/standings`, or rewrite them to read `getSnapshotForRead()` (no direct upstream call)                                                      | matches-standings-bypass-lock, matches-standings-bypass-snapshot                                                                                                 | S      | Neither route issues a football-data fetch; a loop against them does not increment the upstream call counter.                                                     |
| Upgrade `next` to 16.2.9 and commit the lockfile                                                                                                                          | next-high-direct-runtime-vuln                                                                                                                                    | S      | `npm audit --omit=dev --audit-level=high` reports zero `next` advisories; build + e2e pass.                                                                       |
| Add a per-IP rate limit (Vercel WAF or `@upstash/ratelimit`) on `/api/draft` and `/api/share/*`                                                                           | no-ratelimit-anywhere, share-image-unthrottled                                                                                                                   | M      | A burst of >N POSTs/min from one IP to `/api/draft` is throttled (429); the live read path is unaffected.                                                         |
| Remove `data/draft.json` from git, add `data/` to `.gitignore`, and add a prod assert that fails loudly when `isKVEnabled()` is false                                     | draft-json-committed-not-gitignored, draft-json-not-a-backup                                                                                                     | S      | `git ls-files data/` returns nothing; a prod boot without KV env vars logs a loud error rather than serving the committed file.                                   |
| Write a one-time immutable backup of the locked draft (second KV key and/or static participants) plus a `scripts/draft-backup.mjs`                                        | kv-draft-no-backup                                                                                                                                               | S      | After `lockDraft`, a `draft:locked:<ts>` key exists; the organiser can restore it with one documented command.                                                    |
| Add 429-specific detection + a cheap alert in `apiFetch` (branch on status, read `Retry-After`, distinct log + webhook)                                                   | no-429-detection-or-alert                                                                                                                                        | M      | A simulated 429 emits a distinct log line and fires the alert webhook; a 500 does not.                                                                            |
| Add a football-data fetch-path test (429/500/network to null fallback) and a chaos test through `load-data.ts`                                                            | football-api-fetch-path-untested, no-chaos-resilience-test                                                                                                       | M      | Forcing the fetchers to 429 leaves `load-data.ts` returning complete static-fixture data without throwing; the test is green in CI.                               |
| Run a manual load test against a built instance with an instrumented upstream counter                                                                                     | no-load-stress-test                                                                                                                                              | M      | N concurrent home-page hits during a simulated live match produce <=1 upstream call within the cache/lock window.                                                 |
| Decide and wire the dev-console override (persist to KV + overlay + bust, or document as local-only)                                                                      | dev-console-override-not-persisted                                                                                                                               | M      | Either an organiser override propagates to `/api/live` on all devices, or the UI clearly labels it as a local what-if tool.                                       |
| Add a "KV outage" entry to the runbook and a try/catch on the top-level snapshot read                                                                                     | kv-outage-dr-undocumented                                                                                                                                        | M      | The runbook lists the unset-`KV_REST_API_URL`-and-redeploy mitigation; a simulated KV failure degrades to static fixtures instead of a 500.                       |

### Phase 1 — Hardening

| Task                                                                                                                              | Closes                                                                                       | Effort | Acceptance                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Sanitise the `/api/draft` error response (log server-side, return generic message)                                                | verbose-error-leak-draft-api                                                                 | S      | `POST /api/draft` never returns raw error text; the server log retains the detail.                                          |
| Add a zod schema per draft action                                                                                                 | draft-post-no-schema-validation, draft-post-unauthenticated-mutation (input shape)           | S      | Malformed bodies return 400 with a generic message; valid bodies pass.                                                      |
| Gate the loose CSP `script-src` to dev only (drop `'unsafe-eval'`/`'unsafe-inline'` in prod, ideally via nonce)                   | csp-unsafe-eval-inline-in-prod                                                               | M      | The production response `Content-Security-Policy` has no `'unsafe-eval'`; the app still renders.                            |
| Tighten the CSP source list and add `object-src 'none'`, `base-uri 'self'`, `upgrade-insecure-requests`, `report-to`              | csp-source-list-mismatch                                                                     | S      | `connect-src` is `'self'`; the hardening directives are present; violations report to a collector.                          |
| Add `npm audit --omit=dev --audit-level=high` as a CI job                                                                         | ci-no-audit-no-gate                                                                          | S      | A new runtime HIGH advisory fails the pipeline; dev-tooling transitives do not.                                             |
| Add an append-only KV audit log for the 5 draft mutations (actor IP, action, ts, prior-state hash)                                | no-audit-trail-draft-mutations                                                               | M      | Each mutation appends one entry to `audit:draft`; the list is capped via `ltrim`.                                           |
| Log every auth decision (success/fail/open-no-secret)                                                                             | no-audit-trail-auth-events                                                                   | S      | Failed logins and a null-secret-in-prod both emit a structured log line.                                                    |
| Add free-tier Vercel Web Analytics + Speed Insights and forward errors to an aggregator                                           | no-monitoring-stack                                                                          | M      | RUM/CWV appear in the Vercel dashboard; error-boundary exceptions reach the aggregator.                                     |
| Call `releaseRefreshLock()` in a `finally` and size the lock TTL to worst-case latency                                            | refresh-lock-fixed-ttl-no-renewal                                                            | S      | A fast refresh frees the lock promptly; a refresh slower than the TTL cannot trigger a second concurrent upstream call.     |
| Serialise draft mutations with the snapshot `SET NX EX` lock pattern (or an optimistic version field) + idempotency key on `draw` | draft-state-rmw-no-lock, draft-state-read-modify-write-race                                  | M      | Two concurrent `draw` POSTs never double-assign a team or drop a pick.                                                      |
| Honour `Retry-After` via a KV cooloff marker; retry-once-with-jitter on transient 5xx                                             | no-429-backoff-circuit-breaker                                                               | M      | While in cooloff, `refreshSnapshot` skips the upstream call and serves the last good snapshot.                              |
| Wire a read-only KV client for read paths, or delete the dead token line                                                          | kv-read-only-token-unused                                                                    | S      | Read paths authenticate with `KV_REST_API_READ_ONLY_TOKEN`, or the line is removed from `.env.local.example`.               |
| Document the budget math and the TTL-only invalidation plan; add an organiser force-bust action                                   | lock-not-cache-protects-budget, no-invalidation-tagging-plan, stale-comments-budget-mismatch | M      | A single `CACHING.md` states the real TTLs, worst-case latency, and req/min ceiling; the dev-console can bust the snapshot. |

### Phase 2 — Resilience & testing

> **Status:** delivered. Coverage gate (ratchet thresholds in `vitest.config.ts`, run in CI via `test:coverage`), KV-persistence + auth + snapshot integration tests, and an e2e + axe a11y job in CI (built app on a dedicated port). The a11y gate now enforces the **full** WCAG 2 AA tag set, including `color-contrast`.
>
> **Colour contrast — resolved.** Empirically, all the AA failures were on the fixtures (amber) tab: amber is the darkest accent, so only it dilutes below 4.5:1 at low opacity. The interactive labels (date-strip nav, filter "N matches" / "Clear", view toggle) were lifted to readable amber; the faint looping nation marquee, like the footer, is decorative ambiance so it's `aria-hidden` + `data-decorative` (WCAG 1.4.3 exception). `--color-fg-muted`/`--color-fg-subtle` had already been bumped for the leaderboard toggle. `color-contrast` is re-enabled in `e2e/a11y.spec.ts` and green across all four themes + the draft login.

| Task                                                                                                                       | Closes                                                | Effort | Acceptance                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| Add Vitest integration tests for the route handlers (auth accept/reject, 400 on unknown action), landing with the auth fix | no-api-route-auth-integration-test                    | M      | The suite proves `/api/draft` rejects unauthenticated callers and accepts valid ones; it runs in CI.      |
| Add KV-persistence integration tests mocking `@vercel/kv` (round-trip + file fallback)                                     | no-kv-persistence-integration-test                    | M      | Tests assert state round-trips and that a KV failure falls back to the local file without throwing.       |
| Add a `test:coverage` script + thresholds block and enforce in CI                                                          | no-coverage-gate                                      | S      | A coverage drop below the threshold fails the PR.                                                         |
| Add a `test:e2e` CI job (install chromium, build, serve, run smoke)                                                        | e2e-not-in-ci                                         | M      | The Playwright smoke runs on every PR to main.                                                            |
| Convert notable past fixes (#25 to #29) into named regression tests                                                        | no-regression-snapshot-suite                          | S      | Each named test pins the exact scenario that was previously broken.                                       |
| Add an automated a11y gate (`@axe-core/playwright` across the four tabs + `/draft/login`) wired into `pre-push`            | no-automated-a11y-gate                                | S      | No serious/critical axe violations on the audited routes; the gate runs pre-push.                         |
| Define RTO/RPO and a backup/restore procedure for both KV keys                                                             | no-rto-rpo-defined, kv-draft-no-backup (restore docs) | S      | The runbook states RTO ~30 min, live-score RPO ~0, draft RPO = last lock-time backup, with restore steps. |

### Phase 3 — Operational maturity

> **Status:** mostly delivered. Done: env vars documented (`.env.local.example` + README table), ADRs (`docs/adr/`), a Mermaid architecture diagram (README), the API surface + contracts (`docs/api.md`), the a11y polish (Phase 2), and a PR template. The `draft:status` script now authenticates against the cookie-guarded `GET /api/draft`.
>
> **Deliberately deferred:**
>
> - **Structured `/api/*` access log:** Vercel already logs every function invocation with method, path, status, and duration, and we emit targeted lines for the security/reliability-relevant events (audit log, `RATE_LIMIT_429`, error boundaries). A blanket wrapper would mostly duplicate the platform and add match-day noise on the high-frequency `/api/live` poll. Revisit only if we leave Vercel.
> - **Branch protection on main:** a GitHub repo setting, not a code change. Enable "require status checks + 1 review (CODEOWNERS)" in repo settings.
> - **Vercel Pro 60s cron:** an infra/billing decision. On Hobby the cron is daily; on Pro set it to `* * * * *` for a 60s heartbeat (the budget still sums under 20/min).

| Task                                                                                                                                                                                                                     | Closes                                               | Effort | Acceptance                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add `CRON_SECRET` (and `KV_*`, `DRAFT_SECRET`) to `.env.local.example` and align the README table                                                                                                                        | cron-secret-undocumented, docs-strong-readme-runbook | S      | An operator following the README sets every required env var.                                                                                                             |
| Add 3 to 4 one-page ADRs for the load-bearing decisions                                                                                                                                                                  | no-adrs                                              | S      | `docs/adr/` documents KV persistence, the canonical snapshot, free-tier caching, and degrade-to-static.                                                                   |
| Replace the README ASCII with a maintained Mermaid architecture diagram                                                                                                                                                  | no-architecture-diagram                              | S      | The diagram shows client → `/api/live` → snapshot KV, the lock-guarded refresh, the cron, and the draft KV.                                                               |
| Export request/response types (or zod-validate) and add an API surface table                                                                                                                                             | api-contracts-untyped-undocumented                   | M      | Every route's shape is documented in one place, including `/api/live`, `/api/draft`, `/api/cron/refresh`, `/api/share/*`.                                                 |
| ~~Cross-theme accent-text contrast pass + leaderboard live-region~~ DONE: amber labels meet AA, `color-contrast` re-enabled and green on all four themes, and standings overtakes are announced via a polite live region | fg-subtle-contrast-fail, live-scores-no-aria-live    | M      | Secondary/accent label text passes WCAG AA on all four themes; `color-contrast` is re-enabled in `e2e/a11y.spec.ts` and green; live leaderboard changes are announced. ✅ |
| Add a structured access-log wrapper for `/api/*` (including the cron 401)                                                                                                                                                | no-structured-request-logging                        | S      | Each `/api/*` request emits one line (method, path, status, ms).                                                                                                          |
| Add a PR template and enable branch protection on main                                                                                                                                                                   | no-pr-template-no-branch-protection-signal           | S      | PRs cannot merge without CI green and the CODEOWNERS review.                                                                                                              |
| Move to Vercel Pro and set the cron to a 60s heartbeat                                                                                                                                                                   | cron-warmer-once-daily                               | S      | The snapshot stays warm during matches; the budget math still sums under 10 req/min.                                                                                      |

## Quick wins

Each is well under 30 minutes and high leverage:

- `npm update next` to 16.2.9 and commit the lockfile (closes the HIGH advisory).
- `git rm --cached data/draft.json data/reset-draft.json` and add `data/` to `.gitignore`.
- Delete the dead `/api/matches` and `/api/standings` routes (removes the lock-bypass door outright).
- Replace `String(error)` in `src/app/api/draft/route.ts` with a generic message + server log.
- Flip `isValidDraftCookie`/`isValidDraftPassword` to deny when the secret is unset in production.
- Add `CRON_SECRET`, `KV_*`, and `DRAFT_SECRET` to `.env.local.example`.
- Add `npm audit --omit=dev --audit-level=high` as a CI step.
- Remove the dead `KV_REST_API_READ_ONLY_TOKEN` line (or wire it) so config does not imply protection it does not provide.
