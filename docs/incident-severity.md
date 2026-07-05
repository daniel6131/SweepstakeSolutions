# Incident Severity Rubric

A deliberately small 3-tier rubric for a 12-friend sweepstake. Severity sets the response
speed, not a paging chain (there is one maintainer). Map each alert to a level.

| Level | Definition                                | Examples                                                                                | Acknowledge within | Update cadence               |
| ----- | ----------------------------------------- | --------------------------------------------------------------------------------------- | ------------------ | ---------------------------- |
| SEV1  | Core flow down or draft integrity at risk | Site down, `/api/live` 5xx for all, draft assignments wiped or corrupted, secret leaked | 15 min             | Every 30 min until mitigated |
| SEV2  | Degraded but usable                       | Scores stale (upstream 429 cooloff), one tab failing, elevated error rate               | Same day           | On change                    |
| SEV3  | Minor or cosmetic                         | A delayed background refresh, a copy or layout glitch                                   | Next free evening  | On resolution                |

## First move: mitigate before root-cause

- Bad deploy: use Vercel instant rollback first, investigate after.
- Draft data problem: do NOT run `reset`. Restore from `draft:locked:latest` (see the
  football-data runbook), and snapshot `draft:state` before any restore.
- Upstream outage: nothing to do. The app auto-degrades to last-known-good then static; confirm
  the `RATE_LIMIT_429` cooloff and wait it out.

## After: write a postmortem

Any SEV1 or SEV2 gets a short blameless postmortem from `docs/postmortems/TEMPLATE.md`, with
action items filed as tracked issues.
