# World Cup Sweepstake 2026 ⚽

A sleek, dark-themed web app for tracking your World Cup 2026 sweepstake between 12 friends.

## How the Sweepstake Works

- **12 participants**, each assigned **4 national teams**
- Points accumulate from every game your teams play:
  - **Win** = 3 points
  - **Draw** = 1 point
  - **Loss** = 0 points
- Combined points across all 4 teams determine your leaderboard position

## Features

- **Leaderboard** — Live standings with podium display and full table
- **Fixtures** — All group stage matches with scores, venues, and team owners
- **Groups** — Complete group stage tables (A–L) with filtering
- **Teams** — Each participant's 4 teams with individual breakdowns
- **Protected dev console** — Edit fixture scores, simulate tournament outcomes, and preview recalculated standings locally or behind an env-gated route
- Per-tab colour themes with smooth transitions
- Floating background blobs and staggered entry animations
- Fully responsive (mobile-first)
- **Live scores** via football-data.org with ISR (auto-refreshes every 60s)

## Tech Stack

- **Next.js 15** (App Router, ISR)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **football-data.org** API (free tier, 10 req/min)
- Deployed on **Vercel**

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up your API key (optional — app works without it)
cp .env.local.example .env.local
# Edit .env.local and add your football-data.org API key

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
Browser request
      │
      ▼
┌──────────────────────────────────────────┐
│  Next.js Server (Vercel Edge)            │
│                                          │
│  page.tsx (Server Component)             │
│    │                                     │
│    ├─ loadSweepstakeData()               │
│    │    │                                │
│    │    ├─ football-data.org API ← live  │
│    │    │   (if FOOTBALL_DATA_API_KEY)    │
│    │    │                                │
│    │    └─ src/data/fixtures.ts ← static │
│    │        (fallback)                   │
│    │                                     │
│    ├─ computeLeaderboard(fixtures)       │
│    ├─ computeGroupStandings(fixtures)    │
│    │                                     │
│    └─ Passes all computed data to ───────┤
│                                          │
│  HomeClient.tsx (Client Component)       │
│    └─ Interactive tabs, animations, etc  │
│                                          │
│  revalidate: 60 (ISR)                   │
│    → Page rebuilds every 60s with fresh  │
│      scores from the API                 │
└──────────────────────────────────────────┘
```

### Data Flow

1. **Server component** (`page.tsx`) runs on every request (cached for 60s via ISR)
2. It calls `loadSweepstakeData()` which tries the football-data.org API first
3. If the API key isn't set or the request fails, it falls back to static `fixtures.ts`
4. The scoring engine computes leaderboard + group standings from whichever fixtures are available
5. All computed data is passed as props to the client component
6. The client component renders the interactive tabbed UI

### API Routes (for debugging)

- `GET /api/matches` — Returns current fixtures (live or static)
- `GET /api/matches?source=live` — Force live API (errors if not configured)
- `GET /api/matches?source=static` — Force static data
- `GET /api/standings` — Group standings from football-data.org

## Dev Console

Use `/dev-console` to override fixture scores, simulate outcomes, and validate the leaderboard, group tables, and projected knockout bracket against the same scoring engine as the main app.

- In local development, the route is enabled automatically.
- In production or preview deployments, set `ENABLE_DEV_CONSOLE=true` to expose it.
- Set `DEV_CONSOLE_PASSWORD` to require a password before the route opens.

The console stores score overrides in browser local storage so you can close and reopen it without losing your test state.

## Draft Persistence Checks

If you just want to verify what the deployed app has persisted for the draft, use the draft smoke script against the production URL instead of stepping through the whole UI:

```bash
DRAFT_API_BASE_URL=https://your-site.vercel.app npm run draft:status
```

That command calls `GET /api/draft` on the target deployment and prints a compact summary of the persisted state, including:

- current draft `status`
- total `assignments`
- remaining `availableTeams`
- whether the draft is fully locked with all 48 teams persisted

If you need a true end-to-end remote write test, the same script can run the full `reset -> start -> 48 draws -> lock` flow:

```bash
node scripts/draft-smoke.mjs complete --write --base-url=https://your-site.vercel.app
```

That write mode intentionally requires `--write` because it mutates the persisted draft state.

## Updating Scores Manually

If you prefer not to use the API, edit `src/data/fixtures.ts`:

```ts
// Before (upcoming match)
{ group: 'A', t1: 'Mexico', t2: 'South Africa', ..., s1: null, s2: null },

// After (Mexico wins 2-1)
{ group: 'A', t1: 'Mexico', t2: 'South Africa', ..., s1: 2, s2: 1 },
```

Commit and push — Vercel redeploys automatically. Everything recalculates.

## Updating Participants

Edit `src/data/participants.ts` with your actual names and team assignments.

## Environment Variables

| Variable                | Required | Description                                                                                                                 |
| ----------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `FOOTBALL_DATA_API_KEY` | No       | Free API key from [football-data.org](https://www.football-data.org/client/register). Without it, the app uses static data. |
| `ENABLE_DEV_CONSOLE`    | No       | Set to `true` to expose `/dev-console` outside local development.                                                           |
| `DEV_CONSOLE_PASSWORD`  | No       | Optional password required to unlock `/dev-console`.                                                                        |

On Vercel: Settings → Environment Variables → add `FOOTBALL_DATA_API_KEY`.

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind + animations + theme vars
│   ├── layout.tsx           # Root layout, fonts, metadata
│   ├── page.tsx             # Server component (ISR, data loading)
│   ├── HomeClient.tsx       # Client component (interactive UI)
│   └── api/
│       ├── matches/route.ts # Debug endpoint for fixture data
│       └── standings/route.ts
├── components/
│   ├── layout/              # Header, Nav, BackgroundBlobs
│   ├── ui/                  # Flag, SectionHeading, Chip
│   ├── leaderboard/         # Podium, LeaderboardTable, LeaderboardTab
│   ├── fixtures/            # FixtureCard, NationMarquee, FixturesTab
│   ├── groups/              # GroupTable, GroupsTab
│   └── teams/               # ParticipantCard, TeamsTab
├── data/                    # Static data (groups, participants, fixtures, themes)
├── lib/
│   ├── football-api.ts      # football-data.org API client + caching
│   ├── load-data.ts         # Server-side data orchestration
│   ├── scoring.ts           # Points calculation engine
│   └── utils.ts             # Helpers
└── types/
    └── index.ts             # Shared TypeScript types
```

## ISR Tuning

In `src/app/page.tsx`, adjust the `revalidate` value:

```ts
// During live matches — update every 30 seconds
export const revalidate = 30;

// Between match days — update every 5 minutes
export const revalidate = 300;

// Pre-tournament — update once per hour
export const revalidate = 3600;
```

## Deployment

```bash
npm run build
npx vercel
```

Or connect your GitHub repo to Vercel for automatic deployments on push.
