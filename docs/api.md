# API surface

Every route is in `src/app/api`. Types referenced below live in
`src/lib/load-data.ts` (`SweepstakeData`), `src/lib/draft-db.ts` (`DraftState`),
and `src/lib/snapshot-db.ts` (`StoredSnapshot`).

| Route                  | Method | Auth                    | Purpose                                         | Caching                                   |
| ---------------------- | ------ | ----------------------- | ----------------------------------------------- | ----------------------------------------- |
| `/api/live`            | GET    | none (public read)      | The canonical live snapshot every device polls  | `s-maxage=5, stale-while-revalidate=10`   |
| `/api/draft`           | GET    | draft cookie            | Current draft state (organiser only)            | `force-dynamic`, no store                 |
| `/api/draft`           | POST   | draft cookie + rate cap | Run a draft action: start/draw/trade/lock/reset | `force-dynamic`, no store                 |
| `/api/cron/refresh`    | GET    | `Bearer CRON_SECRET`    | Cron-warmed snapshot refresh                    | `force-dynamic`, no store                 |
| `/api/share/standings` | GET    | none + rate cap         | Leaderboard share image (PNG)                   | `s-maxage=60, stale-while-revalidate=120` |
| `/api/share/[player]`  | GET    | none + rate cap         | Per-player share image (PNG)                    | `s-maxage=60, stale-while-revalidate=120` |

## `GET /api/live`

The single read path for live data. Returns the persisted snapshot; only touches
football-data.org when the snapshot is stale, and even then a KV lock means one
refresh runs no matter how many clients poll.

- Response `200`: `SweepstakeData & { updatedAt: number }` (epoch ms the snapshot
  was computed).
- Never errors to the user: degrades to last-known-good, then static fixtures
  (see [adr/0003](adr/0003-degrade-to-static.md)).

## `GET /api/draft`

- Auth: valid `sweepstake-draft` cookie (set by `/draft/login`). `401` otherwise.
  Fails closed in production when `DRAFT_SECRET` is unset.
- Response `200`: `DraftState & { conflicts }`.
- Response `401`: `{ error: 'Unauthorized' }`.

## `POST /api/draft`

- Auth: same cookie as GET. Per-IP rate limited (`429` on abuse).
- Request body: `{ "action": "start" | "draw" | "trade" | "lock" | "reset" }`.
  For `trade`, also `{ player1, team1, player2, team2 }` (non-empty strings,
  <= 64 chars). Validated by `lib/draft-validation.ts`.
- Responses:
  - `200`: the new `DraftState` (plus `conflicts`, and `lastDrawn` for `draw`).
  - `400`: `{ error }` for invalid JSON or an unknown/invalid action.
  - `401`: `{ error: 'Unauthorized' }`.
  - `409`: `{ error: 'Draft is busy, try again' }` (write lock contended).
  - `429`: `{ error: 'Too many requests' }`.
- Every successful mutation appends an entry to the `audit:log` (actor IP,
  action, before/after assignment hash).

## `GET /api/cron/refresh`

- Auth: `Authorization: Bearer <CRON_SECRET>`. `401` otherwise. The public cannot
  trigger this upstream-touching refresh.
- Response `200`: `{ ok: true, updatedAt }`.
- Invoked by the Vercel cron in `vercel.json`.

## `GET /api/share/standings` and `GET /api/share/[player]`

- Render a 1080x1350 PNG via `next/og`, reading the canonical snapshot (no
  upstream cost). Per-IP rate limited.
- `[player]` is validated against the known participants; unknown names get a
  fast `404` before any render.
- Query params: `?demo` (mock data preview), and on `[player]`,
  `?card=standing` for the position card.
