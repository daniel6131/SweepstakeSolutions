<!--
Title must follow Conventional Commits, e.g. `feat(leaderboard): ...` or
`fix(fixtures): ...`. CI gates the title. No em dashes anywhere.
-->

## What and why

<!-- A sentence or two: what changed and the reason. Link any issue. -->

## How it was verified

- [ ] `npm run validate` (type-check + lint + format)
- [ ] `npm run test` (and `npm run test:coverage` if logic changed)
- [ ] `npm run build`
- [ ] e2e / a11y where UI changed (`npm run test:e2e`)
- [ ] Screenshot / measured CWV for visual changes

## Match-day reliability (tick if relevant)

- [ ] No new uncached football-data.org fetch path (budget: 20 req/min)
- [ ] New fetch/KV paths degrade gracefully, never throw to the user
- [ ] Secrets stay server-side; no new client-exposed keys

## Notes

<!-- Follow-ups, deferred items, anything a reviewer should know. -->
