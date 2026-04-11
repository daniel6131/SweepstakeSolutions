import { GROUPS } from '@/data/groups';
import { PARTICIPANTS } from '@/data/participants';
import type {
  Fixture,
  GroupId,
  GroupStanding,
  LeaderboardEntry,
  Participant,
  TournamentGroups,
} from '@/types';

/* ── Points system ── */
const WIN_PTS = 3;
const DRAW_PTS = 1;

export type ScoringMatch = Pick<Fixture, 't1' | 't2' | 's1' | 's2'> & {
  winner?: 't1' | 't2' | null;
};

export type TeamRecord = {
  w: number;
  d: number;
  l: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
};

type HeadToHeadRecord = {
  pts: number;
  gf: number;
  ga: number;
  gd: number;
};

/**
 * Build a per-team record from all completed fixtures.
 */
function buildTeamRecords(fixtures: ScoringMatch[]): Map<string, TeamRecord> {
  const records = new Map<string, TeamRecord>();

  const ensure = (team: string) => {
    if (!records.has(team)) {
      records.set(team, { w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0, gd: 0 });
    }
    return records.get(team)!;
  };

  for (const f of fixtures) {
    if (f.s1 === null || f.s2 === null) continue;

    const r1 = ensure(f.t1);
    const r2 = ensure(f.t2);

    r1.gf += f.s1;
    r1.ga += f.s2;
    r2.gf += f.s2;
    r2.ga += f.s1;

    if (f.s1 > f.s2 || (f.s1 === f.s2 && f.winner === 't1')) {
      r1.w++;
      r1.pts += WIN_PTS;
      r2.l++;
    } else if (f.s1 < f.s2 || (f.s1 === f.s2 && f.winner === 't2')) {
      r2.w++;
      r2.pts += WIN_PTS;
      r1.l++;
    } else {
      r1.d++;
      r1.pts += DRAW_PTS;
      r2.d++;
      r2.pts += DRAW_PTS;
    }

    r1.gd = r1.gf - r1.ga;
    r2.gd = r2.gf - r2.ga;
  }

  return records;
}

function comparePrimaryLeaderboardMetrics(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf;
}

function createHeadToHeadRecord(): HeadToHeadRecord {
  return { pts: 0, gf: 0, ga: 0, gd: 0 };
}

function buildHeadToHeadTable(
  fixtures: ScoringMatch[],
  tiedNames: Set<string>,
  ownerByTeam: Map<string, string>
): Map<string, HeadToHeadRecord> {
  const table = new Map<string, HeadToHeadRecord>();

  const ensure = (name: string) => {
    if (!table.has(name)) table.set(name, createHeadToHeadRecord());
    return table.get(name)!;
  };

  for (const fixture of fixtures) {
    if (fixture.s1 === null || fixture.s2 === null) continue;

    const owner1 = ownerByTeam.get(fixture.t1);
    const owner2 = ownerByTeam.get(fixture.t2);

    if (!owner1 || !owner2 || owner1 === owner2) continue;
    if (!tiedNames.has(owner1) || !tiedNames.has(owner2)) continue;

    const record1 = ensure(owner1);
    const record2 = ensure(owner2);

    record1.gf += fixture.s1;
    record1.ga += fixture.s2;
    record2.gf += fixture.s2;
    record2.ga += fixture.s1;

    if (fixture.s1 > fixture.s2 || (fixture.s1 === fixture.s2 && fixture.winner === 't1')) {
      record1.pts += WIN_PTS;
    } else if (fixture.s1 < fixture.s2 || (fixture.s1 === fixture.s2 && fixture.winner === 't2')) {
      record2.pts += WIN_PTS;
    } else {
      record1.pts += DRAW_PTS;
      record2.pts += DRAW_PTS;
    }

    record1.gd = record1.gf - record1.ga;
    record2.gd = record2.gf - record2.ga;
  }

  return table;
}

function resolveLeaderboardTies(
  entries: LeaderboardEntry[],
  fixtures: ScoringMatch[],
  ownerByTeam: Map<string, string>
): LeaderboardEntry[] {
  const sortedByPrimary = entries
    .slice()
    .sort((a, b) => comparePrimaryLeaderboardMetrics(a, b) || a.name.localeCompare(b.name));
  const resolved: LeaderboardEntry[] = [];

  for (let index = 0; index < sortedByPrimary.length; ) {
    const current = sortedByPrimary[index];
    const tiedGroup = [current];
    index += 1;

    while (index < sortedByPrimary.length) {
      const candidate = sortedByPrimary[index];
      if (comparePrimaryLeaderboardMetrics(current, candidate) !== 0) break;
      tiedGroup.push(candidate);
      index += 1;
    }

    if (tiedGroup.length === 1) {
      resolved.push(current);
      continue;
    }

    const tiedNames = new Set(tiedGroup.map((entry) => entry.name));
    const headToHead = buildHeadToHeadTable(fixtures, tiedNames, ownerByTeam);

    tiedGroup.sort((a, b) => {
      const recordA = headToHead.get(a.name) ?? createHeadToHeadRecord();
      const recordB = headToHead.get(b.name) ?? createHeadToHeadRecord();

      return (
        recordB.pts - recordA.pts ||
        recordB.gd - recordA.gd ||
        recordB.gf - recordA.gf ||
        a.name.localeCompare(b.name)
      );
    });

    resolved.push(...tiedGroup);
  }

  return resolved;
}

/**
 * Compute the sweepstake leaderboard from a set of fixtures.
 * Each participant's total = sum of all their teams' points.
 *
 * @param participants — optional override (e.g. from draft assignments)
 */
export function computeLeaderboard(
  fixtures: ScoringMatch[],
  participants?: Participant[]
): LeaderboardEntry[] {
  const records = buildTeamRecords(fixtures);
  const roster = participants || PARTICIPANTS;
  const ownerByTeam = new Map<string, string>();

  for (const participant of roster) {
    for (const team of participant.teams) {
      ownerByTeam.set(team, participant.name);
    }
  }

  const aggregated = roster.map((p) => {
    let pts = 0,
      w = 0,
      d = 0,
      l = 0,
      gf = 0,
      ga = 0;

    for (const team of p.teams) {
      const r = records.get(team);
      if (r) {
        pts += r.pts;
        w += r.w;
        d += r.d;
        l += r.l;
        gf += r.gf;
        ga += r.ga;
      }
    }

    return { name: p.name, teams: p.teams, pts, w, d, l, gf, ga, gd: gf - ga };
  });

  return resolveLeaderboardTies(aggregated, fixtures, ownerByTeam);
}

/**
 * Compute group-stage standings for all 12 groups from a set of fixtures.
 */
export function computeGroupStandings(
  fixtures: Fixture[],
  groups: TournamentGroups = GROUPS
): Record<GroupId, GroupStanding[]> {
  const standings: Record<string, GroupStanding[]> = {};
  const fixturesByGroup = new Map<GroupId, Fixture[]>();

  for (const fixture of fixtures) {
    const groupFixtures = fixturesByGroup.get(fixture.group);
    if (groupFixtures) {
      groupFixtures.push(fixture);
      continue;
    }

    fixturesByGroup.set(fixture.group, [fixture]);
  }

  for (const [group, teams] of Object.entries(groups)) {
    const rows: GroupStanding[] = teams.map((team) => ({
      team,
      p: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      pts: 0,
    }));
    const rowsByTeam = new Map(rows.map((row) => [row.team, row]));
    const groupFixtures = fixturesByGroup.get(group as GroupId) ?? [];

    for (const f of groupFixtures) {
      if (f.s1 === null || f.s2 === null) continue;

      const r1 = rowsByTeam.get(f.t1);
      const r2 = rowsByTeam.get(f.t2);
      if (!r1 || !r2) continue;

      r1.p++;
      r2.p++;
      r1.gf += f.s1;
      r1.ga += f.s2;
      r2.gf += f.s2;
      r2.ga += f.s1;

      if (f.s1 > f.s2) {
        r1.w++;
        r1.pts += WIN_PTS;
        r2.l++;
      } else if (f.s1 < f.s2) {
        r2.w++;
        r2.pts += WIN_PTS;
        r1.l++;
      } else {
        r1.d++;
        r1.pts += DRAW_PTS;
        r2.d++;
        r2.pts += DRAW_PTS;
      }
    }

    rows.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdA = a.gf - a.ga,
        gdB = b.gf - b.ga;
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
