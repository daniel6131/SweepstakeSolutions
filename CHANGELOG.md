# Changelog

All notable, user-visible changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project uses Conventional
Commits, so entries can be derived from the squash-merged commit history.

## [Unreleased]

### Added

- `/api/health` readiness probe (KV reachability plus upstream cooloff state) for uptime monitoring.
- `Retry-After` header on all rate-limited (429) responses.
- CodeQL SAST workflow for the public repo.
- CSP violation reporting (`report-to` / `report-uri` directives plus an `/api/csp-report` log sink).
- Canonical URL, `og:url`, and preview-deploy `noindex` gating.
- Operational docs: SLOs (`docs/slo.md`), incident severity rubric (`docs/incident-severity.md`), and a postmortem template.

### Changed

- The outbound football-data fetch now has a 5s timeout (`AbortSignal.timeout`) and the `/api/live` and cron refresh routes carry a `maxDuration` ceiling, so a stalled upstream degrades fast instead of hanging.

### Accessibility

- The skip link now moves focus to `<main>`; the draft login surfaces `aria-invalid` / `aria-describedby` and focuses the field on error.

---

Earlier history predates this file; see the git log (Conventional Commits) for prior changes.
