import { GROUPS } from '@/data/groups';
import { PARTICIPANTS } from '@/data/participants';
import type { Fixture, GroupId, GroupStanding, LeaderboardEntry } from '@/types';

/* ── Points system ── */
const WIN_PTS = 3;
const DRAW_PTS = 1;

export type TeamRecord = { w: number; d: number; l: number; pts: number };

/**
 * Build a per-team record from all completed fixtures.
 */
function buildTeamRecords(fixtures: Fixture[]): Map<string, TeamRecord> {
  const records = new Map<string, TeamRecord>();

  const ensure = (team: string) => {
    if (!records.has(team)) records.set(team, { w: 0, d: 0, l: 0, pts: 0 });
    return records.get(team)!;
  };

  for (const f of fixtures) {
    if (f.s1 === null || f.s2 === null) continue;

    const r1 = ensure(f.t1);
    const r2 = ensure(f.t2);

    if (f.s1 > f.s2) {
      r1.w++; r1.pts += WIN_PTS; r2.l++;
    } else if (f.s1 < f.s2) {
      r2.w++; r2.pts += WIN_PTS; r1.l++;
    } else {
      r1.d++; r1.pts += DRAW_PTS; r2.d++; r2.pts += DRAW_PTS;
    }
  }

  return records;
}

/**
 * Compute the sweepstake leaderboard from a set of fixtures.
 * Each participant's total = sum of all their teams' points.
 */
export function computeLeaderboard(fixtures: Fixture[]): LeaderboardEntry[] {
  const records = buildTeamRecords(fixtures);

  return PARTICIPANTS.map((p) => {
    let pts = 0, w = 0, d = 0, l = 0;

    for (const team of p.teams) {
      const r = records.get(team);
      if (r) { pts += r.pts; w += r.w; d += r.d; l += r.l; }
    }

    return { name: p.name, teams: p.teams, pts, w, d, l };
  }).sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));
}

/**
 * Compute group-stage standings for all 12 groups from a set of fixtures.
 */
export function computeGroupStandings(fixtures: Fixture[]): Record<GroupId, GroupStanding[]> {
  const standings: Record<string, GroupStanding[]> = {};

  for (const [group, teams] of Object.entries(GROUPS)) {
    const groupFixtures = fixtures.filter((f) => f.group === group);

    const rows: GroupStanding[] = teams.map((team) => ({
      team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0,
    }));

    for (const f of groupFixtures) {
      if (f.s1 === null || f.s2 === null) continue;

      const r1 = rows.find((r) => r.team === f.t1);
      const r2 = rows.find((r) => r.team === f.t2);
      if (!r1 || !r2) continue;

      r1.p++; r2.p++;
      r1.gf += f.s1; r1.ga += f.s2;
      r2.gf += f.s2; r2.ga += f.s1;

      if (f.s1 > f.s2) {
        r1.w++; r1.pts += WIN_PTS; r2.l++;
      } else if (f.s1 < f.s2) {
        r2.w++; r2.pts += WIN_PTS; r1.l++;
      } else {
        r1.d++; r1.pts += DRAW_PTS; r2.d++; r2.pts += DRAW_PTS;
      }
    }

    rows.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });

    standings[group] = rows;
  }

  return standings as Record<GroupId, GroupStanding[]>;
}

/**
 * Build per-team records (used by the Teams tab for individual breakdowns).
 */
export function getTeamRecords(fixtures: Fixture[]): Map<string, TeamRecord> {
  return buildTeamRecords(fixtures);
}
